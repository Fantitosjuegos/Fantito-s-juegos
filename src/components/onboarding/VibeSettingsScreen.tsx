import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Sparkles, Home, Car } from 'lucide-react';
import { cssVars } from '@/lib/css-utils';
import {
  Vibe, Intensity, ConsumptionType, GameMode, Language, Player,
  VIBES, CONSUMPTION_TYPES, GAME_MODES,
} from '@/lib/onboarding-types';
import { t, isRTL } from '@/lib/translations';
import { useEntitlements } from '@/hooks/useEntitlements';
import OnboardingLayout from './OnboardingLayout';
import MascotBubble from './MascotBubble';
import PaywallModal from '../PaywallModal';

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
  onToggleVibe: (vibe: Vibe) => void;
  onToggleConsumption: (type: ConsumptionType) => void;
  onConsumptionLevelChange: (level: Intensity) => void;
  onGameModeChange: (mode: GameMode) => void;
  onContextChange: (val: string) => void;
  onHostChange: (id?: string) => void;
  onDriverChange: (id?: string) => void;
  onDetailsChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
}

/* ============================================================
 * Emotional micro-copy
 * Kept inline (English) to avoid blowing up 7-language translations
 * for an MVP flourish layer. Existing localized labels stay intact.
 * ============================================================ */

const MODE_FLAVOR: Record<GameMode, { tag: string; tint: string }> = {
  family:  { tag: 'Safe chaos. Mostly.',          tint: '180 65% 55%' },
  normal:  { tag: 'Balanced drama & laughs.',     tint: '339 100% 62%' },
  nasty18: { tag: 'No filter. No mercy.',         tint: '0 85% 58%'   },
};

const VIBE_FLAVOR: Record<Vibe, { tag: string; preview: string }> = {
  chill:   { tag: 'Late-night talks & funny truths', preview: "Future question: 'What's the cringiest thing in your camera roll?'" },
  wild:    { tag: 'Maximum chaos potential',         preview: "Future challenge: 'Text your ex right now.'" },
  flirty:  { tag: 'Someone is getting exposed',      preview: "Future question: 'Who would secretly date someone here?'" },
  deep:    { tag: 'Dangerous emotional questions',   preview: "Future question: 'Who hides their feelings the most?'" },
  chaotic: { tag: 'Absolutely unpredictable',        preview: "Future twist: 'Swap phones for 60 seconds.'" },
};

const CONSUMPTION_FLAVOR: Record<ConsumptionType, string> = {
  drinkers: 'Confidence levels increasing',
  smokers:  'Reaction speed reduced by 72%',
};

const SCENE_OPTIONS: { id: string; labelKey: 'houseParty'|'atABar'|'roadTrip'|'pregame'|'chillNight'|'vacation'; emoji: string; tag: string; tintVar: string }[] = [
  { id: 'house-party', labelKey: 'houseParty', emoji: '🏠', tag: 'Loud music & dangerous decisions', tintVar: '--tint-house-party' },
  { id: 'bar',         labelKey: 'atABar',     emoji: '🍻', tag: 'Liquid confidence unlocked',       tintVar: '--tint-bar' },
  { id: 'road-trip',   labelKey: 'roadTrip',   emoji: '🚗', tag: 'Bonding or disaster.',             tintVar: '--tint-road-trip' },
  { id: 'pregame',     labelKey: 'pregame',    emoji: '🎉', tag: 'Energy building rapidly',          tintVar: '--tint-pregame' },
  { id: 'chill-night', labelKey: 'chillNight', emoji: '🛋️', tag: 'Fake calm before chaos',          tintVar: '--tint-chill-night' },
  { id: 'vacation',    labelKey: 'vacation',   emoji: '🌴', tag: 'Nothing stays secret on vacation', tintVar: '--tint-vacation' },
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

/* Mascot quips reactive to the latest action */
const QUIP_BY_VIBE: Record<Vibe, string> = {
  chill:   '😌 Setting the cozy chaos…',
  wild:    '🤠 Ohhh this is gonna get loud.',
  flirty:  '👀 This changes the question pool.',
  deep:    '🧠 Someone’s leaving emotionally damaged.',
  chaotic: '🌪️ This night is already doomed.',
};
const QUIP_BY_MODE: Record<GameMode, string> = {
  family:  '👨‍👩‍👧 Keeping it wholesome… mostly.',
  normal:  '🎉 Perfect chaos calibration.',
  nasty18: '🔞 No filter. Brace yourselves.',
};
const QUIP_BY_SCENE: Record<string, string> = {
  'house-party': '🏠 The neighbors will hate us.',
  'bar':         '🍻 Tab is opening… mentally.',
  'road-trip':   '🚗 Trapped together. Beautiful.',
  'pregame':     '🎉 Warming up the disaster.',
  'chill-night': '🛋️ Calm? For now.',
  'vacation':    '🌴 Vacation = no rules.',
};

/* ============================================================ */

const VibeSettingsScreen = ({
  step, lang, players, selectedVibes, selectedConsumptions, consumptionLevel, gameMode,
  contextValue, hostPlayerId, driverPlayerId, detailsValue,
  onToggleVibe, onToggleConsumption, onConsumptionLevelChange, onGameModeChange,
  onContextChange, onHostChange, onDriverChange, onDetailsChange, onNext, onBack,
}: VibeSettingsScreenProps) => {
  const rtl = isRTL(lang);
  const { isPremium } = useEntitlements();
  const [paywallReason, setPaywallReason] = useState<string | null>(null);

  // Reactive mascot quip + floating "future unlocked" preview
  const [quip, setQuip] = useState<string>('🤠 Tell me how dangerous tonight is…');
  const [preview, setPreview] = useState<{ id: number; text: string } | null>(null);
  const previewIdRef = useRef(0);

  const popPreview = (text: string) => {
    const id = ++previewIdRef.current;
    setPreview({ id, text });
    window.setTimeout(() => {
      setPreview(curr => (curr && curr.id === id ? null : curr));
    }, 2600);
  };

  // Visual escalation intensity 0..1 — drives ambient atmosphere
  const intensity = useMemo(() => {
    let s = 0;
    s += selectedVibes.length * 0.12;
    s += selectedConsumptions.length * 0.1;
    s += contextValue ? 0.15 : 0;
    s += gameMode === 'nasty18' ? 0.2 : gameMode === 'normal' ? 0.1 : 0;
    s += detailsValue.trim().length > 0 ? 0.1 : 0;
    return Math.min(1, s);
  }, [selectedVibes, selectedConsumptions, contextValue, gameMode, detailsValue]);

  const detailsTimer = useRef<number | null>(null);
  const handleDetailsChange = (v: string) => {
    onDetailsChange(v);
    if (detailsTimer.current) window.clearTimeout(detailsTimer.current);
    detailsTimer.current = window.setTimeout(() => {
      if (v.trim().length > 4) setQuip('🤠 Oh this is PREMIUM drama.');
    }, 700);
  };

  const handleVibe = (vibe: Vibe) => {
    onToggleVibe(vibe);
    if (!selectedVibes.includes(vibe)) {
      setQuip(QUIP_BY_VIBE[vibe]);
      popPreview(`🔓 ${VIBE_FLAVOR[vibe].preview}`);
      navigator.vibrate?.(8);
    }
  };

  const handleMode = (mode: GameMode) => {
    onGameModeChange(mode);
    setQuip(QUIP_BY_MODE[mode]);
    navigator.vibrate?.(6);
  };

  const handleScene = (id: string) => {
    onContextChange(id);
    setQuip(QUIP_BY_SCENE[id] ?? quip);
    navigator.vibrate?.(6);
  };

  const handleConsumption = (c: ConsumptionType) => {
    if (!isPremium) return setPaywallReason('Consumption settings are a premium feature.');
    onToggleConsumption(c);
    if (!selectedConsumptions.includes(c)) {
      setQuip(`${c === 'drinkers' ? '🍻' : '🌿'} ${CONSUMPTION_FLAVOR[c]}`);
      navigator.vibrate?.(6);
    }
  };

  // Auto-soften quip after a while
  useEffect(() => {
    const id = window.setTimeout(() => {}, 0);
    return () => window.clearTimeout(id);
  }, [quip]);

  const ctaReady = selectedVibes.length > 0;
  const ctaLabel = t(lang, 'launchChaos') || 'Generate the chaos';
  const ctaSub   = t(lang, 'launchChaosSub') || 'AI creates your game instantly';

  return (
    <OnboardingLayout step={step} onBack={onBack}>
      <PaywallModal
        open={!!paywallReason}
        reason={paywallReason ?? undefined}
        onClose={() => setPaywallReason(null)}
      />

      {/* Ambient atmosphere — intensifies with choices */}
      <div className="vs-atmosphere" style={cssVars({ '--vs-intensity': intensity.toFixed(2) })} />

      <div className={`relative flex-1 flex flex-col gap-5 pt-2 overflow-y-auto ${rtl ? 'direction-rtl' : ''}`}>
        {/* Reactive mascot header */}
        <div className="relative">
          <MascotBubble message={quip} size="sm" />
          {/* Floating "future unlocked" preview */}
          {preview && (
            <div
              key={preview.id}
              className="vs-preview-in absolute -bottom-2 left-0 right-0 mx-auto w-fit max-w-[92%] px-3 py-1.5 rounded-full
                         bg-card/90 backdrop-blur border border-primary/40 shadow-soft
                         text-[11px] font-display font-semibold text-foreground flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="truncate">{preview.text}</span>
            </div>
          )}
        </div>

        {/* ============= 1. THE NIGHT ============= */}
        <Section title="What kind of night is this?" subtitle="Pick the energy. Fantito tunes the chaos.">
          <div className="grid grid-cols-3 gap-2">
            {GAME_MODES.map((mode) => {
              const active = gameMode === mode.id;
              const locked = !isPremium && mode.id === 'nasty18';
              const flavor = MODE_FLAVOR[mode.id];
              return (
                <button
                  key={mode.id}
                  onClick={() => locked
                    ? setPaywallReason('Nasty +18 mode is a premium feature.')
                    : handleMode(mode.id)}
                  className={`vs-card-tilt relative flex flex-col items-center gap-1.5 p-3 rounded-xl border overflow-hidden
                    ${active
                      ? 'border-primary/70 bg-primary/10 vs-card-selected'
                      : 'border-white/[0.08] bg-card hover:border-white/20'}
                    ${locked ? 'opacity-60' : ''}`}
                  style={active ? {
                    boxShadow: `0 0 24px -4px hsl(${flavor.tint} / 0.55), inset 0 0 30px -10px hsl(${flavor.tint} / 0.4)`,
                  } : undefined}
                >
                  {locked && <Lock className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-primary" />}
                  <span className={`text-3xl leading-none ${active ? 'vs-float' : ''}`}>{mode.emoji}</span>
                  <span className={`font-display font-bold text-xs ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t(lang, mode.labelKey)}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight text-center italic">
                    {flavor.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ============= 2. THE VIBE ============= */}
        <Section title="What's tonight's vibe?" subtitle="Choose as many as you want — Fantito will mix them.">
          <div className="grid grid-cols-2 gap-2">
            {VIBES.map((vibe) => {
              const active = selectedVibes.includes(vibe.id);
              const flavor = VIBE_FLAVOR[vibe.id];
              return (
                <button
                  key={vibe.id}
                  onClick={() => handleVibe(vibe.id)}
                  className={`vs-card-tilt relative flex items-start gap-2.5 p-3 rounded-xl border text-left overflow-hidden
                    ${active
                      ? 'border-primary/70 bg-primary/10 vs-card-selected'
                      : 'border-white/[0.08] bg-card hover:border-white/20'}`}
                  style={active ? {
                    boxShadow: '0 0 22px -6px hsl(var(--primary) / 0.55)',
                  } : undefined}
                >
                  <span className={`text-2xl leading-none ${active ? 'vs-float' : ''}`}>{vibe.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-display font-bold text-sm ${active ? 'text-foreground' : 'text-foreground/90'}`}>
                      {t(lang, vibe.labelKey)}
                    </div>
                    <div className="text-[10.5px] text-muted-foreground leading-snug">
                      {flavor.tag}
                    </div>
                  </div>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-display font-bold uppercase tracking-wide
                                     bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                      on
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ============= 3. THE CREW (consumption) ============= */}
        {gameMode !== 'family' && (
          <Section
            title="How are we feeling tonight?"
            subtitle={isPremium ? 'Pick any combo — Fantito calibrates.' : undefined}
            premiumLocked={!isPremium}
          >
            <div className="grid grid-cols-2 gap-2">
              {CONSUMPTION_TYPES.map((c) => {
                const active = isPremium && selectedConsumptions.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleConsumption(c.id)}
                    className={`vs-card-tilt flex items-start gap-2.5 p-3 rounded-xl border text-left
                      ${active
                        ? 'border-primary/70 bg-primary/10 vs-card-selected'
                        : 'border-white/[0.08] bg-card hover:border-white/20'}`}
                  >
                    <span className={`text-2xl leading-none ${active ? 'vs-float' : 'opacity-70'}`}>{c.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-display font-bold text-sm ${active ? 'text-foreground' : 'text-foreground/90'}`}>
                        {t(lang, c.labelKey)}
                      </div>
                      <div className="text-[10.5px] text-muted-foreground leading-snug italic">
                        {CONSUMPTION_FLAVOR[c.id]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {isPremium && selectedConsumptions.length > 0 && (
              <div className="vs-rise mt-3 p-3 rounded-xl bg-card border border-white/[0.08]">
                <p className="font-display font-semibold text-sm text-foreground mb-2">
                  {INTENSITY_EMOJIS[consumptionLevel - 1]} {t(lang, INTENSITY_KEYS[consumptionLevel - 1])}
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
          </Section>
        )}

        {/* ============= 4. THE SCENE ============= */}
        <Section title="What's the scene?" subtitle="Set the stage. The questions will follow.">
          <div className="grid grid-cols-2 gap-2">
            {SCENE_OPTIONS.map((s) => {
              const active = contextValue === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleScene(s.id)}
                  className={`vs-card-tilt relative flex items-start gap-2.5 p-3 rounded-xl border text-left overflow-hidden
                    ${active
                      ? 'border-primary/70 bg-primary/10 vs-card-selected'
                      : 'border-white/[0.08] bg-card hover:border-white/20'}`}
                  style={active ? {
                    boxShadow: `0 0 22px -6px hsl(var(${s.tintVar}) / 0.6), inset 0 -30px 30px -20px hsl(var(${s.tintVar}) / 0.35)`,
                  } : undefined}
                >
                  <span className={`text-2xl leading-none ${active ? 'vs-float' : ''}`}>{s.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold text-sm text-foreground">{t(lang, s.labelKey)}</div>
                    <div className="text-[10.5px] text-muted-foreground leading-snug italic">{s.tag}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ============= 4b. HOST / DRIVER (scene-conditional) ============= */}
        {(contextValue === 'house-party' || contextValue === 'chill-night') && players.length > 0 && (
          <Section
            title={contextValue === 'house-party' ? 'Whose house is this?' : "Whose chill night is this?"}
            subtitle="Fantito will respect the host and ask about their place."
          >
            <PlayerPicker
              players={players}
              selectedId={hostPlayerId}
              onSelect={onHostChange}
              icon={<Home className="w-3 h-3" />}
              clearLabel="No host"
            />
          </Section>
        )}

        {contextValue === 'road-trip' && players.length > 0 && (
          <Section
            title="Who's driving?"
            subtitle="Fantito will keep the driver safe — no eyes off the road, no hands off the wheel."
          >
            <PlayerPicker
              players={players}
              selectedId={driverPlayerId}
              onSelect={onDriverChange}
              icon={<Car className="w-3 h-3" />}
              clearLabel="No driver"
            />
          </Section>
        )}

        <Section
          title="Tell Fantito the gossip 👀"
          subtitle="Anything important? Birthdays, breakups, secret crushes…"
          premiumLocked={!isPremium}
        >
          <textarea
            value={detailsValue}
            onChange={e => handleDetailsChange(e.target.value)}
            onFocus={e => {
              if (!isPremium) {
                e.currentTarget.blur();
                setPaywallReason('Extra details are a premium feature.');
              }
            }}
            placeholder="Tell Fantito anything important 👀"
            readOnly={!isPremium}
            className="w-full bg-card border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-foreground
                       placeholder:text-muted-foreground focus:outline-none focus:border-primary/60
                       focus:ring-2 focus:ring-primary/30 transition-colors min-h-[78px] resize-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_CHIPS.map((chip) => {
              const label = t(lang, chip.key);
              return (
                <button
                  key={chip.key}
                  onClick={() => {
                    if (!isPremium) return setPaywallReason('Extra details are a premium feature.');
                    handleDetailsChange(detailsValue ? `${detailsValue}, ${label}` : label);
                  }}
                  className="px-3 py-1.5 rounded-full bg-card border border-white/[0.08] text-xs
                             font-display font-semibold text-foreground hover:border-primary/40
                             active:scale-95 transition-all"
                >
                  <span className="mr-1">{chip.emoji}</span>{label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ============= CTA ============= */}
        <div className="mt-auto pt-3 pb-1">
          <button
            onClick={onNext}
            disabled={!ctaReady}
            className={`relative w-full overflow-hidden rounded-xl py-3.5 font-display font-bold text-base
              text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-40
              ${ctaReady ? 'vs-pulse-glow' : ''}`}
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
    </OnboardingLayout>
  );
};

const Section = ({
  title, subtitle, premiumLocked, children,
}: {
  title: string;
  subtitle?: string;
  premiumLocked?: boolean;
  children: React.ReactNode;
}) => (
  <div className="vs-rise">
    <div className="flex items-center justify-between mb-1.5 gap-2">
      <h2 className="font-display text-[17px] font-bold text-foreground leading-tight">{title}</h2>
      {premiumLocked && (
        <span className="flex items-center gap-1 text-[10px] font-display font-semibold text-primary
                         bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-full shrink-0">
          <Lock className="w-3 h-3" />
          Premium
        </span>
      )}
    </div>
    {subtitle && <p className="text-[11.5px] text-muted-foreground mb-2.5">{subtitle}</p>}
    {children}
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
              ? 'border-primary/70 bg-primary/15 text-foreground vs-pulse-glow'
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