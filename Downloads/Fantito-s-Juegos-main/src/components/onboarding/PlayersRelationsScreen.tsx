import { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { Player, Relation, RelationType, FamilyRole, Language, PLAYER_EMOJIS, RELATION_TYPES } from '@/lib/onboarding-types';
import { cssVars } from '@/lib/css-utils';
import { t, isRTL } from '@/lib/translations';
import { useEntitlements } from '@/hooks/useEntitlements';
import OnboardingLayout from './OnboardingLayout';
import MascotBubble from './MascotBubble';
import PaywallModal from '../PaywallModal';
import RelationshipPicker from './RelationshipPicker';

const freeRelationsLimit = (playerCount: number) => Math.max(1, Math.floor(playerCount / 2));

interface PlayersRelationsScreenProps {
  step: number;
  lang: Language;
  players: Player[];
  relations: Relation[];
  onPlayersChange: (players: Player[]) => void;
  onRelationsChange: (relations: Relation[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Per-type stroke styling for SVG connection lines
const LINE_STYLE: Record<RelationType, { stroke: string; dash?: string; pulse?: boolean; double?: boolean; jitter?: boolean }> = {
  lovers:      { stroke: '#ec4899', pulse: true },
  crush:       { stroke: '#f472b6', pulse: true, dash: '2 4' },
  beef:        { stroke: '#ef4444', jitter: true },
  bestfriends: { stroke: '#3b82f6' },
  flirtyrel:   { stroke: '#fb923c', dash: '6 4' },
  complicated: { stroke: '#a855f7', dash: '4 6' },
  enemies:     { stroke: '#71717a', dash: '1 5' },
  roommates:   { stroke: '#14b8a6' },
  family:      { stroke: '#22c55e', double: true },
};

const FUTURE_PREVIEW: Record<RelationType, string> = {
  lovers:      '🔓 Future Q: Who falls in love too fast?',
  crush:       '🔓 Future Q: Who would secretly date someone here?',
  beef:        '🔓 Future vote: Who starts the most drama?',
  bestfriends: '🔓 Future trivia: how well do you know them?',
  flirtyrel:   '🔓 Future dare: pick your flirt move',
  complicated: "🔓 Future Q: define 'complicated'",
  enemies:     '🔓 Future vote: who survives the breakup?',
  roommates:   '🔓 Roommate confession incoming',
  family:      '🔓 Family-mode question added',
};

const FANTITO_QUIPS: Record<RelationType, string> = {
  lovers:      '👀 OHHHH this changes everything.',
  crush:       '😏 Saving that for later...',
  beef:        "💀 I'm definitely asking about this later.",
  bestfriends: '🤝 Tight crew. Easy targets.',
  flirtyrel:   '🔥 The flirty arc begins.',
  complicated: "🫣 'It's complicated.' Noted.",
  enemies:     '☠️ Bringing the popcorn.',
  roommates:   '🏠 The dishes story is coming.',
  family:      '🤠 Family drama detected.',
};

interface BubblePos {
  id: string;
  x: number; y: number;
  vx: number; vy: number;
  bounce: number; // animation timestamp
}

const PlayersRelationsScreen = ({
  step, lang, players, relations, onPlayersChange, onRelationsChange, onNext, onBack,
}: PlayersRelationsScreenProps) => {
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pickerPair, setPickerPair] = useState<{ a: string; b: string } | null>(null);
  const [previews, setPreviews] = useState<{ id: string; text: string }[]>([]);
  const [lastAdded, setLastAdded] = useState<RelationType | null>(null);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [addingPlayer, setAddingPlayer] = useState<{ name: string; emoji: string; x: number; y: number } | null>(null);
  const [, force] = useState(0);

  const { isPremium } = useEntitlements();
  const rtl = isRTL(lang);
  const freeCap = freeRelationsLimit(players.length);
  const atFreeCap = !isPremium && relations.length >= freeCap;

  const canvasRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<Map<string, BubblePos>>(new Map());
  const burstIdRef = useRef(0);
  const draggingRef = useRef<{ id: string; pointerId: number; offX: number; offY: number; startX: number; startY: number; moved: boolean } | null>(null);

  // ---- Bubble physics (subtle drift + repulsion) ----
  useEffect(() => {
    const positions = positionsRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const W = Math.max(280, rect.width);
    const H = Math.max(280, rect.height);
    const R = 36;

    // Init/cleanup positions to match players
    const ids = new Set(players.map(p => p.id));
    for (const id of Array.from(positions.keys())) if (!ids.has(id)) positions.delete(id);
    players.forEach((p, i) => {
      if (!positions.has(p.id)) {
        const angle = i * 2.4; // golden-angle-ish
        const r = Math.min(W, H) * 0.28;
        const cx = W / 2 + Math.cos(angle) * r;
        const cy = H / 2 + Math.sin(angle) * r;
        positions.set(p.id, {
          id: p.id,
          x: Math.min(W - R, Math.max(R, cx)),
          y: Math.min(H - R, Math.max(R, cy)),
          vx: 0,
          vy: 0,
          bounce: 0,
        });
      }
    });

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r2 = canvas.getBoundingClientRect();
      const w = Math.max(280, r2.width);
      const h = Math.max(280, r2.height);

      if (!reduceMotion) {
        const arr = Array.from(positions.values());
        const draggingId = draggingRef.current?.id ?? null;
        // Pairwise repulsion only on real overlap
        for (let i = 0; i < arr.length; i++) {
          for (let j = i + 1; j < arr.length; j++) {
            const a = arr[i], b = arr[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.01;
            const min = 72;
            if (dist < min) {
              const force = (min - dist) * 0.35;
              const nx = dx / dist, ny = dy / dist;
              if (a.id !== draggingId) { a.vx -= nx * force * dt; a.vy -= ny * force * dt; }
              if (b.id !== draggingId) { b.vx += nx * force * dt; b.vy += ny * force * dt; }
            }
          }
        }
        // Integrate + bounds (skip the dragged bubble)
        for (const p of arr) {
          if (p.id === draggingId) { p.vx = 0; p.vy = 0; continue; }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          // strong damping → settles to rest quickly
          p.vx *= 0.9;
          p.vy *= 0.9;
          // walls
          if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx) * 0.5; }
          if (p.x > w - R) { p.x = w - R; p.vx = -Math.abs(p.vx) * 0.5; }
          if (p.y < R) { p.y = R; p.vy = Math.abs(p.vy) * 0.5; }
          if (p.y > h - R) { p.y = h - R; p.vy = -Math.abs(p.vy) * 0.5; }
        }
      }
      force(n => (n + 1) % 1000000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  // ---- Player CRUD ----
  const commitNewPlayer = () => {
    if (!addingPlayer) return;
    const name = addingPlayer.name.trim();
    if (!name || players.length >= 12) { setAddingPlayer(null); return; }
    const id = crypto.randomUUID();
    onPlayersChange([...players, { id, name, emoji: addingPlayer.emoji }]);
    // Seed position at the tap location
    requestAnimationFrame(() => {
      const pos = positionsRef.current.get(id);
      if (pos) { pos.x = addingPlayer.x; pos.y = addingPlayer.y; pos.bounce = performance.now(); }
    });
    setAddingPlayer(null);
  };

  const removePlayer = (id: string) => {
    onPlayersChange(players.filter(p => p.id !== id));
    onRelationsChange(relations.filter(r => r.player1Id !== id && r.player2Id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // ---- Bubble tap → link flow ----
  const handleBubbleTap = (id: string) => {
    navigator.vibrate?.(8);
    const pos = positionsRef.current.get(id);
    if (pos) pos.bounce = performance.now();
    if (!selectedId) { setSelectedId(id); return; }
    if (selectedId === id) { setSelectedId(null); return; }
    setPickerPair({ a: selectedId, b: id });
    setSelectedId(null);
  };

  const getPairRelation = (a: string, b: string) =>
    relations.find(r => (r.player1Id === a && r.player2Id === b) || (r.player1Id === b && r.player2Id === a));

  const handlePick = (type: RelationType, familyRole?: FamilyRole) => {
    if (!pickerPair) return;
    const existing = getPairRelation(pickerPair.a, pickerPair.b);
    const without = relations.filter(r => r !== existing);

    if (!isPremium && !existing && without.length >= freeCap) {
      setPickerPair(null);
      setPaywallOpen(true);
      return;
    }
    onRelationsChange([
      ...without,
      { type, player1Id: pickerPair.a, player2Id: pickerPair.b, familyRole },
    ]);
    setLastAdded(type);

    // Future-card preview
    const pid = `${Date.now()}-${Math.random()}`;
    setPreviews(p => [...p, { id: pid, text: FUTURE_PREVIEW[type] }]);
    setTimeout(() => setPreviews(p => p.filter(x => x.id !== pid)), 3200);

    // Particle burst at midpoint
    const pa = positionsRef.current.get(pickerPair.a);
    const pb = positionsRef.current.get(pickerPair.b);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (pa && pb && rect) {
      burstIdRef.current += 1;
      const id = burstIdRef.current;
      const mx = rect.left + (pa.x + pb.x) / 2;
      const my = rect.top + (pa.y + pb.y) / 2;
      setBursts(b => [...b, { id, x: mx, y: my }]);
      setTimeout(() => setBursts(b => b.filter(x => x.id !== id)), 750);
    }
    setPickerPair(null);
  };

  const handleRemove = () => {
    if (!pickerPair) return;
    const existing = getPairRelation(pickerPair.a, pickerPair.b);
    if (existing) onRelationsChange(relations.filter(r => r !== existing));
    setPickerPair(null);
  };

  // ---- Fantito message ----
  const fantitoMsg = useMemo(() => {
    if (players.length < 2) return '🤠 Add at least 2 players to start the show.';
    if (relations.length >= 5) return '🔥 This group is absolutely cooked.';
    if (relations.length === 0) return '👀 Tap two players to start the drama.';
    if (lastAdded) return FANTITO_QUIPS[lastAdded];
    return '🤠 Keep going...';
  }, [players.length, relations.length, lastAdded]);

  // ---- Atmosphere intensity (0..1) ----
  const intensity = Math.min(1, relations.length / 6);

  const playerA = pickerPair ? players.find(p => p.id === pickerPair.a) ?? null : null;
  const playerB = pickerPair ? players.find(p => p.id === pickerPair.b) ?? null : null;
  const existingForPair = pickerPair ? getPairRelation(pickerPair.a, pickerPair.b) : undefined;

  return (
    <OnboardingLayout step={step} onBack={onBack}>
      <style>{`
        @keyframes pr-blob { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-10px) scale(1.08)} }
        @keyframes pr-blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-18px,12px) scale(1.05)} }
        @keyframes pr-particle { 0%,100%{transform:translate(0,0);opacity:.35} 50%{transform:translate(8px,-12px);opacity:.7} }
        @keyframes pr-bubble-in { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes pr-bubble-bounce { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 100%{transform:scale(1)} }
        @keyframes pr-ring-pulse { 0%,100%{box-shadow:0 0 0 0 hsl(var(--primary)/.5)} 50%{box-shadow:0 0 0 8px hsl(var(--primary)/0)} }
        @keyframes pr-line-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }
        @keyframes pr-dash { to { stroke-dashoffset: -40; } }
        @keyframes pr-jitter { 0%,100%{transform:translate(0,0)} 25%{transform:translate(.6px,-.5px)} 75%{transform:translate(-.6px,.5px)} }
        @keyframes pr-burst { from{transform:translate(0,0) scale(1);opacity:1} to{transform:translate(var(--bx),var(--by)) scale(0);opacity:0} }
        @keyframes pr-cta-glow { 0%,100%{box-shadow:0 0 0 0 hsl(var(--primary)/.45)} 50%{box-shadow:0 0 28px 4px hsl(var(--primary)/.5)} }
        @keyframes pr-preview-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .pr-cta-active { animation: pr-cta-glow 2s ease-in-out infinite; }
      `}</style>

      <PaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        reason={`Free accounts get ${freeCap} relation${freeCap === 1 ? '' : 's'} (1 per pair). Unlock premium for unlimited.`}
      />

      <RelationshipPicker
        open={!!pickerPair}
        lang={lang}
        playerA={playerA}
        playerB={playerB}
        existingType={existingForPair?.type ?? null}
        existingFamilyRole={existingForPair?.familyRole ?? null}
        onClose={() => setPickerPair(null)}
        onPick={handlePick}
        onRemove={existingForPair ? handleRemove : undefined}
      />

      {/* Add Player modal */}
      {addingPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setAddingPlayer(null)}
        >
          <div
            className="w-full max-w-sm bg-card border border-white/[0.08] rounded-3xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'pr-bubble-in .25s ease-out' }}
          >
            <h3 className="font-display font-bold text-lg text-foreground mb-3 text-center">
              New player
            </h3>
            <input
              autoFocus
              value={addingPlayer.name}
              onChange={(e) => setAddingPlayer({ ...addingPlayer, name: e.target.value.slice(0, 20) })}
              onKeyDown={(e) => e.key === 'Enter' && commitNewPlayer()}
              placeholder={t(lang, 'playerName')}
              className="w-full bg-background border border-white/[0.08] rounded-xl px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground mt-3 mb-2">Pick an emoji</p>
            <div className="grid grid-cols-6 gap-2">
              {PLAYER_EMOJIS.map((em) => {
                const active = addingPlayer.emoji === em;
                return (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setAddingPlayer({ ...addingPlayer, emoji: em })}
                    className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all active:scale-90 ${
                      active
                        ? 'bg-primary/20 border-2 border-primary scale-110'
                        : 'bg-background border border-white/[0.08]'
                    }`}
                    aria-label={`Choose ${em}`}
                  >
                    {em}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => setAddingPlayer(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm font-display font-semibold text-muted-foreground active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commitNewPlayer}
                disabled={!addingPlayer.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-display font-bold active:scale-[0.98] disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global particle bursts */}
      {bursts.map(b => (
        <div key={b.id} className="fixed pointer-events-none z-40" style={{ left: b.x, top: b.y }}>
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = (i / 10) * Math.PI * 2;
            const dist = 30 + Math.random() * 20;
            return (
              <span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                style={{
                  ...cssVars({
                    '--bx': `${Math.cos(angle) * dist}px`,
                    '--by': `${Math.sin(angle) * dist}px`,
                  }),
                  animation: 'pr-burst .7s ease-out forwards',
                }}
              />
            );
          })}
        </div>
      ))}

      <div className={`flex-1 flex flex-col gap-3 pt-2 ${rtl ? 'direction-rtl' : ''}`}>
        <MascotBubble message={fantitoMsg} size="sm" />

        {/* Players header + roster chips */}
        <div>
          <h2 className="font-display text-base font-bold text-foreground mb-1.5">
            {t(lang, 'addPlayers')}
          </h2>
          <p className="text-[11px] text-muted-foreground mb-1.5">
            Tap the canvas to add a player. Drag one onto another to link them.
          </p>
          {players.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {players.map(p => (
                <div key={p.id} className="flex items-center gap-1 bg-card border border-white/[0.08] rounded-full pl-2 pr-1 py-0.5">
                  <span className="text-xs">{p.emoji}</span>
                  <span className="text-[11px] font-display font-semibold text-foreground">{p.name}</span>
                  <button onClick={() => removePlayer(p.id)} className="w-4 h-4 rounded-full bg-white/[0.06] hover:bg-destructive/30 flex items-center justify-center" aria-label="Remove">
                    <X className="w-2.5 h-2.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Playground canvas */}
        <div
          ref={canvasRef}
          onPointerDown={(e) => {
            // Tap on empty canvas (not on a bubble) → open add-player modal
            // Ignore taps that originate on a player bubble or the mid-line relation badge
            const el = e.target as HTMLElement;
            if (el.closest('[data-player-bubble]') || el.closest('[data-relation-badge]')) return;
            if (players.length >= 12) return;
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;
            const x = Math.max(40, Math.min(rect.width - 40, e.clientX - rect.left));
            const y = Math.max(40, Math.min(rect.height - 40, e.clientY - rect.top));
            navigator.vibrate?.(6);
            setAddingPlayer({ name: '', emoji: PLAYER_EMOJIS[players.length % PLAYER_EMOJIS.length], x, y });
          }}
          className="relative flex-1 min-h-[320px] rounded-3xl overflow-hidden border border-white/[0.06] cursor-pointer"
          style={{
            background: `radial-gradient(120% 80% at 50% 0%, hsl(var(--primary)/${0.08 + intensity * 0.12}) 0%, transparent 60%), radial-gradient(80% 60% at 50% 100%, hsl(330 85% 55% / ${intensity * 0.18}) 0%, transparent 70%), hsl(var(--background))`,
          }}
        >
          {/* Ambient blobs */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl"
            style={{ background: `hsl(220 90% 60% / ${0.18 + intensity * 0.2})`, animation: 'pr-blob 11s ease-in-out infinite' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -right-10 w-56 h-56 rounded-full blur-3xl"
            style={{ background: `hsl(320 90% 60% / ${0.14 + intensity * 0.22})`, animation: 'pr-blob2 14s ease-in-out infinite' }}
          />
          {/* Ambient particles */}
          {Array.from({ length: 6 + Math.round(intensity * 6) }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className="absolute w-1 h-1 rounded-full bg-foreground/40"
              style={{
                left: `${(i * 53) % 90 + 5}%`,
                top: `${(i * 31) % 80 + 10}%`,
                animation: `pr-particle ${4 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
              }}
            />
          ))}

          {/* Connection lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
            {relations.map((rel, i) => {
              const a = positionsRef.current.get(rel.player1Id);
              const b = positionsRef.current.get(rel.player2Id);
              if (!a || !b) return null;
              const style = LINE_STYLE[rel.type];
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              const dx = b.x - a.x, dy = b.y - a.y;
              const norm = Math.hypot(dx, dy) || 1;
              const offX = -dy / norm * 14;
              const offY = dx / norm * 14;
              const path = `M ${a.x} ${a.y} Q ${mx + offX * 0.4} ${my + offY * 0.4} ${b.x} ${b.y}`;
              const common = {
                fill: 'none' as const,
                stroke: style.stroke,
                strokeWidth: 2.5,
                strokeLinecap: 'round' as const,
                strokeDasharray: style.dash,
                style: {
                  filter: `drop-shadow(0 0 6px ${style.stroke}88)`,
                  animation: [
                    style.pulse ? 'pr-line-pulse 1.6s ease-in-out infinite' : null,
                    style.dash ? 'pr-dash 2.4s linear infinite' : null,
                    style.jitter ? 'pr-jitter .25s ease-in-out infinite' : null,
                  ].filter(Boolean).join(', '),
                },
              };
              return (
                <g key={`${rel.player1Id}-${rel.player2Id}-${i}`}>
                  <path d={path} {...common} />
                  {style.double && (
                    <path d={`M ${a.x + offX * 0.18} ${a.y + offY * 0.18} Q ${mx + offX * 0.6} ${my + offY * 0.6} ${b.x + offX * 0.18} ${b.y + offY * 0.18}`} {...common} strokeWidth={1.5} />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Mid-line emoji badges */}
          {relations.map((rel, i) => {
            const a = positionsRef.current.get(rel.player1Id);
            const b = positionsRef.current.get(rel.player2Id);
            if (!a || !b) return null;
            const rt = RELATION_TYPES.find(r => r.id === rel.type);
            return (
              <button
                key={`mid-${i}`}
                data-relation-badge
                onClick={() => setPickerPair({ a: rel.player1Id, b: rel.player2Id })}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-base bg-card/80 backdrop-blur border border-white/[0.1] rounded-full w-7 h-7 flex items-center justify-center active:scale-90"
                style={{ left: (a.x + b.x) / 2, top: (a.y + b.y) / 2, animation: 'pr-bubble-in .25s ease-out' }}
                aria-label="Edit relationship"
              >
                {rt?.emoji}
              </button>
            );
          })}

          {/* Player bubbles */}
          {players.map((p) => {
            const pos = positionsRef.current.get(p.id);
            if (!pos) return null;
            const isSelected = selectedId === p.id;
            const recentBounce = performance.now() - pos.bounce < 400;
            const isDragging = draggingRef.current?.id === p.id;

            const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              const px = e.clientX - rect.left;
              const py = e.clientY - rect.top;
              draggingRef.current = {
                id: p.id,
                pointerId: e.pointerId,
                offX: px - pos.x,
                offY: py - pos.y,
                startX: e.clientX,
                startY: e.clientY,
                moved: false,
              };
              (e.currentTarget as Element).setPointerCapture(e.pointerId);
              navigator.vibrate?.(4);
            };
            const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
              const d = draggingRef.current;
              if (!d || d.id !== p.id) return;
              const dxAbs = Math.abs(e.clientX - d.startX);
              const dyAbs = Math.abs(e.clientY - d.startY);
              if (!d.moved && Math.hypot(dxAbs, dyAbs) < 6) return;
              d.moved = true;
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return;
              const R = 36;
              const w = rect.width, h = rect.height;
              const nx = e.clientX - rect.left - d.offX;
              const ny = e.clientY - rect.top - d.offY;
              pos.x = Math.min(w - R, Math.max(R, nx));
              pos.y = Math.min(h - R, Math.max(R, ny));
              pos.vx = 0; pos.vy = 0;
            };
            const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
              const d = draggingRef.current;
              try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
              draggingRef.current = null;
              if (!d) return;
              if (!d.moved) { handleBubbleTap(p.id); return; }
              // Drop-on-other-player → open relation picker
              const dropTarget = players.find(other => {
                if (other.id === p.id) return null;
                const op = positionsRef.current.get(other.id);
                if (!op) return false;
                return Math.hypot(op.x - pos.x, op.y - pos.y) < 64;
              });
              if (dropTarget) {
                navigator.vibrate?.(12);
                setPickerPair({ a: p.id, b: dropTarget.id });
                setSelectedId(null);
              }
            };

            return (
              <div
                key={p.id}
                data-player-bubble
                role="button"
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center text-2xl select-none ${
                  isSelected ? 'ring-2 ring-primary' : ''
                } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: 64, height: 64,
                  touchAction: 'none',
                  zIndex: isDragging ? 30 : 10,
                  transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
                  background: 'radial-gradient(circle at 30% 30%, hsl(var(--card)), hsl(var(--background)))',
                  border: '1px solid hsl(var(--border))',
                  animation: isDragging
                    ? undefined
                    : (recentBounce
                        ? 'pr-bubble-bounce .4s ease-out'
                        : (isSelected ? 'pr-ring-pulse 1.4s ease-in-out infinite' : 'pr-bubble-in .3s ease-out')),
                  boxShadow: isDragging
                    ? '0 10px 28px rgba(0,0,0,0.45)'
                    : (isSelected ? '0 0 18px hsl(var(--primary)/0.5)' : '0 4px 14px rgba(0,0,0,0.3)'),
                }}
              >
                <span style={{ lineHeight: 1, pointerEvents: 'none' }}>{p.emoji}</span>
                <span className="absolute -bottom-5 text-[10px] font-display font-bold text-foreground/90 bg-card/70 backdrop-blur px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[80px] truncate" style={{ pointerEvents: 'none' }}>
                  {p.name}
                </span>
              </div>
            );
          })}

          {/* Empty state */}
          {players.length < 2 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-muted-foreground italic">{t(lang, 'addAtLeast2')}</p>
            </div>
          )}
          {players.length >= 2 && relations.length === 0 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground bg-card/70 backdrop-blur px-2.5 py-1 rounded-full pointer-events-none">
              {t(lang, 'tapTwoPlayers') || 'Tap two players to link them'}
            </div>
          )}

          {/* Future-card previews (anchored bottom) */}
          <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 items-center pointer-events-none">
            {previews.map(p => (
              <div
                key={p.id}
                className="text-[11px] font-display font-semibold px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent"
                style={{ animation: 'pr-preview-in .3s ease-out' }}
              >
                {p.text}
              </div>
            ))}
          </div>
        </div>

        {!isPremium && relations.length > 0 && (
          <button
            type="button"
            onClick={() => atFreeCap && setPaywallOpen(true)}
            className={`text-[11px] font-display font-semibold mx-auto px-2.5 py-1 rounded-full border ${
              atFreeCap ? 'border-primary/60 bg-primary/10 text-primary' : 'border-white/[0.08] bg-card text-muted-foreground'
            }`}
          >
            {Math.min(relations.length, freeCap)} / {freeCap} free links — Premium for unlimited
          </button>
        )}

        <div className="pt-1">
          <button
            onClick={onNext}
            disabled={players.length < 2}
            className={`w-full bg-gradient-to-r from-primary via-primary to-pink-500 text-primary-foreground font-display font-bold text-base py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              relations.length > 0 ? 'pr-cta-active' : ''
            }`}
          >
            ❤️ {t(lang, 'launchChaos') || 'Launch the chaos'}
          </button>
          <p className="text-[10px] text-center text-muted-foreground mt-1">
            {t(lang, 'launchChaosSub') || 'Takes ~3 seconds'}
          </p>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default PlayersRelationsScreen;