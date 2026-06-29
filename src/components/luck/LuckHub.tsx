import { ArrowLeft } from 'lucide-react';
import diceIcon       from '@/assets/luck-icons/dice.svg';
import coinIcon       from '@/assets/luck-icons/coin.svg';
import wheelIcon      from '@/assets/luck-icons/wheel.svg';
import bottleIcon     from '@/assets/luck-icons/bottle.svg';
import pickerIcon     from '@/assets/luck-icons/picker.svg';
import tournamentIcon from '@/assets/luck-icons/tournament.svg';

export type LuckTool = 'dice' | 'coin' | 'wheel' | 'bottle' | 'picker' | 'tournament';

interface LuckHubProps {
  onBack: () => void;
  onPick: (tool: LuckTool) => void;
}

const TOOLS: { id: LuckTool; title: string; subtitle: string; tag?: string; icon: string }[] = [
  { id: 'dice',       title: 'Dice',          subtitle: 'Roll & gamble',       icon: diceIcon },
  { id: 'coin',       title: 'Coin Flip',     subtitle: 'Heads or tails',      icon: coinIcon },
  { id: 'wheel',      title: 'Spin Wheel',    subtitle: 'Pick a name',         icon: wheelIcon },
  { id: 'bottle',     title: 'Bottle Spin',   subtitle: 'One · Duo',           icon: bottleIcon },
  { id: 'picker',     title: 'Random Picker', subtitle: 'Instant chosen one',  icon: pickerIcon },
  { id: 'tournament', title: 'Tournament',    subtitle: 'Last one standing', tag: 'NEW', icon: tournamentIcon },
];

const LuckHub = ({ onBack, onPick }: LuckHubProps) => {
  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">

      <div className="relative flex items-center justify-between mb-5 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95 transition-transform" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display font-bold text-2xl">Arcade</h1>
        <div className="w-10" />
      </div>

      <p className="relative text-muted-foreground text-sm mb-5 leading-relaxed z-10">
        Tap. Spin. Roll. So many ways to make tiny dumb decisions
      </p>

      <div className="relative grid grid-cols-2 gap-4 z-10">
        {TOOLS.map((tool, i) => (
          <button
            key={tool.id}
            onClick={() => onPick(tool.id)}
            style={{ animationDelay: `${i * 70}ms` }}
            className="vs-preview-in group relative flex flex-col items-center gap-2 bg-transparent border-0 p-0 active:scale-[0.96] transition-transform"
          >
            {tool.tag && (
              <span className="absolute top-1 right-1 z-10 text-[9px] font-display font-bold tracking-wider bg-accent text-accent-foreground rounded-full px-2 py-0.5 shadow-soft">
                {tool.tag}
              </span>
            )}
            <img
              src={tool.icon}
              alt={tool.title}
              draggable={false}
              className="w-full aspect-[4/5] object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)] group-hover:drop-shadow-[0_10px_22px_hsl(var(--primary)/0.45)] transition-all"
            />
            <div className="text-center">
              <div className="font-display font-bold text-foreground text-base leading-tight">{tool.title}</div>
              <div className="text-muted-foreground text-[11px] mt-0.5">{tool.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      <p className="relative text-center text-[11px] text-muted-foreground/70 mt-auto pt-8 z-10">
        Pass the phone. Let luck decide.
      </p>
    </div>
  );
};

export default LuckHub;