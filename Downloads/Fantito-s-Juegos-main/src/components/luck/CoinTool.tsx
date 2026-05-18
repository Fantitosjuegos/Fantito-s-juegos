import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

type Side = 'H' | 'T';

const CoinTool = ({ onBack }: { onBack: () => void }) => {
  const [side, setSide] = useState<Side>('H');
  const [flipping, setFlipping] = useState(false);
  const [bestOf3, setBestOf3] = useState(false);
  const [history, setHistory] = useState<Side[]>([]);
  const [flipKey, setFlipKey] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const flip = () => {
    setFlipping(true);
    setRevealed(false);
    const result: Side = Math.random() < 0.5 ? 'H' : 'T';
    setFlipKey(k => k + 1);
    setTimeout(() => {
      setSide(result);
      setFlipping(false);
      setRevealed(true);
      if (navigator.vibrate) navigator.vibrate([6, 24, 10]);
      if (bestOf3) {
        setHistory(prev => {
          const next = [...prev, result];
          if (next.length >= 3) setTimeout(() => setHistory([]), 4000);
          return next;
        });
      }
    }, 1700);
  };

  const heads = history.filter(s => s === 'H').length;
  const tails = history.length - heads;
  const winner = history.length >= 3 ? (heads > tails ? 'Heads wins' : 'Tails wins') : null;

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">
      <div className="vs-atmosphere" style={{ ['--vs-intensity' as string]: flipping ? 1 : 0.4 }} />

      <div className="relative flex items-center justify-between mb-3 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Coin Flip</h1>
        <div className="w-10" />
      </div>

      <div className="relative flex justify-center mb-6 z-10">
        <button
          onClick={() => { setBestOf3(b => !b); setHistory([]); }}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${bestOf3 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-white/[0.08]'}`}
        >
          Best of 3
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center gap-6 z-10">
        <div className="[perspective:1200px]">
          <div
            key={flipKey}
            className="relative w-44 h-44"
            style={{
              transformStyle: 'preserve-3d',
              animation: flipping ? 'luck-coin-flip 1.7s cubic-bezier(.2,.7,.25,1)' : 'none',
              transform: !flipping && side === 'T' ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Heads */}
            <div className="luck-coin-face absolute inset-0 rounded-full grid place-items-center font-display font-bold text-6xl border-4 border-primary/50 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.7)]"
              style={{ background: 'radial-gradient(circle at 35% 30%, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.4) 70%, hsl(var(--primary) / 0.2))' }}>
              <span className="text-primary-foreground drop-shadow-md">H</span>
            </div>
            {/* Tails */}
            <div className="luck-coin-face absolute inset-0 rounded-full grid place-items-center font-display font-bold text-6xl border-4 border-accent/50 shadow-[0_20px_60px_-15px_hsl(var(--accent)/0.7)]"
              style={{
                transform: 'rotateY(180deg)',
                background: 'radial-gradient(circle at 65% 30%, hsl(var(--accent) / 0.9), hsl(var(--accent) / 0.4) 70%, hsl(var(--accent) / 0.2))',
              }}>
              <span className="text-accent-foreground drop-shadow-md">T</span>
            </div>
          </div>
          {/* Shadow */}
          <div className={`mx-auto mt-3 h-2 rounded-full bg-black/40 blur-md transition-all duration-300 ${flipping ? 'w-20 opacity-30' : 'w-32 opacity-60'}`} />
        </div>

        {!flipping && revealed && (
          <div className="text-center luck-pop">
            <div className="font-display font-bold text-3xl text-foreground">{side === 'H' ? 'Heads' : 'Tails'}</div>
          </div>
        )}

        {bestOf3 && (
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-lg border grid place-items-center text-sm font-semibold transition-all ${
                    history[i] ? 'bg-primary/15 border-primary text-foreground luck-pop' : 'bg-card border-white/[0.08] text-muted-foreground/40'
                  }`}
                >
                  {history[i] ?? '·'}
                </div>
              ))}
            </div>
            {winner && <div className="font-display font-bold text-accent vs-rise">{winner}</div>}
          </div>
        )}
      </div>

      <button
        onClick={flip}
        disabled={flipping}
        className="relative mt-6 w-full bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 z-10 vs-pulse-glow"
      >
        {flipping ? 'Flipping…' : 'Flip the coin'}
      </button>
    </div>
  );
};

export default CoinTool;
