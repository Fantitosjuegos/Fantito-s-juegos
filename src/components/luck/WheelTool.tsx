import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { loadLuckPlayers } from '@/lib/luck-storage';

// Vibrant flat-pie palette inspired by playful printed wheels.
const PALETTE = [
  '#F5A524', '#F25C54', '#E84A8A', '#A66BD4',
  '#5B8DEF', '#3DC2A6', '#9BD25A', '#FFD15C',
  '#FF7A45', '#7A6CF0', '#3FA9F5', '#FF5BA8',
];

const RING_COLOR = '#E63946';

const WheelTool = ({ onBack }: { onBack: () => void }) => {
  const [names, setNames] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const saved = await loadLuckPlayers();
      if (saved.length >= 2) setNames(saved);
      else setNames(['Player 1', 'Player 2', 'Player 3']);
    };
    load();
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
      const r = ((target % 360) + 360) % 360;
      const idx = Math.floor(((360 - r) % 360) / seg) % names.length;
      setWinnerIdx(idx);
      setSpinning(false);
      if (navigator.vibrate) navigator.vibrate([10, 40, 18]);
    }, 5200);
  };

  const seg = names.length > 0 ? 360 / names.length : 0;

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">

      <div className="relative flex items-center justify-between mb-4 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Spin the Wheel</h1>
        <div className="w-10" />
      </div>

      {/* Wheel */}
      <div className="relative mx-auto my-4 flex items-center justify-center w-full">
        <div className="relative w-[300px] h-[300px]">

          {/* Pointer at top — CSS triangle */}
          <div className="absolute left-1/2 -top-1 -translate-x-1/2 z-20 pointer-events-none">
            <div className="w-0 h-0" style={{
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: `22px solid ${RING_COLOR}`,
              filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))',
            }} />
          </div>

          {/* Thick contrast ring */}
          <div className="absolute inset-0 rounded-full" style={{
            background: RING_COLOR,
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255,255,255,0.18)',
          }} />

          {/* Pie wheel */}
          <div className="absolute inset-[10px] rounded-full overflow-hidden">
            <div className="w-full h-full rounded-full" style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 5.2s cubic-bezier(0.08, 0.85, 0.15, 1)' : 'transform 0.5s ease-out',
              background: names.length
                ? `conic-gradient(${names.map((_, i) => `${PALETTE[i % PALETTE.length]} ${i * seg}deg ${(i + 1) * seg}deg`).join(', ')})`
                : '#fff',
            }}>
              {names.map((n, i) => {
                const center = i * seg + seg / 2;
                const isWinner = winnerIdx === i && !spinning;
                return (
                  <div key={i}>
                    {/* Divider line */}
                    <div className="absolute left-1/2 top-1/2 w-px origin-top pointer-events-none"
                      style={{ height: '50%', background: 'rgba(0,0,0,0.12)', transform: `rotate(${i * seg}deg)` }} />
                    {/* Label */}
                    <div className="absolute left-1/2 top-1/2 origin-left pointer-events-none"
                      style={{ transform: `rotate(${center - 90}deg) translateX(46px)` }}>
                      <span className="inline-block max-w-[78px] truncate font-display font-bold" style={{
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.45)',
                        fontSize: isWinner ? 14 : 12,
                        transform: 'rotate(90deg) translateY(-50%)',
                        transformOrigin: 'left top',
                        letterSpacing: '0.01em',
                      }}>
                        {n}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center hub */}
          <div className="absolute inset-0 m-auto w-14 h-14 rounded-full grid place-items-center font-display font-black text-white z-10"
            style={{ background: RING_COLOR, boxShadow: '0 4px 10px rgba(0,0,0,0.3), inset 0 2px 3px rgba(255,255,255,0.25)', border: '3px solid #fff' }}>
            ★
          </div>
        </div>
      </div>

      <div className="mt-2 mb-3 relative z-10">
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add name"
            className="flex-1 bg-card border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50" />
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

      <button onClick={spin} disabled={spinning || names.length < 2}
        className="relative w-full bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 z-10">
        {spinning ? 'Spinning…' : winnerIdx !== null ? 'Spin again' : 'Spin'}
      </button>
    </div>
  );
};

export default WheelTool;