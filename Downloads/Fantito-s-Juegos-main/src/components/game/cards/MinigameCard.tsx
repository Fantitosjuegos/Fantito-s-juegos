import { useEffect, useRef, useState } from 'react';
import { GameCard } from '@/lib/game-types';
import { Language } from '@/lib/onboarding-types';
import { Mood } from '@/lib/card-mood';
import { Timer, Play, Pause, RotateCcw } from 'lucide-react';

interface Props {
  card: GameCard;
  mood: Mood;
  lang?: Language;
  onComplete: () => void;
}

const I18N: Record<string, { label: string; tap: string; pause: string; resume: string; reset: string; done: string; timeUp: string }> = {
  en: { label: 'Mini-game', tap: 'Tap to start', pause: 'Pause', resume: 'Resume', reset: 'Reset', done: 'Next card', timeUp: 'Time’s up!' },
  es: { label: 'Mini-juego', tap: 'Toca para empezar', pause: 'Pausar', resume: 'Reanudar', reset: 'Reiniciar', done: 'Siguiente carta', timeUp: '¡Se acabó el tiempo!' },
  fr: { label: 'Mini-jeu', tap: 'Touche pour démarrer', pause: 'Pause', resume: 'Reprendre', reset: 'Reset', done: 'Carte suivante', timeUp: 'Temps écoulé !' },
  de: { label: 'Mini-Game', tap: 'Tippe zum Start', pause: 'Pause', resume: 'Weiter', reset: 'Neu', done: 'Nächste Karte', timeUp: 'Zeit abgelaufen!' },
  pt: { label: 'Mini-jogo', tap: 'Toca para começar', pause: 'Pausar', resume: 'Continuar', reset: 'Reiniciar', done: 'Próxima carta', timeUp: 'Tempo esgotado!' },
  it: { label: 'Mini-gioco', tap: 'Tocca per iniziare', pause: 'Pausa', resume: 'Riprendi', reset: 'Reset', done: 'Carta successiva', timeUp: 'Tempo scaduto!' },
  ar: { label: 'لعبة مصغرة', tap: 'اضغط للبدء', pause: 'إيقاف', resume: 'متابعة', reset: 'إعادة', done: 'البطاقة التالية', timeUp: 'انتهى الوقت!' },
};

const MinigameCard = ({ card, mood, lang = 'en', onComplete }: Props) => {
  const t = I18N[lang] ?? I18N.en;
  const total = Math.min(60, Math.max(10, card.timer_seconds ?? 30));
  const [time, setTime] = useState(total);
  const [running, setRunning] = useState(false);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    setTime(total);
    setRunning(false);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [card.card_id, total]);

  useEffect(() => {
    if (!running) {
      if (tickRef.current) window.clearInterval(tickRef.current);
      return;
    }
    tickRef.current = window.setInterval(() => {
      setTime(s => {
        if (s <= 1) {
          if (tickRef.current) window.clearInterval(tickRef.current);
          navigator.vibrate?.(60);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [running]);

  const pct = (time / total) * 100;
  const danger = time <= 5;
  const finished = time === 0;

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-5">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[11px] font-display font-bold px-2.5 py-1 rounded-md uppercase tracking-wide"
          style={{ color: `hsl(${mood.primary})`, background: `hsl(${mood.primary} / 0.12)` }}
        >
          🎮 {t.label}
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto font-display">#{card.card_id}</span>
      </div>

      {/* Big circular timer — tappable */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <button
          onClick={() => { if (!finished) setRunning(r => !r); }}
          disabled={finished}
          className="relative w-44 h-44 rounded-full flex items-center justify-center active:scale-95 transition-transform"
          aria-label={running ? t.pause : t.tap}
        >
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="hsl(var(--border) / 0.15)" strokeWidth="4" />
            <circle
              cx="50" cy="50" r="46" fill="none"
              stroke={danger ? 'hsl(0 90% 65%)' : `hsl(${mood.primary})`}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 46}
              strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="relative flex flex-col items-center">
            <span
              className="font-display font-black text-5xl"
              style={{ color: danger ? 'hsl(0 90% 65%)' : `hsl(${mood.primary})` }}
            >
              {time}
            </span>
            <span className="text-[10px] font-display uppercase tracking-widest text-muted-foreground mt-1">
              {finished ? t.timeUp : running ? t.pause : t.tap}
            </span>
          </div>
        </button>

        <p className="font-display text-[18px] font-bold text-foreground leading-snug text-center vs-rise px-2">
          {card.question}
        </p>

        <div className="flex items-center gap-2 mt-1">
          {!finished ? (
            <button
              onClick={() => setRunning(r => !r)}
              className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-full bg-card border border-white/[0.08] text-foreground"
            >
              {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {running ? t.pause : t.resume}
            </button>
          ) : null}
          <button
            onClick={() => { setTime(total); setRunning(false); }}
            className="flex items-center gap-1.5 text-xs font-display font-semibold px-3 py-1.5 rounded-full bg-card border border-white/[0.08] text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {t.reset}
          </button>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="mt-4 py-3 rounded-xl font-display font-bold text-sm text-primary-foreground"
        style={{
          background: `linear-gradient(120deg, hsl(${mood.primary}), hsl(${mood.accent}))`,
          boxShadow: `0 0 22px -6px hsl(${mood.primary} / 0.7)`,
        }}
      >
        <Timer className="inline w-4 h-4 mr-1" /> {t.done}
      </button>
    </div>
  );
};

export default MinigameCard;
