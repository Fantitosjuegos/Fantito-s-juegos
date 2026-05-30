import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Sparkles } from 'lucide-react';
import { cssVars } from '@/lib/css-utils';
import { Language, OnboardingState, RELATION_TYPES, VIBES } from '@/lib/onboarding-types';
import { isRTL } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';

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

  // Rotate analysis lines
  useEffect(() => {
    const a = window.setInterval(() => setLineIdx(i => (i + 1) % lines.length), 1400);
    return () => { window.clearInterval(a); };
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

        {/* ====== AI-GENERATED PERSONAL SENTENCE — featured in the main panel ====== */}
        <div
          className="relative w-full rounded-2xl p-5 border border-primary/40 min-h-[140px] flex items-center justify-center text-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--primary) / 0.22))',
            boxShadow: '0 0 28px -8px hsl(var(--primary) / 0.55)',
          }}
        >
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 text-[9.5px] font-display font-bold uppercase tracking-widest text-primary">
            <Sparkles className="w-3 h-3" /> Fantito
          </div>
          {personalSentence ? (
            <p className="font-display text-[15px] font-semibold text-foreground italic leading-snug px-2 vs-rise">
              "{personalSentence}"
            </p>
          ) : (
            <p className="font-display text-sm text-muted-foreground vs-shimmer-text">
              Fantito is reading the room…
            </p>
          )}
        </div>

        {/* ====== PREPARATIONS METER ====== */}
        <div className="w-full">
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">
              Preparations
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

      </div>
    </div>
  );
};

export default memo(GeneratingScreen);