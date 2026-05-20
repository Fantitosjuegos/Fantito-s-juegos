import { useEffect, useRef, useState } from 'react';
import { GameCard } from '@/lib/game-types';
import { Language } from '@/lib/onboarding-types';
import { Mood } from '@/lib/card-mood';
import { Timer } from 'lucide-react';

interface Props {
  card: GameCard;
  mood: Mood;
  lang?: Language;
  onComplete: () => void;
}

const I18N: Record<string, { quiz: string; next: string; timeUp: string; somethingElse: string }> = {
  en: { quiz: 'Quiz', next: 'Next', timeUp: 'Time’s up — next', somethingElse: 'Something else?' },
  es: { quiz: 'Quiz', next: 'Siguiente', timeUp: 'Se acabó el tiempo — siguiente', somethingElse: '¿Otra cosa?' },
  fr: { quiz: 'Quiz', next: 'Suivant', timeUp: 'Temps écoulé — suivant', somethingElse: 'Autre chose ?' },
  de: { quiz: 'Quiz', next: 'Weiter', timeUp: 'Zeit abgelaufen — weiter', somethingElse: 'Etwas anderes?' },
  pt: { quiz: 'Quiz', next: 'Próximo', timeUp: 'Tempo esgotado — próximo', somethingElse: 'Outra coisa?' },
  it: { quiz: 'Quiz', next: 'Avanti', timeUp: 'Tempo scaduto — avanti', somethingElse: 'Altro?' },
  ar: { quiz: 'اختبار', next: 'التالي', timeUp: 'انتهى الوقت — التالي', somethingElse: 'شيء آخر؟' },
};

const QuizCard = ({ card, mood, lang = 'en', onComplete }: Props) => {
  const t = I18N[lang] ?? I18N.en;
  const total = card.timer_seconds ?? 12;

  // Build exactly 4 options: 3 from AI + locked "Something else?" at index 3.
  // We intentionally never expose which one is "correct" — the player just chooses.
  const aiOptions = (card.options ?? []).slice(0, 3);
  while (aiOptions.length < 3) aiOptions.push('—');
  const options = [...aiOptions, t.somethingElse];

  const [picked, setPicked] = useState<number | null>(null);
  const [time, setTime] = useState(total);
  const tickRef = useRef<number | null>(null);

  // Reset + auto-start timer on each card
  useEffect(() => {
    setPicked(null);
    setTime(total);
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setTime(s => {
        if (s <= 1) {
          if (tickRef.current) window.clearInterval(tickRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [card.card_id, total]);

  useEffect(() => {
    if (time === 0 && picked === null) {
      navigator.vibrate?.(40);
      setPicked(-1); // timeout
    }
  }, [time, picked]);

  const pct = (time / total) * 100;
  const showAnswer = picked !== null;

  const choose = (i: number) => {
    if (showAnswer) return;
    if (tickRef.current) window.clearInterval(tickRef.current);
    setPicked(i);
    navigator.vibrate?.(i === 3 ? 10 : 20);
  };

  const ctaLabel = picked === -1 ? t.timeUp : t.next;

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[11px] font-display font-bold px-2.5 py-1 rounded-md uppercase tracking-wide"
          style={{ color: `hsl(${mood.primary})`, background: `hsl(${mood.primary} / 0.12)` }}
        >
          {t.quiz}
        </span>
        <span
          className="ml-auto flex items-center gap-1 text-[11px] font-display font-bold px-2 py-0.5 rounded-md"
          style={{
            color: time <= 3 && !showAnswer ? 'hsl(0 90% 65%)' : `hsl(${mood.accent})`,
            background: time <= 3 && !showAnswer ? 'hsl(0 90% 65% / 0.15)' : `hsl(${mood.accent} / 0.12)`,
          }}
        >
          <Timer className="w-3 h-3" /> {time}s
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-4">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${pct}%`,
            background: time <= 3 && !showAnswer
              ? 'linear-gradient(90deg, hsl(0 90% 65%), hsl(40 90% 60%))'
              : `linear-gradient(90deg, hsl(${mood.accent}), hsl(${mood.primary}))`,
          }}
        />
      </div>

      <p className="font-display text-[17px] font-bold text-foreground leading-snug text-center mb-4 vs-rise">
        {card.question}
      </p>

      <div className="grid grid-cols-2 gap-2 flex-1 content-start">
        {options.map((opt, i) => {
          const isPicked = i === picked;
          const isElse = i === 3;
          // We never reveal which option is "correct" — only highlight the player's pick.
          let style: React.CSSProperties = {
            borderColor: 'hsl(var(--border) / 0.12)',
            background: isElse ? 'hsl(var(--muted) / 0.4)' : 'hsl(var(--background) / 0.4)',
          };
          if (isPicked) {
            style = {
              borderColor: `hsl(${mood.primary})`,
              background: `hsl(${mood.primary} / 0.18)`,
              boxShadow: `0 0 22px -6px hsl(${mood.primary} / 0.5)`,
            };
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={showAnswer}
              className="relative p-3 rounded-xl border text-left active:scale-95 transition-all disabled:opacity-70"
              style={style}
            >
              <span className="text-[10px] font-display font-bold text-muted-foreground uppercase tracking-wider mr-1">
                {String.fromCharCode(65 + i)}
              </span>
              <span className={`font-display font-bold text-sm ${isElse ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {showAnswer && (
        <button
          onClick={onComplete}
          className="mt-4 py-3 rounded-xl font-display font-bold text-sm text-primary-foreground vs-rise"
          style={{
            background: `linear-gradient(120deg, hsl(${mood.primary}), hsl(${mood.accent}))`,
            boxShadow: `0 0 22px -6px hsl(${mood.primary} / 0.7)`,
          }}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
};

export default QuizCard;
