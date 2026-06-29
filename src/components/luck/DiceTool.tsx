import { useState } from 'react';
import { ArrowLeft, RotateCw } from 'lucide-react';
import dice1 from '@/assets/dice-faces/dice-1.svg';
import dice2 from '@/assets/dice-faces/dice-2.svg';
import dice3 from '@/assets/dice-faces/dice-3.svg';
import dice4 from '@/assets/dice-faces/dice-4.svg';
import dice5 from '@/assets/dice-faces/dice-5.svg';
import dice6 from '@/assets/dice-faces/dice-6.svg';

const FACES: Record<number, string> = { 1: dice1, 2: dice2, 3: dice3, 4: dice4, 5: dice5, 6: dice6 };

const Die = ({ value, delay }: { value: number; rolling: boolean; delay: number }) => (
  <img src={FACES[value]} alt={`Dice showing ${value}`}
    className="w-24 h-24 object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.18)] luck-pop"
    style={{ animationDelay: `${delay}ms` }} />
);

const DiceTool = ({ onBack }: { onBack: () => void }) => {
  const [count, setCount] = useState(1);
  const [values, setValues] = useState<number[]>([1]);
  const [rolling, setRolling] = useState(false);
  const [rollKey, setRollKey] = useState(0);

  const roll = () => {
    setRolling(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setValues(Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6)));
      ticks++;
      if (ticks > 10) {
        clearInterval(interval);
        const final = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6));
        setValues(final);
        setRolling(false);
        setRollKey(k => k + 1);
        if (navigator.vibrate) navigator.vibrate([8, 30, 16]);
      }
    }, 60);
  };

  const setDiceCount = (n: number) => {
    setCount(n);
    setValues(Array.from({ length: n }, () => 1));
  };

  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">

      <div className="relative flex items-center justify-between mb-3 z-10">
        <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Dice</h1>
        <div className="w-10" />
      </div>

      <div className="relative flex justify-center gap-2 mb-6 z-10">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <button key={n} onClick={() => setDiceCount(n)}
            className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all ${count === n ? 'bg-primary text-primary-foreground scale-105' : 'bg-card border border-white/[0.08] text-muted-foreground'}`}>
            {n}
          </button>
        ))}
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center gap-6 z-10">
        <div key={rollKey} className="flex flex-wrap justify-center gap-3 max-w-[320px]">
          {values.map((v, i) => <Die key={i} value={v} rolling={rolling} delay={i * 60} />)}
        </div>
        {!rolling && count > 1 && (
          <div className="text-center luck-pop">
            <div className="font-display font-bold text-5xl text-primary">{total}</div>
          </div>
        )}
      </div>

      <button onClick={roll} disabled={rolling}
        className="relative mt-6 w-full bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 z-10">
        <RotateCw className={`w-5 h-5 ${rolling ? 'animate-spin' : ''}`} />
        {rolling ? 'Rolling…' : values.every(v => v === 1) ? 'Roll' : 'Reroll'}
      </button>
    </div>
  );
};

export default DiceTool;