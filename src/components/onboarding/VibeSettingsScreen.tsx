import { useMemo, useState } from 'react';
import { Lock, Sparkles, Home, Car, ChevronRight, X } from 'lucide-react';
import type { TranslationKey } from '@/lib/translations';
import {
  Vibe, Intensity, ConsumptionType, GameMode, Language, Player, Relation, GameType, Timing,
  VIBES, CONSUMPTION_TYPES, GAME_TYPES, TIMING_OPTIONS, GAME_MODES, SCENES,
} from '@/lib/onboarding-types';
import { t, isRTL } from '@/lib/translations';
import { useEntitlements } from '@/hooks/useEntitlements';
import OnboardingLayout from './OnboardingLayout';
import PaywallModal from '../PaywallModal';
import PlayersRelationsScreen from './PlayersRelationsScreen';
import { Sheet, SheetContent } from '@/components/ui/sheet';

// Banner icons — Fanta's illustrated shield badges
import bannerPlayersIcon     from '@/assets/banner-icons/players.svg';
import bannerGameTypesIcon   from '@/assets/banner-icons/game-types.svg';
import bannerSceneIcon       from '@/assets/banner-icons/scene.svg';
import bannerConsumptionIcon from '@/assets/banner-icons/consumption.svg';
import bannerDetailsIcon     from '@/assets/banner-icons/extra-details.svg';

interface VibeSettingsScreenProps {
  step: number;
  lang: Language;
  players: Player[];
  relations: Relation[];
  selectedVibes: Vibe[];
  selectedConsumptions: ConsumptionType[];
  consumptionLevel: Intensity;
  gameMode: GameMode;
  contextValue: string;
  hostPlayerId?: string;
  driverPlayerId?: string;
  detailsValue: string;
  selectedGameTypes: GameType[];
  timing: Timing;
  onPlayersChange: (p: Player[]) => void;
  onRelationsChange: (r: Relation[]) => void;
  onToggleVibe: (vibe: Vibe) => void;
  onToggleConsumption: (type: ConsumptionType) => void;
  onConsumptionLevelChange: (level: Intensity) => void;
  onGameModeChange: (mode: GameMode) => void;
  onContextChange: (val: string) => void;
  onHostChange: (id?: string) => void;
  onDriverChange: (id?: string) => void;
  onDetailsChange: (val: string) => void;
  onToggleGameType: (g: GameType) => void;
  onClearGameTypes: () => void;
  onTimingChange: (v: Timing) => void;
  onNext: () => void;
  onBack: () => void;
}

const QUICK_CHIPS = [
  { key: 'birthday' as const,        emoji: '🎂' },
  { key: 'someoneHasCrush' as const, emoji: '👀' },
  { key: 'reunion' as const,         emoji: '🫂' },
  { key: 'firstTime' as const,       emoji: '✨' },
];

const INTENSITY_EMOJIS = ['🌸', '🌤️', '🔥', '🌶️', '💀'];
const INTENSITY_KEYS = ['mild', 'easy', 'medium', 'spicy', 'extreme'] as const;

type PanelId = null | 'players' | 'consumption' | 'scene' | 'details' | 'gametypes';

const VibeSettingsScreen = ({
  step, lang, players, relations, selectedVibes, selectedConsumptions, consumptionLevel, gameMode,
  contextValue, hostPlayerId, driverPlayerId, detailsValue,
  selectedGameTypes, timing,
  onPlayersChange, onRelationsChange,
  onToggleVibe, onToggleConsumption, onConsumptionLevelChange, onGameModeChange,
  onContextChange, onHostChange, onDriverChange, onDetailsChange,
  onToggleGameType, onClearGameTypes, onTimingChange,
  onNext, onBack,
}: VibeSettingsScreenProps) => {
  const rtl = isRTL(lang);
  const { isPremium } = useEntitlements();
  const [paywallReason, setPaywallReason] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelId>(null);

  const handleVibe = (vibe: Vibe) => {
    onToggleVibe(vibe);
    if (!selectedVibes.includes(vibe)) navigator.vibrate?.(8);
  };

  const handleScene = (id: string) => {
    onContextChange(contextValue === id ? '' : id);
    navigator.vibrate?.(6);
  };

  const handleConsumption = (c: ConsumptionType) => {
    if (!isPremium) return setPaywallReason('Consumption settings are a premium feature.');
    onToggleConsumption(c);
  };

  const ctaReady = selectedVibes.length > 0 && players.length >= 2;
  const ctaLabel = t(lang, 'launchChaos') || 'Generate the chaos';
  const ctaSub   = t(lang, 'launchChaosSub') || 'AI creates your game instantly';

  const ORBIT_R = 96;
  const ORBIT_DUR = 38;

  const playersSummary = useMemo(() => {
    if (players.length === 0) return 'Tap to add your crew';
    const names = players.slice(0, 3).map(p => p.name).join(', ');
    const extra = players.length > 3 ? ` +${players.length - 3}` : '';
    const rels = relations.length > 0 ? ` · ${relations.length} link${relations.length > 1 ? 's' : ''}` : '';
    return `${players.length} players${extra}${rels} — ${names}`;
  }, [players, relations]);

  const sceneSummary = useMemo(() => {
    const s = SCENES.find(x => x.id === contextValue);
    const timingLabel = timing ? TIMING_OPTIONS.find(o => o.id === timing) : undefined;
    const base = s ? `${s.emoji} ${t(lang, s.labelKey as TranslationKey)}` : 'Tap to pick your questions';
    return timingLabel ? `${base} · ${timingLabel.emoji} ${timingLabel.label}` : base;
  }, [contextValue, lang, timing]);

  const gameTypesSummary = useMemo(() => {
    if (selectedGameTypes.length === 0) return 'Tap to pick your questions';
    const shown = selectedGameTypes.slice(0, 4).map(g => GAME_TYPES.find(x => x.id === g)?.emoji).join(' ');
    const extra = selectedGameTypes.length > 4 ? ` +${selectedGameTypes.length - 4}` : '';
    const lock = selectedGameTypes.length >= 2 ? ' · only these will appear' : ' · pick one more to lock';
    return `${shown}${extra}${lock}`;
  }, [selectedGameTypes]);

  const consumptionSummary = useMemo(() => {
    if (gameMode === 'family' || gameMode === 'soft') return 'Disabled in this mode';
    if (!isPremium) return 'Tap to pick your level of sobriety';
    if (selectedConsumptions.length === 0) return 'Tap to pick your level of sobriety';
    const emojis = selectedConsumptions.map(c => CONSUMPTION_TYPES.find(x => x.id === c)?.emoji).join(' ');
    return `${emojis} · Lvl ${consumptionLevel}`;
  }, [selectedConsumptions, consumptionLevel, isPremium, gameMode]);

  const detailsSummary = useMemo(() => {
    if (!isPremium) return 'Tap to add extra context';
    if (!detailsValue.trim()) return 'Tap to add extra context';
    return detailsValue.length > 48 ? detailsValue.slice(0, 46) + '…' : detailsValue;
  }, [detailsValue, isPremium]);

  return (
    <OnboardingLayout step={step} onBack={onBack}>
      <style>{`
        @keyframes vs-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes vs-orbit-rev { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes vs-float-y { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-4px); } }
        .vs-orbit-ring { animation: vs-orbit ${ORBIT_DUR}s linear infinite; }
        .vs-orbit-card { animation: vs-orbit-rev ${ORBIT_DUR}s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .vs-orbit-ring, .vs-orbit-card { animation: none !important; } }
      `}</style>

      <PaywallModal open={!!paywallReason} reason={paywallReason ?? undefined} onClose={() => setPaywallReason(null)} />

      <div className={`relative flex-1 flex flex-col gap-4 pt-2 ${rtl ? 'direction-rtl' : ''}`}>

        {/* ── Orbiting vibe cards — CIRCLES like Fanta's design ── */}
        <div className="relative w-full flex items-center justify-center" style={{ height: ORBIT_R * 2 + 80 }}>
          <div className="absolute rounded-full pointer-events-none" style={{
            width: ORBIT_R * 2 + 40, height: ORBIT_R * 2 + 40,
            background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.12), transparent 70%)',
          }} />
          {/* Center label */}
          <div className="absolute z-10 text-center px-4 pointer-events-none">
            <div className="font-display font-bold text-lg text-foreground leading-snug">
              {selectedVibes.length === 0 ? (
                <>Pick any<br />or many</>
              ) : (
                `${selectedVibes.length} selected`
              )}
            </div>
          </div>
          {/* Rotating ring */}
          <div className="relative vs-orbit-ring" style={{ width: ORBIT_R * 2, height: ORBIT_R * 2 }}>
            {VIBES.map((vibe, i) => {
              const angle = (i / VIBES.length) * 360;
              const active = selectedVibes.includes(vibe.id);
              return (
                <div key={vibe.id} className="absolute top-1/2 left-1/2" style={{
                  transform: `rotate(${angle}deg) translateY(-${ORBIT_R}px) rotate(-${angle}deg) translate(-50%, -50%)`,
                  transformOrigin: '0 0',
                }}>
                  <button onClick={() => handleVibe(vibe.id)} aria-pressed={active}
                    className={`vs-orbit-card relative w-[72px] h-[72px] rounded-full border-2 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95
                      ${active
                        ? 'border-primary bg-primary/20'
                        : 'border-white/20 bg-card/80 hover:border-primary/50'}`}
                    style={active ? { boxShadow: '0 0 24px -4px hsl(var(--primary) / 0.7)' } : undefined}>
                    {vibe.icon
                      ? <img src={vibe.icon} alt={vibe.id} className="w-10 h-10 object-contain rounded-full"
                          style={active ? { animation: 'vs-float-y 2.4s ease-in-out infinite' } : undefined} />
                      : <span className="text-2xl leading-none">{vibe.emoji}</span>}
                    <span className={`text-[9px] font-display font-bold uppercase tracking-wide mt-0.5
                      ${active ? 'text-foreground' : 'text-foreground/70'}`}>
                      {t(lang, vibe.labelKey as TranslationKey)}
                    </span>
                    {active && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Banners — Fanta's order with banner-icons ── */}
        <div className="flex flex-col gap-2.5">
          {/* Players */}
          <Banner
            icon={bannerPlayersIcon}
            title="Players"
            subtitle={playersSummary}
            hasError={players.length < 2}
            onClick={() => setOpenPanel('players')}
          />
          {/* Game types */}
          <Banner
            icon={bannerGameTypesIcon}
            title="Game types"
            subtitle={gameTypesSummary}
            onClick={() => setOpenPanel('gametypes')}
          />
          {/* Scenes */}
          <Banner
            icon={bannerSceneIcon}
            title="Scenes"
            subtitle={sceneSummary}
            onClick={() => setOpenPanel('scene')}
          />
          {/* Consumption */}
          <Banner
            icon={bannerConsumptionIcon}
            title="Consumption"
            subtitle={consumptionSummary}
            lockBadge={!isPremium}
            disabled={gameMode === 'family' || gameMode === 'soft'}
            onClick={() => {
              if (gameMode === 'family' || gameMode === 'soft') return;
              if (!isPremium) return setPaywallReason('Consumption settings are a premium feature.');
              setOpenPanel('consumption');
            }}
          />
          {/* Extra details */}
          <Banner
            icon={bannerDetailsIcon}
            title="Extra details?"
            subtitle={detailsSummary}
            lockBadge={!isPremium}
            onClick={() => {
              if (!isPremium) return setPaywallReason('Extra details are a premium feature.');
              setOpenPanel('details');
            }}
          />
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 pb-1">
          <button onClick={onNext} disabled={!ctaReady}
            className="relative w-full overflow-hidden rounded-xl py-3.5 font-display font-bold text-base text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: ctaReady ? 'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' : 'hsl(var(--primary))' }}>
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />{ctaLabel}
            </span>
            <span className="relative z-10 block text-[10.5px] font-medium opacity-85 mt-0.5">{ctaSub}</span>
          </button>
          {!ctaReady && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {players.length < 2 ? 'Add at least 2 players first.' : 'Pick at least one vibe to wake Fantito up.'}
            </p>
          )}
        </div>
      </div>

      {/* ── Players Sheet ── */}
      <Sheet open={openPanel === 'players'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0" style={{ height: '92vh' }}>
          <PlayersRelationsScreen
            step={step} lang={lang} players={players} relations={relations}
            gameMode={gameMode} onGameModeChange={onGameModeChange}
            onPlayersChange={onPlayersChange} onRelationsChange={onRelationsChange}
            onNext={() => setOpenPanel(null)} onBack={() => setOpenPanel(null)}
            embedded={true}
          />
        </SheetContent>
      </Sheet>

      {/* ── Consumption Sheet ── */}
      <Sheet open={openPanel === 'consumption'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <PanelHeader title="How are we feeling tonight?" subtitle="Pick any combo — Fantito calibrates." onClose={() => setOpenPanel(null)} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {CONSUMPTION_TYPES.map((c) => {
              const active = selectedConsumptions.includes(c.id);
              return (
                <button key={c.id} onClick={() => handleConsumption(c.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors
                    ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}`}>
                  {c.icon ? <img src={c.icon} alt={c.id} className="w-8 h-8 object-contain" /> : <span className="text-2xl">{c.emoji}</span>}
                  <div className="font-display font-bold text-sm text-foreground">{t(lang, c.labelKey as TranslationKey)}</div>
                </button>
              );
            })}
          </div>
          {selectedConsumptions.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-card border border-white/[0.08]">
              <p className="font-display font-semibold text-sm text-foreground mb-2">
                {INTENSITY_EMOJIS[consumptionLevel - 1]} {t(lang, INTENSITY_KEYS[consumptionLevel - 1])}
              </p>
              <div className="flex gap-1.5">
                {([1, 2, 3, 4, 5] as Intensity[]).map((l) => (
                  <button key={l} onClick={() => onConsumptionLevelChange(l)}
                    className={`flex-1 h-9 rounded-md border text-xs font-bold transition-all active:scale-90
                      ${l <= consumptionLevel ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-background border-white/[0.08] text-muted-foreground'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Scene Sheet ── */}
      <Sheet open={openPanel === 'scene'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <PanelHeader title="What's the scene?" subtitle="Set the stage. The questions will follow." onClose={() => setOpenPanel(null)} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {SCENES.map((s) => {
              const active = contextValue === s.id;
              return (
                <button key={s.id} onClick={() => handleScene(s.id)}
                  className={`relative flex items-center gap-2.5 p-3 rounded-xl border text-left overflow-hidden transition-colors
                    ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}`}
                  style={active ? { boxShadow: `0 0 22px -6px hsl(var(${s.tintVar}) / 0.6)` } : undefined}>
                  {s.icon ? <img src={s.icon} alt={s.id} className="w-7 h-7 object-contain" /> : <span className="text-2xl">{s.emoji}</span>}
                  <div className="font-display font-bold text-sm text-foreground">{t(lang, s.labelKey as TranslationKey)}</div>
                </button>
              );
            })}
          </div>
          {(contextValue === 'house-party' || contextValue === 'chill-night') && players.length > 0 && (
            <div className="mt-4">
              <h3 className="font-display text-sm font-bold text-foreground mb-2">
                {contextValue === 'house-party' ? "Whose house is this?" : "Whose chill night is this?"}
              </h3>
              <PlayerPicker players={players} selectedId={hostPlayerId} onSelect={onHostChange} icon={<Home className="w-3 h-3" />} clearLabel="No host" />
            </div>
          )}
          {contextValue === 'road-trip' && players.length > 0 && (
            <div className="mt-4">
              <h3 className="font-display text-sm font-bold text-foreground mb-2">Who's driving?</h3>
              <PlayerPicker players={players} selectedId={driverPlayerId} onSelect={onDriverChange} icon={<Car className="w-3 h-3" />} clearLabel="No driver" />
            </div>
          )}
          <div className="mt-5">
            <h3 className="font-display text-sm font-bold text-foreground mb-2">When is it?</h3>
            <div className="grid grid-cols-3 gap-2">
              {TIMING_OPTIONS.map((opt) => {
                const active = timing === opt.id;
                return (
                  <button key={opt.id} onClick={() => onTimingChange(active ? '' : opt.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors active:scale-95
                      ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}`}>
                    {opt.icon ? <img src={opt.icon} alt={opt.id} className="w-6 h-6 object-contain" /> : <span className="text-xl">{opt.emoji}</span>}
                    <span className="text-[11px] font-display font-bold text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Game Types Sheet ── */}
      <Sheet open={openPanel === 'gametypes'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <PanelHeader title="Game types" subtitle="Optional — pick 2+ to lock the deck. Skip to let Fantito mix everything." onClose={() => setOpenPanel(null)} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {GAME_TYPES.map((g) => {
              const active = selectedGameTypes.includes(g.id);
              return (
                <button key={g.id} onClick={() => onToggleGameType(g.id)} aria-pressed={active}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors active:scale-[0.98]
                    ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}`}>
                  {g.icon ? <img src={g.icon} alt={g.id} className="w-7 h-7 object-contain" /> : <span className="text-xl">{g.emoji}</span>}
                  <span className="font-display font-bold text-[13px] text-foreground flex-1 min-w-0 truncate">{g.label}</span>
                  {active && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              {selectedGameTypes.length === 0 && 'Optional — leave empty for the full mix.'}
              {selectedGameTypes.length === 1 && 'Pick one more to lock the deck (optional).'}
              {selectedGameTypes.length >= 2 && `🔒 Deck locked to ${selectedGameTypes.length} types.`}
            </p>
            {selectedGameTypes.length > 0 && (
              <button onClick={onClearGameTypes} className="text-[11px] font-display font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2">Clear</button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Details Sheet ── */}
      <Sheet open={openPanel === 'details'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <PanelHeader title="Extra details?" subtitle="Anything important? Birthdays, breakups, secret crushes…" onClose={() => setOpenPanel(null)} />
          <textarea value={detailsValue} onChange={e => onDetailsChange(e.target.value)}
            placeholder="Tell Fantito anything important"
            className="mt-4 w-full bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-colors min-h-[110px] resize-none" />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {QUICK_CHIPS.map((chip) => {
              const label = t(lang, chip.key);
              if (!label) return null;
              return (
                <button key={chip.key}
                  onClick={() => onDetailsChange(detailsValue ? `${detailsValue}, ${label}` : label)}
                  className="px-3 py-1.5 rounded-full bg-card border border-white/[0.08] text-xs font-display font-semibold text-foreground hover:border-primary/40 active:scale-95 transition-all">
                  {chip.emoji} {label}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </OnboardingLayout>
  );
};

/* ── Subcomponents ── */

const Banner = ({ icon, title, subtitle, onClick, lockBadge, disabled, hasError }: {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  lockBadge?: boolean;
  disabled?: boolean;
  hasError?: boolean;
}) => (
  <button onClick={onClick} disabled={disabled}
    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border bg-card text-left transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed
      ${hasError ? 'border-destructive/40' : disabled ? 'border-white/[0.06]' : 'border-white/[0.08] hover:border-primary/40 hover:bg-card/80'}`}>
    {/* Shield banner icon */}
    <img src={icon} alt={title} className="w-11 h-14 object-contain shrink-0" />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="font-display font-bold text-[15px] text-foreground truncate">{title}</span>
        {lockBadge && (
          <span className="flex items-center gap-0.5 text-[9px] font-display font-bold text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full shrink-0">
            <Lock className="w-2.5 h-2.5" />PRO
          </span>
        )}
      </div>
      <div className={`text-[11.5px] truncate mt-0.5 ${hasError ? 'text-destructive/70' : 'text-muted-foreground'}`}>{subtitle}</div>
    </div>
    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
  </button>
);

const PanelHeader = ({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
      <h2 className="font-display text-lg font-bold text-foreground leading-tight">{title}</h2>
      {subtitle && <p className="text-[12px] text-muted-foreground mt-1">{subtitle}</p>}
    </div>
    <button onClick={onClose} className="w-8 h-8 rounded-full bg-card border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Close">
      <X className="w-4 h-4" />
    </button>
  </div>
);

const PlayerPicker = ({ players, selectedId, onSelect, icon, clearLabel }: {
  players: Player[]; selectedId?: string; onSelect: (id?: string) => void; icon: React.ReactNode; clearLabel: string;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {players.map((p) => {
      const active = selectedId === p.id;
      return (
        <button key={p.id} onClick={() => onSelect(active ? undefined : p.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-display font-semibold transition-all active:scale-95
            ${active ? 'border-primary/70 bg-primary/15 text-foreground' : 'border-white/[0.08] bg-card text-foreground/80 hover:border-primary/40'}`}>
          <span className="text-base leading-none">{p.emoji}</span>
          {active && <span className="text-primary">{icon}</span>}
          <span className="truncate max-w-[90px]">{p.name}</span>
        </button>
      );
    })}
    {selectedId && (
      <button onClick={() => onSelect(undefined)} className="px-3 py-1.5 rounded-full border border-white/[0.08] bg-card text-[11px] font-display text-muted-foreground hover:border-primary/30">
        {clearLabel}
      </button>
    )}
  </div>
);

export default VibeSettingsScreen;