import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, X, Trophy, Crown } from 'lucide-react';
import { loadLuckPlayers } from '@/lib/luck-storage';

type Match = {
  id: string;
  round: number;
  a: string | null;
  b: string | null;
  winner: string | null;
  bye?: boolean;
};

const buildBracket = (players: string[]): Match[][] => {
  const n = players.length;
  const size = Math.max(2, 1 << Math.ceil(Math.log2(Math.max(2, n))));
  const padded: (string | null)[] = [...players];
  while (padded.length < size) padded.push(null);

  const rounds: Match[][] = [];
  const round1: Match[] = [];
  for (let i = 0; i < size; i += 2) {
    round1.push({
      id: `r0-${i / 2}`,
      round: 0,
      a: padded[i],
      b: padded[i + 1],
      winner: padded[i] && !padded[i + 1] ? padded[i] : padded[i + 1] && !padded[i] ? padded[i + 1] : null,
      bye: !padded[i] || !padded[i + 1],
    });
  }
  rounds.push(round1);

  let count = round1.length;
  let r = 1;
  while (count > 1) {
    count = count / 2;
    const next: Match[] = [];
    for (let i = 0; i < count; i++) {
      next.push({ id: `r${r}-${i}`, round: r, a: null, b: null, winner: null });
    }
    rounds.push(next);
    r++;
  }
  return rounds;
};

const roundLabel = (idx: number, total: number) => {
  const remaining = total - idx;
  if (remaining === 1) return 'Final';
  if (remaining === 2) return 'Semi-final';
  if (remaining === 3) return 'Quarter-final';
  return `Round ${idx + 1}`;
};

const TournamentTool = ({ onBack }: { onBack: () => void }) => {
  const [names, setNames] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [rounds, setRounds] = useState<Match[][] | null>(null);
  const [chooser, setChooser] = useState<{ r: number; m: number } | null>(null);
  const [champion, setChampion] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadLuckPlayers();
    setNames(saved.length >= 2 ? saved : ['Player 1', 'Player 2', 'Player 3', 'Player 4']);
  }, []);

  const add = () => {
    const v = input.trim();
    if (!v || names.length >= 16) return;
    setNames([...names, v]);
    setInput('');
  };
  const remove = (i: number) => setNames(names.filter((_, idx) => idx !== i));

  const start = () => {
    if (names.length < 2) return;
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const built = buildBracket(shuffled);
    setRounds(built);
    setChampion(null);
    setTimeout(() => advanceByes(built), 400);
  };

  const advanceByes = (rs: Match[][]) => {
    const copy = rs.map(r => r.map(m => ({ ...m })));
    for (let r = 0; r < copy.length - 1; r++) {
      copy[r].forEach((m, i) => {
        if (m.winner) {
          const nextMatch = copy[r + 1][Math.floor(i / 2)];
          if (i % 2 === 0) nextMatch.a = m.winner;
          else nextMatch.b = m.winner;
        }
      });
    }
    setRounds(copy);
  };

  const declareWinner = (winner: string) => {
    if (!rounds || !chooser) return;
    const { r, m } = chooser;
    const copy = rounds.map(rd => rd.map(mm => ({ ...mm })));
    copy[r][m].winner = winner;
    if (r + 1 < copy.length) {
      const nextMatch = copy[r + 1][Math.floor(m / 2)];
      if (m % 2 === 0) nextMatch.a = winner;
      else nextMatch.b = winner;
    } else {
      setChampion(winner);
    }
    setRounds(copy);
    setChooser(null);
    if (navigator.vibrate) navigator.vibrate([10, 30, 14]);
  };

  const reset = () => { setRounds(null); setChampion(null); setChooser(null); };

  // Setup screen
  if (!rounds) {
    return (
      <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">
        <div className="vs-atmosphere" style={{ ['--vs-intensity' as string]: 0.5 }} />

        <div className="relative flex items-center justify-between mb-4 z-10">
          <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl">Tournament</h1>
          <div className="w-10" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center mb-6">
          <Trophy className="w-14 h-14 text-accent drop-shadow-[0_0_18px_hsl(var(--accent)/0.6)] luck-mini-pulse" />
          <h2 className="font-display font-bold text-2xl mt-3 vs-shimmer-text">Set up the bracket</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
            Add players. We shuffle and build the bracket. You play the matches and pick the winners.
          </p>
        </div>

        <div className="relative mb-3 z-10">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && add()}
              placeholder="Add player"
              className="flex-1 bg-card border border-white/[0.08] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
            />
            <button onClick={add} className="h-10 w-10 grid place-items-center rounded-lg bg-primary text-primary-foreground active:scale-95" aria-label="Add">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {names.map((n, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-card border border-white/[0.08] rounded-full px-2.5 py-1">
                {n}
                <button onClick={() => remove(i)} className="text-muted-foreground hover:text-foreground" aria-label="Remove">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            {names.length} {names.length === 1 ? 'player' : 'players'} · Min 2, max 16
          </p>
        </div>

        <button
          onClick={start}
          disabled={names.length < 2}
          className="relative mt-auto w-full bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 z-10 vs-pulse-glow"
        >
          Build the bracket
        </button>
      </div>
    );
  }

  // Champion screen
  if (champion) {
    return (
      <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">
        <div className="vs-atmosphere" style={{ ['--vs-intensity' as string]: 1 }} />

        <div className="relative flex items-center justify-between mb-4 z-10">
          <button onClick={onBack} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl">Champion</h1>
          <div className="w-10" />
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center z-10 text-center">
          <div className="absolute inset-0 m-auto w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--accent)/0.35), transparent 60%)' }} />
          {Array.from({ length: 18 }).map((_, i) => {
            const angle = (i / 18) * Math.PI * 2;
            return (
              <span key={i}
                className="luck-spark absolute w-2 h-2 rounded-full bg-accent"
                style={{
                  ['--sx' as string]: `${Math.cos(angle) * 140}px`,
                  ['--sy' as string]: `${Math.sin(angle) * 140}px`,
                  animationDelay: `${i * 50}ms`,
                  animationIterationCount: 'infinite' as never,
                }} />
            );
          })}
          <Crown className="relative w-16 h-16 text-accent drop-shadow-[0_0_20px_hsl(var(--accent)/0.8)] luck-pop" />
          <div className="relative font-display font-bold text-5xl vs-shimmer-text mt-4 luck-pop" style={{ animationDelay: '200ms' }}>
            {champion}
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-2 z-10">
          <button onClick={reset} className="bg-card border border-white/[0.08] text-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98]">
            New tournament
          </button>
          <button onClick={start} className="bg-primary text-primary-foreground font-display font-semibold py-4 rounded-xl active:scale-[0.98] vs-pulse-glow">
            Run it back
          </button>
        </div>
      </div>
    );
  }

  // Bracket view
  const chooserMatch = chooser ? rounds[chooser.r][chooser.m] : null;

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col px-5 pt-6 pb-8 overflow-hidden">
      <div className="vs-atmosphere" style={{ ['--vs-intensity' as string]: 0.6 }} />

      <div className="relative flex items-center justify-between mb-4 z-10">
        <button onClick={reset} className="h-10 w-10 grid place-items-center rounded-full bg-card border border-white/[0.08] active:scale-95" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl">Bracket</h1>
        <div className="w-10" />
      </div>

      <div className="relative flex-1 overflow-x-auto z-10">
        <div className="flex gap-4 min-w-max pb-4">
          {rounds.map((round, ri) => (
            <div key={ri} className="flex flex-col justify-around gap-3 min-w-[140px]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center mb-1">
                {roundLabel(ri, rounds.length)}
              </div>
              {round.map((m, mi) => {
                const ready = !!m.a && !!m.b && !m.winner;
                const done = !!m.winner;
                return (
                  <button
                    key={m.id}
                    onClick={() => ready && setChooser({ r: ri, m: mi })}
                    disabled={!ready}
                    className={`text-left rounded-xl border p-2.5 transition-all ${
                      ready
                        ? 'bg-card border-primary/40 luck-spotlight active:scale-95'
                        : done
                        ? 'bg-card border-accent/30'
                        : 'bg-card/50 border-white/[0.06] opacity-60'
                    }`}
                  >
                    <div className={`text-sm font-semibold truncate ${m.winner === m.a ? 'text-accent' : m.a ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                      {m.a ?? '—'}
                    </div>
                    <div className="text-[10px] text-muted-foreground my-0.5">vs</div>
                    <div className={`text-sm font-semibold truncate ${m.winner === m.b ? 'text-accent' : m.b ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                      {m.b ?? (m.bye && m.a ? 'BYE' : '—')}
                    </div>
                    {ready && <div className="text-[10px] text-primary font-display font-bold mt-1.5 uppercase tracking-wider">Pick winner</div>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="relative text-center text-xs text-muted-foreground/70 mt-2 z-10">
        Tap a match. Pick who won.
      </div>

      {/* Winner chooser modal */}
      {chooser && chooserMatch && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm px-5" onClick={() => setChooser(null)}>
          <div className="w-full max-w-[360px] bg-card border border-white/[0.08] rounded-2xl p-5 shadow-soft luck-pop" onClick={e => e.stopPropagation()}>
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground text-center mb-1">
              {roundLabel(chooser.r, rounds.length)}
            </div>
            <div className="text-center font-display font-bold text-lg text-foreground mb-4">Who won?</div>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => declareWinner(chooserMatch.a!)}
                className="bg-primary/10 border border-primary/40 text-foreground font-display font-bold text-lg py-4 rounded-xl active:scale-[0.98]"
              >
                {chooserMatch.a}
              </button>
              <button
                onClick={() => declareWinner(chooserMatch.b!)}
                className="bg-accent/10 border border-accent/40 text-foreground font-display font-bold text-lg py-4 rounded-xl active:scale-[0.98]"
              >
                {chooserMatch.b}
              </button>
            </div>
            <button
              onClick={() => setChooser(null)}
              className="w-full mt-3 text-xs text-muted-foreground py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentTool;
