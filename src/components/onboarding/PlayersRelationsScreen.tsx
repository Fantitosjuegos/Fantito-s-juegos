/**
 * PlayersRelationsScreen.tsx
 * Updated: game mode selector, SVG player avatars, inline add-player flow
 */
import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Lock } from 'lucide-react';
import {
  Player, Relation, RelationType, FamilyRole, Language, GameMode,
  PLAYER_EMOJIS, PLAYER_AVATARS, PLAYER_AVATAR_MAP,
  RELATION_TYPES, GAME_MODES,
} from '@/lib/onboarding-types';
import { t, isRTL } from '@/lib/translations';
import type { TranslationKey } from '@/lib/translations';
import { useEntitlements } from '@/hooks/useEntitlements';
import OnboardingLayout from './OnboardingLayout';
import MascotBubble from './MascotBubble';
import PaywallModal from '../PaywallModal';
import RelationshipPicker from './RelationshipPicker';
import ParticleBurst from './players/ParticleBurst';
import { LINE_STYLE, FUTURE_PREVIEW, FANTITO_QUIPS, PLAYER_CANVAS_STYLES } from './players/constants';
import type { BubblePos } from './players/types';

const freeRelationsLimit = (n: number) => Math.max(1, Math.floor(n / 2));

interface Props {
  step: number; lang: Language;
  players: Player[]; relations: Relation[];
  gameMode?: GameMode;
  onGameModeChange?: (mode: GameMode) => void;
  onPlayersChange: (p: Player[]) => void;
  onRelationsChange: (r: Relation[]) => void;
  onNext: () => void; onBack: () => void;
  embedded?: boolean;
}

const PlayersRelationsScreen = ({
  step, lang, players, relations, gameMode, onGameModeChange,
  onPlayersChange, onRelationsChange, onNext, onBack, embedded = false,
}: Props) => {
  const [paywallOpen,  setPaywallOpen]  = useState(false);
  const [modeLockOpen, setModeLockOpen] = useState(false);
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [pickerPair,   setPickerPair]   = useState<{ a: string; b: string } | null>(null);
  const [previews,     setPreviews]     = useState<{ id: string; text: string }[]>([]);
  const [lastAdded,    setLastAdded]    = useState<RelationType | null>(null);
  const [bursts,       setBursts]       = useState<{ id: number; x: number; y: number }[]>([]);
  const [addingPlayer, setAddingPlayer] = useState<{ name: string; emoji: string; x: number; y: number } | null>(null);
  const [, force] = useState(0);
  const [ageGateOpen, setAgeGateOpen] = useState(false);

  const { isPremium } = useEntitlements();
  const rtl     = isRTL(lang);
  const freeCap = freeRelationsLimit(players.length);
  const atFreeCap = !isPremium && relations.length >= freeCap;

  const canvasRef    = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<Map<string, BubblePos>>(new Map());
  const burstIdRef   = useRef(0);
  const draggingRef  = useRef<{ id: string; pointerId: number; offX: number; offY: number; startX: number; startY: number; moved: boolean } | null>(null);

  useEffect(() => {
    const positions = positionsRef.current;
    const canvas    = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(280, rect.width), H = Math.max(280, rect.height), R = 36;
    const ids = new Set(players.map(p => p.id));
    for (const id of Array.from(positions.keys())) if (!ids.has(id)) positions.delete(id);
    players.forEach((p, i) => {
      if (!positions.has(p.id)) {
        const angle = i * 2.4, r = Math.min(W, H) * 0.28;
        positions.set(p.id, { id: p.id, x: Math.min(W-R, Math.max(R, W/2+Math.cos(angle)*r)), y: Math.min(H-R, Math.max(R, H/2+Math.sin(angle)*r)), vx:0, vy:0, bounce:0 });
      }
    });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const r2 = canvas.getBoundingClientRect(), w = Math.max(280, r2.width), h = Math.max(280, r2.height);
      if (!reduceMotion) {
        const arr = Array.from(positions.values()), dId = draggingRef.current?.id ?? null;
        for (let i = 0; i < arr.length; i++) for (let j = i+1; j < arr.length; j++) {
          const a = arr[i], b = arr[j], dx = b.x-a.x, dy = b.y-a.y, dist = Math.hypot(dx,dy)||0.01;
          if (dist < 72) { const f=(72-dist)*0.35, nx=dx/dist, ny=dy/dist; if (a.id!==dId){a.vx-=nx*f*dt;a.vy-=ny*f*dt;} if (b.id!==dId){b.vx+=nx*f*dt;b.vy+=ny*f*dt;} }
        }
        for (const p of arr) {
          if (p.id === draggingRef.current?.id) { p.vx=0; p.vy=0; continue; }
          p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=0.9; p.vy*=0.9;
          if (p.x<R){p.x=R;p.vx=Math.abs(p.vx)*0.5;} if (p.x>w-R){p.x=w-R;p.vx=-Math.abs(p.vx)*0.5;}
          if (p.y<R){p.y=R;p.vy=Math.abs(p.vy)*0.5;} if (p.y>h-R){p.y=h-R;p.vy=-Math.abs(p.vy)*0.5;}
        }
      }
      force(n=>(n+1)%1_000_000); raf=requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  const commitNewPlayer = () => {
    if (!addingPlayer) return;
    const name = addingPlayer.name.trim();
    if (!name || players.length >= 12) { setAddingPlayer(null); return; }
    const id = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    onPlayersChange([...players, { id, name, emoji: addingPlayer.emoji }]);
    requestAnimationFrame(() => {
      const pos = positionsRef.current.get(id);
      if (pos) { pos.x=addingPlayer.x; pos.y=addingPlayer.y; pos.bounce=performance.now(); }
    });
    setAddingPlayer(null);
  };

  const removePlayer = (id: string) => {
    onPlayersChange(players.filter(p=>p.id!==id));
    onRelationsChange(relations.filter(r=>r.player1Id!==id&&r.player2Id!==id));
    if (selectedId===id) setSelectedId(null);
  };

  const openAddPlayer = (x?: number, y?: number) => {
    if (players.length >= 12) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    setAddingPlayer({ name: '', emoji: PLAYER_EMOJIS[players.length % PLAYER_EMOJIS.length], x: x ?? (rect ? rect.width/2 : 160), y: y ?? (rect ? rect.height/2 : 160) });
  };

  const handleBubbleTap = (id: string) => {
    navigator.vibrate?.(8);
    const pos = positionsRef.current.get(id); if (pos) pos.bounce = performance.now();
    if (!selectedId) { setSelectedId(id); return; }
    if (selectedId === id) { setSelectedId(null); return; }
    setPickerPair({ a: selectedId, b: id }); setSelectedId(null);
  };
  const getPairRelation = (a: string, b: string) =>
    relations.find(r=>(r.player1Id===a&&r.player2Id===b)||(r.player1Id===b&&r.player2Id===a));
  const handlePick = (type: RelationType, familyRole?: FamilyRole) => {
    if (!pickerPair) return;
    const existing = getPairRelation(pickerPair.a, pickerPair.b), without = relations.filter(r=>r!==existing);
    if (!isPremium && !existing && without.length >= freeCap) { setPickerPair(null); setPaywallOpen(true); return; }
    onRelationsChange([...without, { type, player1Id: pickerPair.a, player2Id: pickerPair.b, familyRole }]);
    setLastAdded(type);
    const pid = `${Date.now()}-${Math.random()}`;
    setPreviews(p=>[...p,{id:pid,text:FUTURE_PREVIEW[type]}]);
    setTimeout(()=>setPreviews(p=>p.filter(x=>x.id!==pid)),3200);
    const pa=positionsRef.current.get(pickerPair.a), pb=positionsRef.current.get(pickerPair.b), rect=canvasRef.current?.getBoundingClientRect();
    if (pa&&pb&&rect) { burstIdRef.current+=1; const id=burstIdRef.current; setBursts(b=>[...b,{id,x:rect.left+(pa.x+pb.x)/2,y:rect.top+(pa.y+pb.y)/2}]); setTimeout(()=>setBursts(b=>b.filter(x=>x.id!==id)),750); }
    setPickerPair(null);
  };
  const handleRemove = () => {
    if (!pickerPair) return;
    const e=getPairRelation(pickerPair.a,pickerPair.b);
    if (e) onRelationsChange(relations.filter(r=>r!==e));
    setPickerPair(null);
  };

  const fantitoMsg = useMemo(() => {
    if (players.length < 2) return '🤠 Add at least 2 players to start the show.';
    if (relations.length >= 5) return '🔥 This group is absolutely cooked.';
    if (relations.length === 0) return '👀 Tap two players to start the drama.';
    if (lastAdded) return FANTITO_QUIPS[lastAdded];
    return '🤠 Keep going...';
  }, [players.length, relations.length, lastAdded]);

  const intensity = Math.min(1, relations.length / 6);
  const playerA = pickerPair ? players.find(p=>p.id===pickerPair.a)??null : null;
  const playerB = pickerPair ? players.find(p=>p.id===pickerPair.b)??null : null;
  const existingForPair = pickerPair ? getPairRelation(pickerPair.a, pickerPair.b) : undefined;

  const content = (
    <div className={`flex-1 flex flex-col gap-3 pt-2 ${rtl?'direction-rtl':''}`}>
      <style>{PLAYER_CANVAS_STYLES}</style>
      <PaywallModal open={paywallOpen} onClose={()=>setPaywallOpen(false)} reason={`Free accounts get ${freeCap} relation${freeCap===1?'':'s'}. Unlock premium for unlimited.`} />
      <PaywallModal open={modeLockOpen} onClose={()=>setModeLockOpen(false)} reason="Nasty +18 mode is a premium feature. Upgrade to unlock." />
      <RelationshipPicker open={!!pickerPair} lang={lang} playerA={playerA} playerB={playerB} existingType={existingForPair?.type??null} existingFamilyRole={existingForPair?.familyRole??null} onClose={()=>setPickerPair(null)} onPick={handlePick} onRemove={existingForPair?handleRemove:undefined} />
      <ParticleBurst bursts={bursts} />

      {/* Game mode selector */}
      {onGameModeChange && (
        <div>
          <h2 className="font-display text-base font-bold text-foreground mb-1.5">
            {t(lang, 'howFar' as TranslationKey) || 'How far do you want to go?'}
          </h2>
          <div className="grid grid-cols-4 gap-2">
            {GAME_MODES.map((mode) => {
              const active = gameMode === mode.id;
              const locked = !isPremium && mode.id === 'nasty18';
              return (
                <button key={mode.id}
                  onClick={() => locked ? setModeLockOpen(true) : mode.id === 'nasty18' ? setAgeGateOpen(true) : onGameModeChange(mode.id)}                  className={`relative flex flex-col items-center gap-1.5 px-1.5 pt-2 pb-2 rounded-xl border overflow-hidden transition-all active:scale-[0.97]
                    ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}
                    ${locked ? 'opacity-60' : ''}`}>
                  {locked && <Lock className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-primary z-10" />}
                  <img src={mode.icon} alt="" className="w-full h-auto aspect-square object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                  <span className={`font-display font-bold text-[11px] leading-tight text-center ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t(lang, mode.labelKey as TranslationKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <MascotBubble message={fantitoMsg} size="sm" />

      {/* Players roster */}
      <div>
        <h2 className="font-display text-base font-bold text-foreground mb-1.5">{t(lang,'addPlayers')}</h2>
        <p className="text-[11px] text-muted-foreground mb-1.5">
          {t(lang, 'tapCanvasHint' as TranslationKey) || 'Tap the canvas to add a player. Drag one onto another to link them.'}
        </p>
        {players.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {players.map(p=>(
              <div key={p.id} className="flex items-center gap-1 bg-card border border-white/[0.08] rounded-full pl-2 pr-1 py-0.5">
                {PLAYER_AVATAR_MAP[p.emoji]
                  ? <img src={PLAYER_AVATAR_MAP[p.emoji]} alt="" className="w-4 h-4 object-contain shrink-0" />
                  : <span className="text-xs">{p.emoji}</span>}
                <span className="text-[11px] font-display font-semibold text-foreground">{p.name}</span>
                <button onClick={()=>removePlayer(p.id)} className="w-4 h-4 rounded-full bg-white/[0.06] hover:bg-destructive/30 flex items-center justify-center" aria-label="Remove">
                  <X className="w-2.5 h-2.5 text-muted-foreground"/>
                </button>
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={() => openAddPlayer()}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-display font-bold text-primary-foreground active:scale-[0.98] transition-transform">
          {t(lang, 'addPlayerBtn' as TranslationKey) || '+ Add player'}
        </button>

        {addingPlayer && (
          <div className="mt-3 rounded-2xl border border-white/[0.08] bg-card p-3">
            <input autoFocus
              value={addingPlayer.name}
              onChange={(e) => setAddingPlayer({ ...addingPlayer, name: e.target.value.slice(0, 20) })}
              onKeyDown={(e) => e.key === 'Enter' && commitNewPlayer()}
              placeholder={t(lang, 'playerName') || 'Player name'}
              className="w-full bg-background border border-white/[0.08] rounded-xl px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 transition-colors"
            />
            <p className="text-[11px] text-muted-foreground mt-3 mb-2">
              {t(lang, 'pickEmoji' as TranslationKey) || 'Pick an avatar'}
            </p>
            <div className="grid grid-cols-6 gap-2">
              {PLAYER_AVATARS.map((avatar) => {
                const active = addingPlayer.emoji === avatar.emoji;
                return (
                  <button key={avatar.id} type="button"
                    onClick={() => setAddingPlayer({ ...addingPlayer, emoji: avatar.emoji })}
                    className={`aspect-square rounded-full flex items-center justify-center transition-all active:scale-90 overflow-hidden
                      ${active ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-transparent'}`}
                    aria-label={`Choose ${avatar.id}`}>
                    {avatar.icon
                      ? <img src={avatar.icon} alt="" draggable={false} className="w-full h-full object-contain scale-110 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]" />
                      : <span className="text-2xl leading-none">{avatar.emoji}</span>}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setAddingPlayer(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-sm font-display font-semibold text-muted-foreground active:scale-[0.98]">
                {t(lang, 'cancel') || 'Cancel'}
              </button>
              <button type="button" onClick={commitNewPlayer} disabled={!addingPlayer.name.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-display font-bold active:scale-[0.98] disabled:opacity-40">
                {t(lang, 'addBtn' as TranslationKey) || 'Add'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div ref={canvasRef}
        onClick={(e) => {
          const el = e.target as HTMLElement;
          if (el.closest('[data-player-bubble]') || el.closest('[data-relation-badge]')) return;
          const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
          const x = Math.max(40, Math.min(rect.width - 40, e.clientX - rect.left));
          const y = Math.max(40, Math.min(rect.height - 40, e.clientY - rect.top));
          navigator.vibrate?.(6);
          openAddPlayer(x, y);
        }}
        className="relative flex-1 min-h-[320px] rounded-3xl overflow-hidden border border-white/[0.06] cursor-pointer"
        style={{background:`radial-gradient(120% 80% at 50% 0%, hsl(var(--primary)/${0.08+intensity*0.12}) 0%, transparent 60%), radial-gradient(80% 60% at 50% 100%, hsl(330 85% 55% / ${intensity*0.18}) 0%, transparent 70%), hsl(var(--background))`}}>

        <div aria-hidden className="pointer-events-none absolute -top-10 -left-10 w-48 h-48 rounded-full blur-3xl" style={{background:`hsl(220 90% 60% / ${0.18+intensity*0.2})`,animation:'pr-blob 11s ease-in-out infinite'}}/>
        <div aria-hidden className="pointer-events-none absolute -bottom-12 -right-10 w-56 h-56 rounded-full blur-3xl" style={{background:`hsl(320 90% 60% / ${0.14+intensity*0.22})`,animation:'pr-blob2 14s ease-in-out infinite'}}/>
        {Array.from({length:6+Math.round(intensity*6)}).map((_,i)=>(
          <span key={i} aria-hidden className="absolute w-1 h-1 rounded-full bg-foreground/40" style={{left:`${(i*53)%90+5}%`,top:`${(i*31)%80+10}%`,animation:`pr-particle ${4+(i%4)}s ease-in-out ${i*0.4}s infinite`}}/>
        ))}

        <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
          {relations.map((rel,i)=>{
            const a=positionsRef.current.get(rel.player1Id), b=positionsRef.current.get(rel.player2Id);
            if (!a||!b) return null;
            const style=LINE_STYLE[rel.type], mx=(a.x+b.x)/2, my=(a.y+b.y)/2, dx=b.x-a.x, dy=b.y-a.y, norm=Math.hypot(dx,dy)||1, offX=-dy/norm*14, offY=dx/norm*14;
            const path=`M ${a.x} ${a.y} Q ${mx+offX*0.4} ${my+offY*0.4} ${b.x} ${b.y}`;
            const common={fill:'none' as const,stroke:style.stroke,strokeWidth:2.5,strokeLinecap:'round' as const,strokeDasharray:style.dash,style:{filter:`drop-shadow(0 0 6px ${style.stroke}88)`,animation:[style.pulse?'pr-line-pulse 1.6s ease-in-out infinite':null,style.dash?'pr-dash 2.4s linear infinite':null,style.jitter?'pr-jitter .25s ease-in-out infinite':null].filter(Boolean).join(', ')}};
            return (<g key={`${rel.player1Id}-${rel.player2Id}-${i}`}><path d={path} {...common}/>{style.double&&<path d={`M ${a.x+offX*0.18} ${a.y+offY*0.18} Q ${mx+offX*0.6} ${my+offY*0.6} ${b.x+offX*0.18} ${b.y+offY*0.18}`} {...common} strokeWidth={1.5}/>}</g>);
          })}
        </svg>

        {relations.map((rel,i)=>{
          const a=positionsRef.current.get(rel.player1Id), b=positionsRef.current.get(rel.player2Id);
          if (!a||!b) return null;
          const rt=RELATION_TYPES.find(r=>r.id===rel.type);
          return (
            <button key={`mid-${i}`} data-relation-badge
              onClick={()=>setPickerPair({a:rel.player1Id,b:rel.player2Id})}
              className="absolute -translate-x-1/2 -translate-y-1/2 bg-card/80 backdrop-blur border border-white/[0.1] rounded-full w-7 h-7 flex items-center justify-center active:scale-90"
              style={{left:(a.x+b.x)/2,top:(a.y+b.y)/2,animation:'pr-bubble-in .25s ease-out'}}
              aria-label="Edit relationship">
              {rt?.icon
                ? <img src={rt.icon} alt={rt.id} className="w-5 h-5 object-contain" />
                : rt?.emoji}
            </button>
          );
        })}

        {players.map((p)=>{
          const pos=positionsRef.current.get(p.id); if (!pos) return null;
          const isSelected=selectedId===p.id, isDragging=draggingRef.current?.id===p.id, recentBounce=performance.now()-pos.bounce<400;
          const avatarSrc = PLAYER_AVATAR_MAP[p.emoji];
          const onPointerDown=(e: React.PointerEvent<HTMLDivElement>)=>{const rect=canvasRef.current?.getBoundingClientRect();if(!rect)return;draggingRef.current={id:p.id,pointerId:e.pointerId,offX:e.clientX-rect.left-pos.x,offY:e.clientY-rect.top-pos.y,startX:e.clientX,startY:e.clientY,moved:false};(e.currentTarget as Element).setPointerCapture(e.pointerId);navigator.vibrate?.(4);};
          const onPointerMove=(e: React.PointerEvent<HTMLDivElement>)=>{const d=draggingRef.current;if(!d||d.id!==p.id)return;if(!d.moved&&Math.hypot(Math.abs(e.clientX-d.startX),Math.abs(e.clientY-d.startY))<6)return;d.moved=true;const rect=canvasRef.current?.getBoundingClientRect();if(!rect)return;pos.x=Math.min(rect.width-36,Math.max(36,e.clientX-rect.left-d.offX));pos.y=Math.min(rect.height-36,Math.max(36,e.clientY-rect.top-d.offY));pos.vx=0;pos.vy=0;};
          const endDrag=(e: React.PointerEvent<HTMLDivElement>)=>{const d=draggingRef.current;try{(e.currentTarget as Element).releasePointerCapture(e.pointerId);}catch{}draggingRef.current=null;if(!d)return;if(!d.moved){handleBubbleTap(p.id);return;}const dropTarget=players.find(other=>{if(other.id===p.id)return false;const op=positionsRef.current.get(other.id);return op?Math.hypot(op.x-pos.x,op.y-pos.y)<64:false;});if(dropTarget){navigator.vibrate?.(12);setPickerPair({a:p.id,b:dropTarget.id});setSelectedId(null);}};
          return (
            <div key={p.id} data-player-bubble role="button" tabIndex={0}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center select-none overflow-hidden
                ${isSelected?'ring-2 ring-primary':''} ${isDragging?'cursor-grabbing':'cursor-grab'}`}
              style={{left:pos.x,top:pos.y,width:64,height:64,touchAction:'none',zIndex:isDragging?30:10,
                transform:`translate(-50%,-50%) scale(${isDragging?1.1:1})`,
                background:'radial-gradient(circle at 30% 30%, hsl(var(--card)), hsl(var(--background)))',
                border:'1px solid hsl(var(--border))',
                animation:isDragging?undefined:(recentBounce?'pr-bubble-bounce .4s ease-out':(isSelected?'pr-ring-pulse 1.4s ease-in-out infinite':'pr-bubble-in .3s ease-out')),
                boxShadow:isDragging?'0 10px 28px rgba(0,0,0,0.45)':(isSelected?'0 0 18px hsl(var(--primary)/0.5)':'0 4px 14px rgba(0,0,0,0.3)')}}>
              {avatarSrc
                ? <img src={avatarSrc} alt="" className="w-full h-full object-contain pointer-events-none" draggable={false} />
                : <span style={{lineHeight:1,pointerEvents:'none',fontSize:'1.5rem'}}>{p.emoji}</span>}
              <span className="absolute -bottom-5 text-[10px] font-display font-bold text-foreground/90 bg-card/70 backdrop-blur px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[80px] truncate" style={{pointerEvents:'none'}}>{p.name}</span>
            </div>
          );
        })}

        {players.length < 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
            <style>{`
              @keyframes tut-tap { 0%,55%,100% { transform: translate(0,0) scale(1); opacity:.85 } 25% { transform: translate(-46px,-6px) scale(.9); opacity:1 } 60% { opacity:.85 } 80% { transform: translate(46px,-6px) scale(.9); opacity:1 } }
              @keyframes tut-ring { 0%,100% { transform: scale(1); opacity:.55 } 50% { transform: scale(1.3); opacity:0 } }
              @keyframes tut-pop { 0%,100% { transform: scale(1) } 50% { transform: scale(1.08) } }
            `}</style>
            <div className="relative w-[180px] h-[80px]">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-primary/40 bg-card/60 flex items-center justify-center overflow-hidden" style={{animation:'tut-pop 2.4s ease-in-out infinite'}}>
                {PLAYER_AVATAR_MAP['😎'] ? <img src={PLAYER_AVATAR_MAP['😎']} alt="" className="w-full h-full object-contain" /> : <span className="text-xl">😎</span>}
                <span className="absolute inset-0 rounded-full border-2 border-primary/60" style={{animation:'tut-ring 2.4s ease-out infinite'}} />
              </div>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-primary/40 bg-card/60 flex items-center justify-center overflow-hidden" style={{animation:'tut-pop 2.4s ease-in-out infinite .8s'}}>
                {PLAYER_AVATAR_MAP['🫦'] ? <img src={PLAYER_AVATAR_MAP['🫦']} alt="" className="w-full h-full object-contain" /> : <span className="text-xl">🫦</span>}
                <span className="absolute inset-0 rounded-full border-2 border-primary/60" style={{animation:'tut-ring 2.4s ease-out infinite .8s'}} />
              </div>
              <div className="absolute left-12 right-12 top-1/2 -translate-y-1/2 h-px border-t border-dashed border-primary/40" />
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 text-2xl" style={{animation:'tut-tap 2.4s ease-in-out infinite'}}>👆</div>
            </div>
            <p className="text-xs text-foreground/80 font-display font-semibold text-center">
              Tap to add players · tap two to link them
            </p>
          </div>
        )}
        {players.length>=2&&relations.length===0&&<div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground bg-card/70 backdrop-blur px-2.5 py-1 rounded-full pointer-events-none">{t(lang,'tapTwoPlayers')||'Tap two players to link them'}</div>}
        <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1 items-center pointer-events-none">
          {previews.map(pv=>(<div key={pv.id} className="text-[11px] font-display font-semibold px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent" style={{animation:'pr-preview-in .3s ease-out'}}>{pv.text}</div>))}
        </div>
      </div>

      {!isPremium&&relations.length>0&&(
        <button type="button" onClick={()=>atFreeCap&&setPaywallOpen(true)}
          className={`text-[11px] font-display font-semibold mx-auto px-2.5 py-1 rounded-full border ${atFreeCap?'border-primary/60 bg-primary/10 text-primary':'border-white/[0.08] bg-card text-muted-foreground'}`}>
          {Math.min(relations.length,freeCap)}/{freeCap} free links — Premium for unlimited
        </button>
      )}

      <div className="pt-1">
      <button onClick={onNext} disabled={players.length<2}
        className={`w-full bg-gradient-to-r from-primary via-primary to-pink-500 text-primary-foreground font-display font-bold text-base py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed ${relations.length>0?'pr-cta-active':''}`}>
        {embedded ? '✓ Done' : `❤️ ${t(lang,'launchChaos')||'Launch the chaos'}`}
      </button>
      {!embedded && <p className="text-[10px] text-center text-muted-foreground mt-1">{t(lang,'launchChaosSub')||'Takes ~3 seconds'}</p>}
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col h-full overflow-y-auto p-4">
        {content}
      </div>
    );
  }

  return (
    <OnboardingLayout step={step} onBack={onBack}>
      {content}
      {ageGateOpen && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-end justify-center px-4 pb-6">
          <div className="w-full max-w-[400px] bg-card border border-white/[0.1] rounded-3xl p-6 shadow-2xl">
            <div className="text-4xl text-center mb-3">🔞</div>
            <h2 className="font-display font-bold text-lg text-foreground text-center mb-2">Adult content</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Nasty +18 mode contains explicit themes for adults only. By continuing you confirm you are 18 or older.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setAgeGateOpen(false)}
                className="flex-1 py-3 rounded-xl border border-white/[0.08] text-sm font-display font-semibold text-muted-foreground">
                Go back
              </button>
              <button onClick={() => { onGameModeChange('nasty18'); setAgeGateOpen(false); }}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-display font-bold">
                I'm 18+
              </button>
            </div>
          </div>
        </div>
      )}
    </OnboardingLayout>
  );
};

export default PlayersRelationsScreen;