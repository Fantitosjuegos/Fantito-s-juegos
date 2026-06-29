import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { loadLuckPlayers } from '@/lib/luck-storage';
import bottleA from '@/assets/luck-icons/bottle-a.svg';
import bottleB from '@/assets/luck-icons/bottle-b.svg';

type Mode = 'one' | 'duo';
const MODE_META: Record<Mode, { label: string }> = { one: { label: 'One' }, duo: { label: 'Duo' } };

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
    const segSize = 360 / names.length;
    const giverIdx = Math.floor(Math.random() * names.length);
    let receiverIdx = Math.floor(Math.random() * names.length);
    if (isPair && receiverIdx === giverIdx) {
      receiverIdx = (giverIdx + 1 + Math.floor(Math.random() * (names.length - 1))) % names.length;
    }
    const fullSpinsA = 5 + Math.floor(Math.random() * 3);
    const fullSpinsB = 5 + Math.floor(Math.random() * 3);
    const currentA = ((rotation % 360) + 360) % 360;
    const currentB = ((secondRotation % 360) + 360) % 360;
    const targetA = giverIdx * segSize;
    const targetB = receiverIdx * segSize;
    const a = rotation + (360 - currentA) + fullSpinsA * 360 + targetA;
    const b = secondRotation + (360 - currentB) + fullSpinsB * 360 + targetB;
    setRotation(a);
    setSecondRotation(b);
    setSpinning(true);
    setTimeout(() => {
      setPicked(isPair ? [names[giverIdx], names[receiverIdx]] : [names[giverIdx]]);
      setSpinning(false);
      if (navigator.vibrate) navigator.vibrate([10, 60, 20]);
    }, 4200);
  };

  const seg = names.length > 0 ? 360 / names.length : 0;

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">

      <div className="relative flex items-center justify-between mb-3 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Bottle Spin</h1>
        <div className="w-10" />
      </div>

      <div className="relative flex justify-center gap-1.5 mb-4 z-10">
        {(Object.keys(MODE_META) as Mode[]).map(m => (
          <button key={m} onClick={() => { setMode(m); setPicked([]); }}
            className={`text-[11px] uppercase tracking-wider px-4 py-1.5 rounded-full border transition-colors ${mode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-white/[0.08]'}`}>
            {MODE_META[m].label}
          </button>
        ))}
      </div>

      <div className="relative flex-1 flex items-center justify-center z-10">
        <div className="relative w-[300px] h-[300px]">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/[0.08]">
            {names.map((n, i) => {
              const angle = i * seg;
              const rad = (angle * Math.PI) / 180;
              const radius = 132;
              const x = Math.cos(rad) * radius;
              const y = Math.sin(rad) * radius;
              const isPicked = picked.includes(n) && !spinning;
              return (
                <div key={i} className="absolute left-1/2 top-1/2 pointer-events-none transition-all"
                  style={{ transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))` }}>
                  <span className={`inline-block max-w-[80px] truncate text-xs font-semibold text-center ${isPicked ? 'text-primary scale-150 font-display font-bold' : 'text-foreground'}`}>{n}</span>
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 m-auto w-[170px] h-[170px] grid place-items-center pointer-events-none"
            style={{ transform: `rotate(${rotation}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.2, 1)' : 'transform 0.4s cubic-bezier(.5,1.6,.4,1)' }}>
            <img src={bottleA} alt="" className="w-[170px] h-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.25)]" />
          </div>
          {isPair && (
            <div className="absolute inset-0 m-auto w-[170px] h-[170px] grid place-items-center pointer-events-none"
              style={{ transform: `rotate(${secondRotation}deg)`, transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.85, 0.2, 1)' : 'transform 0.4s cubic-bezier(.5,1.6,.4,1)' }}>
              <img src={bottleB} alt="" className="w-[170px] h-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.25)]" />
            </div>
          )}
        </div>
      </div>

      <button onClick={spin} disabled={spinning}
        className="relative w-full bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 z-10">
        {spinning ? 'Spinning…' : picked.length ? 'Spin again' : 'Spin the bottle'}
      </button>
    </div>
  );
};

export default BottleTool;