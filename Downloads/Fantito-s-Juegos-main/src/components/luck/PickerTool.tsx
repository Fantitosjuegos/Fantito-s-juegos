import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Plus, X, Sparkles } from 'lucide-react';
import { loadLuckPlayers } from '@/lib/luck-storage';

const PickerTool = ({ onBack }: { onBack: () => void }) => {
  const [names, setNames] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [rolling, setRolling] = useState(false);
  const [current, setCurrent] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const saved = loadLuckPlayers();
    setNames(saved.length >= 2 ? saved : ['Player 1', 'Player 2', 'Player 3']);
    return () => { timers.current.forEach(t => clearTimeout(t)); };
  }, []);

  const add = () => {
    const v = input.trim();
    if (!v) return;
    setNames([...names, v]);
    setInput('');
  };
  const remove = (i: number) => setNames(names.filter((_, idx) => idx !== i));

  const pick = () => {
    if (names.length < 1 || rolling) return;
    setWinner(null);
    setRolling(true);

    // Build a tension curve: fast cycling → slowdown → fake-stop → final reveal
    const sequence: number[] = [];
    // Fast phase
    for (let i = 0; i < 14; i++) sequence.push(60);
    // Slowdown
    for (let i = 0; i < 8; i++) sequence.push(80 + i * 35);
    // Fake almost-stop
    sequence.push(420);
    sequence.push(180); // jolt
    sequence.push(520); // dramatic pause
    // Final reveal
    sequence.push(700);

    let elapsed = 0;
    let last = '';
    const finalName = names[Math.floor(Math.random() * names.length)];

    sequence.forEach((delay, idx) => {
      elapsed += delay;
      const t = window.setTimeout(() => {
        if (idx === sequence.length - 1) {
          setCurrent(finalName);
          setWinner(finalName);
          setRolling(false);
          if (navigator.vibrate) navigator.vibrate([8, 30, 14]);
        } else {
          let n = names[Math.floor(Math.random() * names.length)];
          if (n === last && names.length > 1) {
            n = names[(names.indexOf(n) + 1) % names.length];
          }
          last = n;
          setCurrent(n);
          if (delay > 300 && navigator.vibrate) navigator.vibrate(4);
        }
      }, elapsed);
      timers.current.push(t);
    });
  };

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">
      <div className="vs-atmosphere" style={{ ['--vs-intensity' as string]: rolling ? 1 : winner ? 0.7 : 0.4 }} />

      <div className="relative flex items-center justify-between mb-4 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Random Picker</h1>
        <div className="w-10" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center gap-6 z-10">
        <Sparkles className={`w-10 h-10 text-primary ${rolling ? 'animate-pulse' : ''}`} />
        <div className="relative text-center min-h-[180px] w-full flex flex-col items-center justify-center">
          {/* Glow halo behind name */}
          <div className={`absolute inset-0 m-auto w-56 h-56 rounded-full transition-opacity duration-500 ${winner || rolling ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'radial-gradient(circle, hsl(var(--primary)/0.35), transparent 65%)' }} />

          {winner ? (
            <div className="relative luck-pop">
              <div className="font-display font-bold text-5xl vs-shimmer-text">{winner}</div>
            </div>
          ) : (
            <div
              className={`relative font-display font-bold text-5xl ${rolling ? 'text-foreground' : 'text-foreground/40'}`}
              style={{ transition: 'transform 60ms', transform: rolling ? 'scale(1.04)' : 'scale(1)' }}
            >
              {current || 'Tap pick'}
            </div>
          )}
        </div>
      </div>

      <div className="relative mb-3 z-10">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Add name"
            className="flex-1 bg-card border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
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
        onClick={pick}
        disabled={rolling || names.length === 0}
        className="relative w-full bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 z-10 vs-pulse-glow"
      >
        {rolling ? 'Picking…' : winner ? 'Pick again' : 'Pick someone'}
      </button>
    </div>
  );
};

export default PickerTool;
