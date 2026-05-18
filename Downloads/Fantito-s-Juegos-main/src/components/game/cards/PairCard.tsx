import { useEffect, useRef, useState } from 'react';
import { GameCard } from '@/lib/game-types';
import { Mood } from '@/lib/card-mood';
import { Timer } from 'lucide-react';

interface PlayerLite { name: string; emoji: string }
interface Props {
  card: GameCard;
  mood: Mood;
  fallbackPlayers: PlayerLite[];
}

const DUO_TIMER_SECONDS = 20;

const PairCard = ({ card, mood }: Props) => {
  const [time, setTime] = useState(DUO_TIMER_SECONDS);
  const tickRef = useRef<number | null>(null);

  // 20s auto countdown — restarts on each new duo card.
  useEffect(() => {
    setTime(DUO_TIMER_SECONDS);
    if (tickRef.current) window.clearInterval(tickRef.current);
    tickRef.current = window.setInterval(() => {
      setTime(s => {
        if (s <= 1) {
          if (tickRef.current) window.clearInterval(tickRef.current);
          navigator.vibrate?.(40);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [card.card_id]);

  const pct = (time / DUO_TIMER_SECONDS) * 100;
  const danger = time <= 5;

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-6">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[11px] font-display font-bold px-2.5 py-1 rounded-md uppercase tracking-wide"
          style={{ color: `hsl(${mood.primary})`, background: `hsl(${mood.primary} / 0.12)` }}
        >
          ⚡ Duo card
        </span>
        <span
          className="ml-auto flex items-center gap-1 text-[11px] font-display font-bold px-2 py-0.5 rounded-md"
          style={{
            color: danger ? 'hsl(0 90% 65%)' : `hsl(${mood.accent})`,
            background: danger ? 'hsl(0 90% 65% / 0.15)' : `hsl(${mood.accent} / 0.12)`,
          }}
        >
          <Timer className="w-3 h-3" /> {time}s
        </span>
        <span className="text-[10px] text-muted-foreground font-display">#{card.card_id}</span>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-5">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${pct}%`,
            background: danger
              ? 'linear-gradient(90deg, hsl(0 90% 65%), hsl(40 90% 60%))'
              : `linear-gradient(90deg, hsl(${mood.accent}), hsl(${mood.primary}))`,
          }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-2">
        <p className="font-display text-[20px] font-bold text-foreground leading-snug text-center vs-rise">
          {card.question}
        </p>
      </div>

      <p className="mt-4 text-center text-[11px] font-display font-semibold text-muted-foreground italic">
        Group debates · narrator decides
      </p>
    </div>
  );
};

export default PairCard;
