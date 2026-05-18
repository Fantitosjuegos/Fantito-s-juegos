import { ArrowLeft, Dice5, Coins, Disc3, Wine, Sparkles, Trophy } from 'lucide-react';

export type LuckTool = 'dice' | 'coin' | 'wheel' | 'bottle' | 'picker' | 'tournament';

interface LuckHubProps {
  onBack: () => void;
  onPick: (tool: LuckTool) => void;
}

// Mini live previews per card — tactile micro-animations
const Preview = ({ tool }: { tool: LuckTool }) => {
  switch (tool) {
    case 'dice':
      return (
        <div className="luck-mini-roll w-12 h-12 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 border border-white/10 grid grid-cols-3 grid-rows-3 gap-0.5 p-2 shadow-soft">
          {/* 6-pip face: cols 0 & 2, rows 0/1/2 */}
          {[0, 2, 3, 5, 6, 8].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary self-center justify-self-center" />)}
        </div>
      );
    case 'coin':
      return (
        <div className="[perspective:600px]">
          <div className="luck-mini-coin w-12 h-12 rounded-full bg-gradient-to-br from-accent via-accent/80 to-accent/40 border-2 border-accent/60 grid place-items-center font-display font-bold text-accent-foreground shadow-soft">
            $
          </div>
        </div>
      );
    case 'wheel':
      return (
        <div className="luck-mini-spin w-12 h-12 rounded-full border-2 border-white/10 shadow-soft"
             style={{ background: 'conic-gradient(hsl(var(--primary)) 0 90deg, hsl(var(--accent)) 90deg 180deg, hsl(339 80% 65%) 180deg 270deg, hsl(28 90% 60%) 270deg 360deg)' }} />
      );
    case 'bottle':
      return (
        <div className="w-12 h-12 grid place-items-center">
          <div className="luck-mini-wobble w-3 h-10 rounded-md bg-gradient-to-b from-primary to-primary/40 shadow-soft" />
        </div>
      );
    case 'picker':
      return <Sparkles className="w-9 h-9 text-primary luck-mini-pulse" />;
    case 'tournament':
      return (
        <div className="luck-mini-pulse">
          <Trophy className="w-9 h-9 text-accent drop-shadow-[0_0_10px_hsl(var(--accent)/0.6)]" />
        </div>
      );
  }
};

const TOOLS: { id: LuckTool; title: string; subtitle: string; tag?: string }[] = [
  { id: 'dice',       title: 'Dice',          subtitle: 'Roll & gamble' },
  { id: 'coin',       title: 'Coin Flip',     subtitle: 'Heads or tails' },
  { id: 'wheel',      title: 'Spin Wheel',    subtitle: 'Pick a name' },
  { id: 'bottle',     title: 'Bottle Spin',   subtitle: 'One · Duo' },
  { id: 'picker',     title: 'Random Picker', subtitle: 'Instant chosen one' },
  { id: 'tournament', title: 'Tournament',    subtitle: 'Last one standing', tag: 'NEW' },
];

const LuckHub = ({ onBack, onPick }: LuckHubProps) => {
  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">
      {/* Atmosphere */}
      <div className="vs-atmosphere" style={{ ['--vs-intensity' as string]: 0.6 }} />

      <div className="relative flex items-center justify-between mb-5 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95 transition-transform" aria-label="Back">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display font-bold text-2xl vs-shimmer-text">Arcade</h1>
        <div className="w-10" />
      </div>

      <p className="relative text-muted-foreground text-sm mb-5 leading-relaxed z-10">
        Tap. Spin. Roll. Keep the chaos alive between rounds.
      </p>

      <div className="relative grid grid-cols-2 gap-3 z-10">
        {TOOLS.map((tool, i) => (
          <button
            key={tool.id}
            onClick={() => onPick(tool.id)}
            style={{ animationDelay: `${i * 70}ms` }}
            className="vs-preview-in relative overflow-hidden rounded-2xl luck-card-glow bg-card border border-white/[0.08] p-4 text-left active:scale-[0.97] transition-all hover:border-primary/40 min-h-[150px] flex flex-col justify-between"
          >
            {tool.tag && (
              <span className="absolute top-2 right-2 text-[9px] font-display font-bold tracking-wider bg-accent text-accent-foreground rounded-full px-2 py-0.5 shadow-soft">
                {tool.tag}
              </span>
            )}
            <div className="h-12 w-12 rounded-xl bg-background/60 backdrop-blur-sm grid place-items-center border border-white/[0.08]">
              <Preview tool={tool.id} />
            </div>
            <div>
              <div className="font-display font-bold text-foreground text-base leading-tight">{tool.title}</div>
              <div className="text-muted-foreground text-xs mt-0.5">{tool.subtitle}</div>
            </div>
          </button>
        ))}
      </div>

      <p className="relative text-center text-[11px] text-muted-foreground/70 mt-auto pt-8 z-10">
        🤠 Pass the phone. Let the night decide.
      </p>
    </div>
  );
};

export default LuckHub;
