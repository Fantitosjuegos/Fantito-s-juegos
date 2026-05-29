import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Sparkles, Zap } from 'lucide-react';
import { Language, OnboardingState, RELATION_TYPES, VIBES } from '@/lib/onboarding-types';
import { isRTL } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { cssVars } from '@/lib/css-utils';
import mascot from '@/assets/mascot.webp';

interface GeneratingScreenProps {
  lang: Language;
  state: OnboardingState;
}

/* ============================================================
 * Localized rotating AI-analysis lines (en/es shipped, others fall back to en)
 * ============================================================ */
const ANALYSIS_LINES: Record<string, string[]> = {
  en: [
    'Analyzing group chemistry…',
    'Detecting dangerous duos…',
    'Scanning for secret crushes…',
    'Checking emotional instability…',
    'Calibrating chaos engine…',
    'Building personalized question pool…',
    'Injecting drama into game logic…',
    'Cross-referencing relationships…',
    'Generating questions capable of ruining friendships…',
  ],
  es: [
    'Analizando la química del grupo…',
    'Detectando dúos peligrosos…',
    'Buscando crushes secretos…',
    'Midiendo inestabilidad emocional…',
    'Calibrando el motor del caos…',
    'Construyendo el pool personalizado…',
    'Inyectando drama en el juego…',
    'Cruzando referencias de relaciones…',
    'Generando preguntas que arruinan amistades…',
  ],
};

const PREVIEW_CARDS = [
  { kind: 'question',  text: 'Who in this group would survive the longest in jail?' },
  { kind: 'challenge', text: 'Reveal your last DM.' },
  { kind: 'vote',      text: 'Who lies the most in this room?' },
  { kind: 'warning',   text: 'Crush probability detected.' },
  { kind: 'system',    text: 'Betrayal scenarios generated successfully.' },
  { kind: 'question',  text: 'Who is most likely to text their ex tonight?' },
  { kind: 'challenge', text: 'Swap phones for 60 seconds.' },
] as const;

/* ============================================================ */

function buildSummary(state: OnboardingState): string {
  const names = state.players.map(p => p.name).join(', ');
  const vibes = state.vibes.join(', ');
  const relations = state.relations.map(r => {
    const p1 = state.players.find(p => p.id === r.player1Id)?.name;
    const p2 = state.players.find(p => p.id === r.player2Id)?.name;
    const type = RELATION_TYPES.find(t => t.id === r.type)?.id;
    return `${p1} & ${p2}: ${type}`;
  }).join('; ');
  const consumption = state.selectedConsumptions.length > 0 ? state.selectedConsumptions.join('+') : 'none';
  const context = state.contextState || '';
  const details = state.freeTextDetails || '';
  return `Players: ${names}. Vibes: ${vibes}. Consumption: ${consumption} (${state.consumptionLevel}/5). Relations: ${relations || 'none'}. Context: ${context}. Details: ${details}. Language: ${state.language}.`;
}

async function generatePersonalSentence(state: OnboardingState): Promise<string> {
  try {
    const summary = buildSummary(state);
    const langNames: Record<Language, string> = {
      en: 'English', es: 'Spanish', de: 'German', fr: 'French',
      pt: 'Portuguese', it: 'Italian', ar: 'Arabic'
    };

    const { data, error } = await supabase.functions.invoke('generate-cards', {
      body: {
        quickSentence: true,
        prompt: `You are Fantito, a charismatic, cheeky, and warm party game host. Write ONE or TWO short sentences (max 25 words total) in ${langNames[state.language]} where YOU narrate what's about to happen tonight. Speak in first person as Fantito addressing the players directly. You MUST mention player names naturally, and reference their group dynamic, relationships, vibes, and what they're drinking/consuming. Be playful, slightly provocative, like a friend who knows everyone's secrets. Examples of the tone: "Let's find some questions for those chaotic drinkers" or "Seems like a chill night for our lovers, maybe I should spice it up". No quotes. No emojis. No hashtags. Profile: ${summary}`
      }
    });

    if (!error && data?.sentence) return data.sentence;
  } catch {
    // fallback below
  }

  const names = state.players.slice(0, 3).map(p => p.name).join(', ');
  const vibe = state.vibes[0] || 'wild';
  return `Alright ${names}, Fantito's got a ${vibe} night planned for you…`;
}

const GeneratingScreen = ({ lang, state }: GeneratingScreenProps) => {
  const rtl = isRTL(lang);
  const lines = ANALYSIS_LINES[lang] ?? ANALYSIS_LINES.en;

  const [progress, setProgress] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [personalSentence, setPersonalSentence] = useState('');
  const sentenceRequested = useRef(false);

  // AI sentence (kept intact)
  useEffect(() => {
    if (sentenceRequested.current) return;
    sentenceRequested.current = true;
    generatePersonalSentence(state).then(setPersonalSentence);
  }, [state]);

  // Progress ticker — eases as it climbs
  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress(p => {
        if (p >= 99) return 99;
        const remaining = 99 - p;
        const step = Math.max(0.6, remaining * 0.04 + Math.random() * 1.2);
        return Math.min(99, p + step);
      });
    }, 110);
    return () => window.clearInterval(id);
  }, []);

  // Rotate analysis lines + preview cards
  useEffect(() => {
    const a = window.setInterval(() => setLineIdx(i => (i + 1) % lines.length), 1400);
    const b = window.setInterval(() => setPreviewIdx(i => (i + 1) % PREVIEW_CARDS.length), 1900);
    return () => { window.clearInterval(a); window.clearInterval(b); };
  }, [lines.length]);

  // Haptic milestones
  const lastBucket = useRef(0);
  useEffect(() => {
    const bucket = Math.floor(progress / 25);
    if (bucket > lastBucket.current) {
      lastBucket.current = bucket;
      navigator.vibrate?.(8);
    }
  }, [progress]);

  // Chaos label scales with progress
  const chaosLabel =
    progress >= 95 ? 'READY' :
    progress >= 75 ? 'UNSTABLE' :
    progress >= 50 ? 'VOLATILE' :
    progress >= 25 ? 'WARMING' : 'IGNITING';

  // Personalization icon strip from user inputs
  const iconStrip = useMemo(() => {
    const items: { key: string; emoji: string }[] = [];
    state.vibes.forEach(v => {
      const meta = VIBES.find(x => x.id === v);
      if (meta) items.push({ key: `v-${v}`, emoji: meta.emoji });
    });
    state.relations.slice(0, 4).forEach((r, i) => {
      const meta = RELATION_TYPES.find(x => x.id === r.type);
      if (meta) items.push({ key: `r-${i}`, emoji: meta.emoji });
    });
    state.selectedConsumptions.forEach(c => {
      items.push({ key: `c-${c}`, emoji: c === 'drinkers' ? '🍻' : '🌿' });
    });
    if (state.contextState) {
      const ctxEmoji: Record<string, string> = {
        'house-party': '🏠', 'bar': '🍻', 'road-trip': '🚗',
        'pregame': '🎉', 'chill-night': '🛋️', 'vacation': '🌴',
      };
      items.push({ key: 'ctx', emoji: ctxEmoji[state.contextState] ?? '✨' });
    }
    return items.slice(0, 10);
  }, [state]);

  const ready = progress >= 95 && !!personalSentence;
  const intensity = Math.min(1, progress / 100);

  const card = PREVIEW_CARDS[previewIdx];
  const cardKindLabel =
    card.kind === 'warning'   ? '⚠ alert' :
    card.kind === 'challenge' ? '🎯 challenge' :
    card.kind === 'vote'      ? '🗳 vote' :
    card.kind === 'system'    ? '⚡ system' : '❓ question';

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background overflow-hidden">
      {/* Ambient atmosphere */}
      <div
        className="vs-atmosphere"
        style={cssVars({ '--vs-intensity': intensity.toFixed(2) })}
      />

      {/* Floating particle dots */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/60 vs-particle"
            style={{
              left: `${(i * 37) % 100}%`,
              top:  `${60 + ((i * 17) % 40)}%`,
              ...cssVars({
                '--dx': `${((i % 5) - 2) * 14}px`,
                '--dy': `-${120 + (i % 4) * 30}px`,
              }),
              animationDelay: `${(i % 7) * 0.3}s`,
              animationDuration: `${1.6 + (i % 3) * 0.4}s`,
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

      <div className={`relative flex flex-col items-center justify-center min-h-[100dvh] px-6 py-8 gap-5 ${rtl ? 'direction-rtl' : ''}`}>

        {/* ====== MASCOT — observing the group ====== */}
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full vs-pulse-glow"
            style={{ filter: 'blur(8px)', background: 'hsl(var(--primary) / 0.4)' }}
          />
          <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-primary/40 vs-float"
               style={{ boxShadow: '0 0 36px -6px hsl(var(--primary) / 0.7)' }}>
            <img
              src={mascot}
              alt="Fantito"
              className="w-full h-full object-cover"
              loading="eager"
              width={512}
              height={512}
            />
            {/* scanning sweep */}
            <div
              className="absolute inset-x-0 h-6 pointer-events-none"
              style={{
                top: `${(progress % 100)}%`,
                background: 'linear-gradient(180deg, transparent, hsl(var(--primary) / 0.5), transparent)',
                transition: 'top 0.3s linear',
                mixBlendMode: 'screen',
              }}
            />
          </div>
          {/* eye glints */}
          <span className="absolute top-9 left-7 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="absolute top-9 right-7 w-1.5 h-1.5 rounded-full bg-primary animate-pulse"
                style={{ animationDelay: '180ms' }} />
        </div>

        {/* ====== AI-GENERATED PERSONAL SENTENCE (kept) ====== */}
        <div className="min-h-[64px] w-full flex items-center justify-center">
          {personalSentence ? (
            <p className="font-display text-[15px] font-semibold text-foreground text-center italic leading-snug px-2 vs-rise">
              “{personalSentence}”
            </p>
          ) : (
            <p className="font-display text-sm text-muted-foreground text-center vs-shimmer-text">
              Fantito is reading the room…
            </p>
          )}
        </div>

        {/* ====== LIVE PREVIEW CARD (rotating) ====== */}
        <div className="relative w-full h-[92px]">
          {PREVIEW_CARDS.map((c, i) => {
            const active = i === previewIdx;
            return (
              <div
                key={i}
                className={`absolute inset-0 rounded-2xl p-3.5 border transition-all duration-500
                  ${active
                    ? 'opacity-100 translate-y-0 scale-100 border-primary/40'
                    : 'opacity-0 translate-y-2 scale-95 border-white/[0.08] pointer-events-none'}`}
                style={{
                  background:
                    c.kind === 'warning'
                      ? 'linear-gradient(135deg, hsl(var(--card)), hsl(0 80% 25% / 0.45))'
                      : c.kind === 'challenge'
                      ? 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--accent) / 0.28))'
                      : c.kind === 'system'
                      ? 'linear-gradient(135deg, hsl(var(--card)), hsl(160 60% 30% / 0.35))'
                      : 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--primary) / 0.25))',
                  boxShadow: active ? '0 0 22px -8px hsl(var(--primary) / 0.55)' : undefined,
                }}
              >
                <div className="text-[9.5px] font-display font-bold uppercase tracking-widest text-primary mb-1">
                  {cardKindLabel}
                </div>
                <p className="font-display font-bold text-[13px] text-foreground leading-snug line-clamp-3">
                  {card.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* ====== CHAOS METER ====== */}
        <div className="w-full">
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">
              Chaos generation
            </span>
            <span className="font-display font-black text-sm text-primary">
              {Math.floor(progress)}% · {chaosLabel}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))',
                boxShadow: '0 0 14px hsl(var(--primary) / 0.6)',
              }}
            />
          </div>
          <p className="mt-2 text-center text-[12px] font-display font-semibold vs-shimmer-text min-h-[1.2em]">
            {ready ? '💀 The game is ready. Good luck surviving this.' : lines[lineIdx]}
          </p>
        </div>

        {/* ====== PERSONALIZATION ICON STRIP ====== */}
        {iconStrip.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-full">
            {iconStrip.map((it, i) => (
              <span
                key={it.key}
                className="w-8 h-8 rounded-full bg-card border border-white/[0.08] flex items-center justify-center text-base vs-float"
                style={{
                  animationDelay: `${(i % 6) * 0.18}s`,
                  boxShadow: '0 0 10px -4px hsl(var(--primary) / 0.5)',
                }}
              >
                {it.emoji}
              </span>
            ))}
          </div>
        )}

        {ready && (
          <div className="vs-rise flex items-center gap-1.5 text-[11px] font-display font-bold uppercase tracking-widest text-primary">
            <Zap className="w-3 h-3" />
            Personalized chaos generated
            <Sparkles className="w-3 h-3" />
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(GeneratingScreen);
