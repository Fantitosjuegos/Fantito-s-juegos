import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { loadLuckPlayers } from '@/lib/luck-storage';
import mascotPointer from '@/assets/mascot-pointer.png';

// Brand-cohesive palette (pink/blue + warm tints from index.css)
const PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--tint-pregame))',
  'hsl(var(--tint-bar))',
  'hsl(var(--tint-vacation))',
  'hsl(var(--tint-house-party))',
  'hsl(var(--tint-chill-night))',
  'hsl(var(--tint-road-trip))',
];

const WheelTool = ({ onBack }: { onBack: () => void }) => {
  const [names, setNames] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  useEffect(() => {
    const saved = loadLuckPlayers();
    if (saved.length >= 2) setNames(saved);
    else setNames(['Player 1', 'Player 2', 'Player 3']);
  }, []);

  const add = () => {
    const v = input.trim();
    if (!v || names.length >= 12) return;
    setNames([...names, v]);
    setInput('');
  };
  const remove = (i: number) => setNames(names.filter((_, idx) => idx !== i));

  const spin = () => {
    if (names.length < 2 || spinning) return;
    setWinnerIdx(null);
    const turns = 6 + Math.random() * 3;
    const target = rotation + turns * 360 + Math.random() * 360;
    setSpinning(true);
    setRotation(target);
    setTimeout(() => {
      const seg = 360 / names.length;
      // Mascot points at the LEFT edge of the wheel = 270deg (12 o'clock = 0).
      // After rotation r, segment at base angle a sits at (a + r) mod 360.
      // We want segment center = 270deg.
      const finalAngle = ((target % 360) + 360) % 360;
      const idx = Math.floor(((270 - finalAngle - seg / 2 + 720) % 360) / seg) % names.length;
      setWinnerIdx(idx);
      setSpinning(false);
      if (navigator.vibrate) navigator.vibrate([10, 40, 18]);
    }, 5200);
  };

  const seg = names.length > 0 ? 360 / names.length : 0;

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">
      <div className="vs-atmosphere" style={{ ['--vs-intensity' as string]: spinning ? 1 : winnerIdx !== null ? 0.7 : 0.4 }} />

      <div className="relative flex items-center justify-between mb-4 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Spin the Wheel</h1>
        <div className="w-10" />
      </div>

      {/* Wheel + mascot pointer (mascot on the left, finger pointing right at the wheel) */}
      <div className="relative h-[320px] mx-auto my-4 flex items-center justify-center w-full">
        {/* Mascot pointer */}
        <img
          src={mascotPointer}
          alt=""
          aria-hidden="true"
          className={`absolute left-0 z-20 h-[260px] w-auto pointer-events-none select-none transition-transform duration-300 ${spinning ? 'animate-pulse' : winnerIdx !== null ? 'scale-105' : ''}`}
          style={{ filter: 'drop-shadow(0 8px 18px hsl(var(--primary)/0.35))' }}
        />

        {/* Wheel container */}
        <div className="relative w-[260px] h-[260px] ml-8">
          {/* Glow ring */}
          <div className={`absolute inset-[-14px] rounded-full transition-opacity duration-700 ${spinning || winnerIdx !== null ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.4), transparent 65%)' }} />

          <div
            className="w-full h-full rounded-full border-4 border-white/[0.08] shadow-soft overflow-hidden relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 5.2s cubic-bezier(0.08, 0.85, 0.15, 1)' : 'none',
              background: names.length
                ? `conic-gradient(${names
                    .map((_, i) => `${PALETTE[i % PALETTE.length]} ${i * seg}deg ${(i + 1) * seg}deg`)
                    .join(', ')})`
                : 'hsl(var(--card))',
            }}
          >
            {names.map((n, i) => {
              const angle = i * seg + seg / 2;
              const isWinner = winnerIdx === i && !spinning;
              return (
                <div
                  key={i}
                  className="absolute left-1/2 top-1/2 origin-left text-xs font-semibold text-white/95 pointer-events-none"
                  style={{
                    transform: `rotate(${angle}deg) translateX(34px)`,
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    fontWeight: isWinner ? 800 : 600,
                    fontSize: isWinner ? 14 : 12,
                  }}
                >
                  <span className="inline-block max-w-[90px] truncate">{n}</span>
                </div>
              );
            })}
          </div>
          {/* Hub */}
          <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-card border border-white/[0.12] grid place-items-center font-display font-bold text-foreground shadow-soft">
            ★
          </div>

          {/* Winning segment overlay glow */}
          {winnerIdx !== null && !spinning && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `conic-gradient(transparent ${winnerIdx * seg}deg, hsl(var(--primary)/0.35) ${winnerIdx * seg}deg ${(winnerIdx + 1) * seg}deg, transparent ${(winnerIdx + 1) * seg}deg)`,
                transform: `rotate(${rotation}deg)`,
                mixBlendMode: 'screen',
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-2 mb-3 relative z-10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add name"
            className="flex-1 bg-card border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
          />
          <button onClick={add} className="h-10 w-10 grid place-items-center rounded-lg bg-primary text-primary-foreground active:scale-95" aria-label="Add">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {names.map((n, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-card border border-white/[0.08] rounded-full px-2.5 py-1">
              {n}
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-foreground" aria-label="Remove">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning || names.length < 2}
        className="relative w-full bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 z-10 vs-pulse-glow"
      >
        {spinning ? 'Spinning…' : winnerIdx !== null ? 'Spin again' : 'Spin'}
      </button>
    </div>
  );
};

export default WheelTool;
