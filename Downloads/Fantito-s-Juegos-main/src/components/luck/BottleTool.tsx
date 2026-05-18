import { useEffect, useState } from 'react';
import { ArrowLeft, Wine } from 'lucide-react';
import { loadLuckPlayers } from '@/lib/luck-storage';

type Mode = 'one' | 'duo';

const MODE_META: Record<Mode, { label: string }> = {
  one: { label: 'One' },
  duo: { label: 'Duo' },
};

const BottleTool = ({ onBack }: { onBack: () => void }) => {
  const [names, setNames] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [secondRotation, setSecondRotation] = useState(180);
  const [spinning, setSpinning] = useState(false);
  const [mode, setMode] = useState<Mode>('one');
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    const saved = loadLuckPlayers();
    setNames(saved.length >= 2 ? saved : ['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  }, []);

  const isPair = mode === 'duo';

  const spin = () => {
    if (spinning || names.length < 2) return;
    setPicked([]);
    const a = rotation + (1800 + Math.random() * 720);
    const b = secondRotation + (1800 + Math.random() * 720);
    setRotation(a);
    setSecondRotation(b);
    setSpinning(true);
    setTimeout(() => {
      const pick = (deg: number) => {
        const seg = 360 / names.length;
        const final = ((deg % 360) + 360) % 360;
        const idx = Math.floor(((360 - final + seg / 2) % 360) / seg) % names.length;
        return names[idx];
      };
      const giver = pick(a);
      let receiver = pick(b);
      if (isPair && receiver === giver && names.length > 1) {
        receiver = names[(names.indexOf(giver) + 1) % names.length];
      }
      setPicked(isPair ? [giver, receiver] : [giver]);
      setSpinning(false);
      if (navigator.vibrate) navigator.vibrate([10, 60, 20]);
    }, 4200);
  };

  const seg = names.length > 0 ? 360 / names.length : 0;

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">
      <div className="vs-atmosphere" style={{ ['--vs-intensity' as string]: spinning ? 1 : picked.length ? 0.7 : 0.4 }} />

      <div className="relative flex items-center justify-between mb-3 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Bottle Spin</h1>
        <div className="w-10" />
      </div>

      <div className="relative flex justify-center gap-1.5 mb-4 z-10">
        {(Object.keys(MODE_META) as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setPicked([]); }}
            className={`text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full border transition-colors ${mode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-white/[0.08]'}`}
          >
            {MODE_META[m].label}
          </button>
        ))}
      </div>

      <div className="relative w-[300px] h-[300px] mx-auto my-2">
        <div className={`absolute inset-[-12px] rounded-full transition-opacity duration-500 ${picked.length && !spinning ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.3), transparent 70%)' }} />

        <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/[0.08]">
          {names.map((n, i) => {
            const angle = i * seg;
            const isPicked = picked.includes(n) && !spinning;
            return (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 origin-left text-xs font-semibold pointer-events-none transition-all"
                style={{ transform: `rotate(${angle}deg) translateX(125px)` }}
              >
                <span className={`inline-block max-w-[80px] truncate -translate-y-1/2 ${isPicked ? 'text-primary scale-150 font-display font-bold drop-shadow-[0_0_10px_hsl(var(--primary)/0.9)]' : 'text-foreground'}`}>{n}</span>
              </div>
            );
          })}
        </div>

        {/* Bottle 1 */}
        <div
          className="absolute inset-0 m-auto w-32 h-32 grid place-items-center"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.2, 1)' : 'transform 0.4s cubic-bezier(.5,1.6,.4,1)',
          }}
        >
          <div className="relative w-7 h-32">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-7 bg-primary/80 rounded-t-md shadow-[inset_-2px_0_4px_rgba(0,0,0,0.3)]" />
            <div className="absolute top-7 left-1/2 -translate-x-1/2 w-7 h-24 rounded-md shadow-soft"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.5) 50%, hsl(var(--primary)/0.85) 100%)' }} />
            <div className="absolute top-8 left-1/2 -translate-x-[10px] w-1 h-20 bg-white/40 rounded-full blur-[1px]" />
          </div>
        </div>

        {/* Bottle 2 (duo mode) */}
        {isPair && (
          <div
            className="absolute inset-0 m-auto w-32 h-32 grid place-items-center"
            style={{
              transform: `rotate(${secondRotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.2, 1)' : 'transform 0.4s cubic-bezier(.5,1.6,.4,1)',
            }}
          >
            <div className="relative w-7 h-32">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-7 bg-accent/80 rounded-t-md" />
              <div className="absolute top-7 left-1/2 -translate-x-1/2 w-7 h-24 rounded-md shadow-soft"
                style={{ background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent)/0.5) 50%, hsl(var(--accent)/0.85) 100%)' }} />
              <div className="absolute top-8 left-1/2 -translate-x-[10px] w-1 h-20 bg-white/40 rounded-full blur-[1px]" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-card border border-white/[0.12] grid place-items-center shadow-soft">
          <Wine className="w-4 h-4 text-foreground" />
        </div>
      </div>

      <button
        onClick={spin}
        disabled={spinning}
        className="relative mt-auto w-full bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 z-10 vs-pulse-glow"
      >
        {spinning ? 'Spinning…' : picked.length ? 'Spin again' : 'Spin the bottle'}
      </button>
    </div>
  );
};

export default BottleTool;
