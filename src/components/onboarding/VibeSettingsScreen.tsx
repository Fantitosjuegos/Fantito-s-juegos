import { useMemo, useState } from 'react';
import { Lock, Sparkles, Home, Car, ChevronRight, X } from 'lucide-react';
import { cssVars } from '@/lib/css-utils';
import type { TranslationKey } from '@/lib/translations';
import {
  Vibe, Intensity, ConsumptionType, GameMode, Language, Player, GameType, Timing,
  VIBES, CONSUMPTION_TYPES, GAME_TYPES, TIMING_OPTIONS,
} from '@/lib/onboarding-types';
import { t, isRTL } from '@/lib/translations';
import { useEntitlements } from '@/hooks/useEntitlements';
import OnboardingLayout from './OnboardingLayout';

import PaywallModal from '../PaywallModal';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface VibeSettingsScreenProps {
  step: number;
  lang: Language;
  players: Player[];
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

const SCENE_OPTIONS: { id: string; labelKey: 'houseParty'|'atABar'|'roadTrip'|'pregame'|'chillNight'|'vacation'|'afterparty'|'coffeeShop'; emoji: string; tintVar: string }[] = [
  { id: 'house-party', labelKey: 'houseParty', emoji: '🏠', tintVar: '--tint-house-party' },
  { id: 'bar',         labelKey: 'atABar',     emoji: '🍻', tintVar: '--tint-bar' },
  { id: 'road-trip',   labelKey: 'roadTrip',   emoji: '🚗', tintVar: '--tint-road-trip' },
  { id: 'pregame',     labelKey: 'pregame',    emoji: '🎉', tintVar: '--tint-pregame' },
  { id: 'chill-night', labelKey: 'chillNight', emoji: '🛋️', tintVar: '--tint-chill-night' },
  { id: 'vacation',    labelKey: 'vacation',   emoji: '🌴', tintVar: '--tint-vacation' },
  { id: 'afterparty',  labelKey: 'afterparty', emoji: '🌙', tintVar: '--tint-pregame' },
  { id: 'coffee-shop', labelKey: 'coffeeShop', emoji: '☕', tintVar: '--tint-chill-night' },
];


const QUICK_CHIPS = [
  { key: 'birthday' as const,        emoji: '🎂' },
  { key: 'someoneHasCrush' as const, emoji: '👀' },
  { key: 'reunion' as const,         emoji: '🫂' },
  { key: 'firstTime' as const,       emoji: '✨' },
  { key: 'justVibing' as const,      emoji: '💫' },
];

const INTENSITY_EMOJIS = ['🌸', '🌤️', '🔥', '🌶️', '💀'];
const INTENSITY_KEYS = ['mild', 'easy', 'medium', 'spicy', 'extreme'] as const;


type PanelId = null | 'consumption' | 'scene' | 'details' | 'gametypes';

const VibeSettingsScreen = ({
  step, lang, players, selectedVibes, selectedConsumptions, consumptionLevel, gameMode,
  contextValue, hostPlayerId, driverPlayerId, detailsValue,
  selectedGameTypes, timing,
  onToggleVibe, onToggleConsumption, onConsumptionLevelChange,
  onContextChange, onHostChange, onDriverChange, onDetailsChange,
  onToggleGameType, onClearGameTypes, onTimingChange,
  onNext, onBack,
}: VibeSettingsScreenProps) => {
  const rtl = isRTL(lang);
  const { isPremium } = useEntitlements();
  const [paywallReason, setPaywallReason] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelId>(null);

  const handleDetailsChange = (v: string) => {
    onDetailsChange(v);
  };

  const handleVibe = (vibe: Vibe) => {
    onToggleVibe(vibe);
    if (!selectedVibes.includes(vibe)) {
      navigator.vibrate?.(8);
    }
  };

  const handleScene = (id: string) => {
    onContextChange(contextValue === id ? '' : id);
    navigator.vibrate?.(6);
  };

  const handleConsumption = (c: ConsumptionType) => {
    if (!isPremium) return setPaywallReason('Consumption settings are a premium feature.');
    onToggleConsumption(c);
  };

  const ctaReady = selectedVibes.length > 0;
  const ctaLabel = (t(lang, 'launchChaos')) || 'Generate the chaos';
  const ctaSub   = (t(lang, 'launchChaosSub')) || 'AI creates your game instantly';

  // Orbit geometry
  const ORBIT_R = 96; // px radius
  const ORBIT_DUR = 38; // seconds per revolution

  const sceneSummary = useMemo(() => {
    const s = SCENE_OPTIONS.find(x => x.id === contextValue);
    const timingLabel = timing ? TIMING_OPTIONS.find(o => o.id === timing) : undefined;
    const base = s ? `${s.emoji} ${t(lang, s.labelKey as TranslationKey)}` : 'Tap to set the stage';
    return timingLabel ? `${base} · ${timingLabel.emoji} ${timingLabel.label}` : base;
  }, [contextValue, lang, timing]);

  const gameTypesSummary = useMemo(() => {
    if (selectedGameTypes.length === 0) return 'Optional · Fantito picks the mix';
    const shown = selectedGameTypes.slice(0, 4).map(g => GAME_TYPES.find(x => x.id === g)?.emoji).join(' ');
    const extra = selectedGameTypes.length > 4 ? ` +${selectedGameTypes.length - 4}` : '';
    const lock = selectedGameTypes.length >= 2 ? ' · only these will appear' : ' · pick one more to lock';
    return `${shown}${extra}${lock}`;
  }, [selectedGameTypes]);

  const consumptionSummary = useMemo(() => {
    if (gameMode === 'family') return 'Disabled in Family mode';
    if (!isPremium) return 'Premium · tap to learn more';
    if (selectedConsumptions.length === 0) return 'Tap to pick';
    const emojis = selectedConsumptions.map(c => CONSUMPTION_TYPES.find(x => x.id === c)?.emoji).join(' ');
    return `${emojis} · Lvl ${consumptionLevel}`;
  }, [selectedConsumptions, consumptionLevel, isPremium, gameMode]);

  const detailsSummary = useMemo(() => {
    if (!isPremium) return 'Premium · tap to learn more';
    if (!detailsValue.trim()) return 'Add context, birthdays, secrets…';
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
        @media (prefers-reduced-motion: reduce) {
          .vs-orbit-ring, .vs-orbit-card { animation: none !important; }
        }
      `}</style>

      <PaywallModal
        open={!!paywallReason}
        reason={paywallReason ?? undefined}
        onClose={() => setPaywallReason(null)}
      />

      <div className={`relative flex-1 flex flex-col gap-4 pt-2 ${rtl ? 'direction-rtl' : ''}`}>

        {/* ============= TOP: Orbiting vibe cards ============= */}
        <div className="relative w-full flex items-center justify-center" style={{ height: ORBIT_R * 2 + 80 }}>
          {/* Soft halo */}
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: ORBIT_R * 2 + 40,
              height: ORBIT_R * 2 + 40,
              background: 'radial-gradient(closest-side, hsl(var(--primary) / 0.12), transparent 70%)',
            }}
          />
          {/* Center label */}
          <div className="absolute z-10 text-center px-4 pointer-events-none">
            <div className="text-[10px] font-display font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Tonight's vibe
            </div>
            <div className="font-display font-bold text-sm text-foreground mt-0.5">
              {selectedVibes.length === 0 ? 'Pick any' : `${selectedVibes.length} selected`}
            </div>
          </div>

          {/* Rotating ring */}
          <div className="relative vs-orbit-ring" style={{ width: ORBIT_R * 2, height: ORBIT_R * 2 }}>
            {VIBES.map((vibe, i) => {
              const angle = (i / VIBES.length) * 360;
              const active = selectedVibes.includes(vibe.id);
              return (
                <div
                  key={vibe.id}
                  className="absolute top-1/2 left-1/2"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-${ORBIT_R}px) rotate(-${angle}deg) translate(-50%, -50%)`,
                    transformOrigin: '0 0',
                  }}
                >
                  <button
                    onClick={() => handleVibe(vibe.id)}
                    className={`vs-orbit-card group relative w-[68px] h-[68px] rounded-2xl border flex flex-col items-center justify-center gap-0.5
                      transition-colors active:scale-95
                      ${active
                        ? 'border-primary/70 bg-primary/15'
                        : 'border-white/[0.08] bg-card hover:border-primary/40'}`}
                    style={active ? { boxShadow: '0 0 24px -6px hsl(var(--primary) / 0.65)' } : undefined}
                    aria-pressed={active}
                  >
                    <span
                      className="text-2xl leading-none"
                      style={active ? { animation: 'vs-float-y 2.4s ease-in-out infinite' } : undefined}
                    >
                      {vibe.emoji}
                    </span>
                    <span className={`text-[10px] font-display font-bold ${active ? 'text-foreground' : 'text-foreground/80'}`}>
                      {t(lang, vibe.labelKey)}
                    </span>
                    {active && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============= BOTTOM: 3 banners ============= */}
        <div className="flex flex-col gap-2.5">
          <Banner
            emoji={gameMode === 'family' ? '🚫' : '🍻'}
            title="How are we feeling tonight?"
            subtitle={consumptionSummary}
            lockBadge={!isPremium}
            disabled={gameMode === 'family'}
            onClick={() => {
              if (gameMode === 'family') return;
              if (!isPremium) return setPaywallReason('Consumption settings are a premium feature.');
              setOpenPanel('consumption');
            }}
          />
          <Banner
            emoji="🎬"
            title="What's the scene?"
            subtitle={sceneSummary}
            onClick={() => setOpenPanel('scene')}
          />
          <Banner
            emoji="📝"
            title="Extra details ?"
            subtitle={detailsSummary}
            lockBadge={!isPremium}
            onClick={() => {
              if (!isPremium) return setPaywallReason('Extra details are a premium feature.');
              setOpenPanel('details');
            }}
          />
          <Banner
            emoji="🎮"
            title="Game types"
            subtitle={gameTypesSummary}
            onClick={() => setOpenPanel('gametypes')}
          />
        </div>


        {/* CTA */}
        <div className="mt-auto pt-3 pb-1">
          <button
            onClick={onNext}
            disabled={!ctaReady}
            className={`relative w-full overflow-hidden rounded-xl py-3.5 font-display font-bold text-base
              text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40`}
            style={{
              background: ctaReady
                ? 'linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)'
                : 'hsl(var(--primary))',
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {ctaLabel}
            </span>
            <span className="relative z-10 block text-[10.5px] font-medium opacity-85 mt-0.5">
              {ctaSub}
            </span>
          </button>
          {!ctaReady && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              Pick at least one vibe to wake Fantito up.
            </p>
          )}
        </div>
      </div>

      {/* ============= Bottom Sheets ============= */}
      <Sheet open={openPanel === 'consumption'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <PanelHeader title="How are we feeling tonight?" subtitle="Pick any combo — Fantito calibrates." onClose={() => setOpenPanel(null)} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {CONSUMPTION_TYPES.map((c) => {
              const active = selectedConsumptions.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleConsumption(c.id)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-colors
                    ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}`}
                >
                  <span className="text-2xl leading-none">{c.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm text-foreground">{t(lang, c.labelKey)}</div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedConsumptions.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-card border border-white/[0.08]">
              <p className="font-display font-semibold text-sm text-foreground mb-2">
                {t(lang, INTENSITY_KEYS[consumptionLevel - 1])}
              </p>
              <div className="flex gap-1.5">
                {([1, 2, 3, 4, 5] as Intensity[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => onConsumptionLevelChange(l)}
                    className={`flex-1 h-9 rounded-md border text-xs font-bold transition-all active:scale-90
                      ${l <= consumptionLevel
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-background border-white/[0.08] text-muted-foreground'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={openPanel === 'scene'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <PanelHeader title="What's the scene?" subtitle="Set the stage. The questions will follow." onClose={() => setOpenPanel(null)} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {SCENE_OPTIONS.map((s) => {
              const active = contextValue === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleScene(s.id)}
                  className={`relative flex items-start gap-2.5 p-3 rounded-xl border text-left overflow-hidden transition-colors
                    ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}`}
                  style={active ? {
                    boxShadow: `0 0 22px -6px hsl(var(${s.tintVar}) / 0.6), inset 0 -30px 30px -20px hsl(var(${s.tintVar}) / 0.35)`,
                  } : undefined}
                >
                  <span className="text-2xl leading-none">{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm text-foreground">{t(lang, s.labelKey as TranslationKey)}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {(contextValue === 'house-party' || contextValue === 'chill-night') && players.length > 0 && (
            <div className="mt-4">
              <h3 className="font-display text-sm font-bold text-foreground mb-2">
                {contextValue === 'house-party' ? 'Whose house is this?' : "Whose chill night is this?"}
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

          {/* ===== Timing ===== */}
          <div className="mt-5">
            <h3 className="font-display text-sm font-bold text-foreground mb-2">When is it?</h3>
            <div className="grid grid-cols-3 gap-2">
              {TIMING_OPTIONS.map((opt) => {
                const active = timing === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => onTimingChange(active ? '' : opt.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-colors active:scale-95
                      ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}`}
                  >
                    <span className="text-xl leading-none">{opt.emoji}</span>
                    <span className="text-[11px] font-display font-bold text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== Game types sheet ===== */}
      <Sheet open={openPanel === 'gametypes'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <PanelHeader
            title="Game types"
            subtitle="Optional — pick 2 or more to lock the deck to only those formats. Skip to let Fantito mix everything."
            onClose={() => setOpenPanel(null)}
          />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {GAME_TYPES.map((g) => {
              const active = selectedGameTypes.includes(g.id);
              return (
                <button
                  key={g.id}
                  onClick={() => onToggleGameType(g.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors active:scale-[0.98]
                    ${active ? 'border-primary/70 bg-primary/10' : 'border-white/[0.08] bg-card hover:border-white/20'}`}
                  aria-pressed={active}
                >
                  <span className="text-xl leading-none">{g.emoji}</span>
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
              <button
                onClick={onClearGameTypes}
                className="text-[11px] font-display font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>


      <Sheet open={openPanel === 'details'} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <PanelHeader title="Extra details ?" subtitle="Anything important? Birthdays, breakups, secret crushes…" onClose={() => setOpenPanel(null)} />
          <textarea
            value={detailsValue}
            onChange={e => handleDetailsChange(e.target.value)}
            placeholder="Tell Fantito anything important"
            className="mt-4 w-full bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground
                       placeholder:text-muted-foreground focus:outline-none focus:border-primary/60
                       focus:ring-2 focus:ring-primary/30 transition-colors min-h-[110px] resize-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {QUICK_CHIPS.map((chip) => {
              const label = t(lang, chip.key);
              return (
                <button
                  key={chip.key}
                  onClick={() => handleDetailsChange(detailsValue ? `${detailsValue}, ${label}` : label)}
                  className="px-3 py-1.5 rounded-full bg-card border border-white/[0.08] text-xs
                             font-display font-semibold text-foreground hover:border-primary/40
                             active:scale-95 transition-all"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </OnboardingLayout>
  );
};

/* ============ Subcomponents ============ */

const Banner = ({
  emoji, title, subtitle, onClick, lockBadge, disabled,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  lockBadge?: boolean;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border bg-card text-left transition-all
      active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed
      ${disabled ? 'border-white/[0.06]' : 'border-white/[0.08] hover:border-primary/40 hover:bg-card/80'}`}
  >
    <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
      {emoji}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className="font-display font-bold text-[15px] text-foreground truncate">{title}</span>
        {lockBadge && (
          <span className="flex items-center gap-0.5 text-[9px] font-display font-bold text-primary
                           bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded-full shrink-0">
            <Lock className="w-2.5 h-2.5" />
            PRO
          </span>
        )}
      </div>
      <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">{subtitle}</div>
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
    <button
      onClick={onClose}
      className="w-8 h-8 rounded-full bg-card border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground"
      aria-label="Close"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
);

const PlayerPicker = ({
  players, selectedId, onSelect, icon, clearLabel,
}: {
  players: Player[];
  selectedId?: string;
  onSelect: (id?: string) => void;
  icon: React.ReactNode;
  clearLabel: string;
}) => (
  <div className="flex flex-wrap gap-1.5">
    {players.map((p) => {
      const active = selectedId === p.id;
      return (
        <button
          key={p.id}
          onClick={() => onSelect(active ? undefined : p.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-display font-semibold transition-all active:scale-95
            ${active
              ? 'border-primary/70 bg-primary/15 text-foreground'
              : 'border-white/[0.08] bg-card text-foreground/80 hover:border-primary/40'}`}
        >
          <span className="text-base leading-none">{p.emoji}</span>
          {active && <span className="text-primary">{icon}</span>}
          <span className="truncate max-w-[90px]">{p.name}</span>
        </button>
      );
    })}
    {selectedId && (
      <button
        onClick={() => onSelect(undefined)}
        className="px-3 py-1.5 rounded-full border border-white/[0.08] bg-card text-[11px] font-display text-muted-foreground hover:border-primary/30"
      >
        {clearLabel}
      </button>
    )}
  </div>
);

export default VibeSettingsScreen;