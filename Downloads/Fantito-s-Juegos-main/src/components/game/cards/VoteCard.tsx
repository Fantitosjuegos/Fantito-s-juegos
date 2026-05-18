import { useEffect, useMemo, useState } from 'react';
import { GameCard } from '@/lib/game-types';
import { GameMode, Language } from '@/lib/onboarding-types';
import { Mood } from '@/lib/card-mood';
import { Eye, EyeOff, Minus } from 'lucide-react';

interface PlayerLite { name: string; emoji: string }
interface Props {
  card: GameCard;
  mood: Mood;
  fallbackPlayers: PlayerLite[];
  mode?: GameMode;
  lang?: Language;
  onComplete: () => void;
}

const FALLBACK_EMOJI = '🤠';

const I18N: Record<string, {
  secretVote: string; groupVote: string;
  passTo: (n: string) => string; passTap: string;
  yourTurn: (n: string) => string; pickOne: string; voteCast: string;
  reveal: string; revealAnon: string; next: string;
  exposed: (n: string) => string; capReached: string; removeVote: string;
}> = {
  en: { secretVote: 'Secret vote', groupVote: 'Group vote', passTo: n => `Pass the phone to ${n}`, passTap: 'Tap when only they can see it', yourTurn: n => `${n}'s turn`, pickOne: 'Pick one — your vote stays anonymous', voteCast: 'Vote locked in', reveal: 'Reveal verdict', revealAnon: 'Reveal anonymous result', next: 'Next card', exposed: n => `${n} got exposed — next`, capReached: 'All votes cast', removeVote: 'Remove vote' },
  es: { secretVote: 'Voto secreto', groupVote: 'Voto del grupo', passTo: n => `Pasa el teléfono a ${n}`, passTap: 'Toca cuando solo lo vea esa persona', yourTurn: n => `Turno de ${n}`, pickOne: 'Elige uno — tu voto es anónimo', voteCast: 'Voto registrado', reveal: 'Revelar veredicto', revealAnon: 'Revelar resultado anónimo', next: 'Siguiente carta', exposed: n => `${n} quedó expuesto — siguiente`, capReached: 'Todos los votos emitidos', removeVote: 'Quitar voto' },
  fr: { secretVote: 'Vote secret', groupVote: 'Vote du groupe', passTo: n => `Passe le téléphone à ${n}`, passTap: 'Touche quand cette personne est seule à voir', yourTurn: n => `Au tour de ${n}`, pickOne: 'Choisis — ton vote reste anonyme', voteCast: 'Vote enregistré', reveal: 'Révéler le verdict', revealAnon: 'Révéler le résultat anonyme', next: 'Carte suivante', exposed: n => `${n} est démasqué — suivant`, capReached: 'Tous les votes sont émis', removeVote: 'Retirer le vote' },
  de: { secretVote: 'Geheime Abstimmung', groupVote: 'Gruppenabstimmung', passTo: n => `Reiche das Handy an ${n}`, passTap: 'Tippe, wenn nur diese Person sieht', yourTurn: n => `${n} ist dran`, pickOne: 'Wähle — deine Stimme bleibt anonym', voteCast: 'Stimme abgegeben', reveal: 'Urteil zeigen', revealAnon: 'Anonymes Ergebnis zeigen', next: 'Nächste Karte', exposed: n => `${n} wurde entlarvt — weiter`, capReached: 'Alle Stimmen abgegeben', removeVote: 'Stimme entfernen' },
  pt: { secretVote: 'Voto secreto', groupVote: 'Voto do grupo', passTo: n => `Passa o telemóvel ao ${n}`, passTap: 'Toca quando só essa pessoa vir', yourTurn: n => `Vez de ${n}`, pickOne: 'Escolhe — o teu voto fica anónimo', voteCast: 'Voto registado', reveal: 'Revelar veredicto', revealAnon: 'Revelar resultado anónimo', next: 'Próxima carta', exposed: n => `${n} foi exposto — próximo`, capReached: 'Todos os votos emitidos', removeVote: 'Remover voto' },
  it: { secretVote: 'Voto segreto', groupVote: 'Voto del gruppo', passTo: n => `Passa il telefono a ${n}`, passTap: 'Tocca quando solo lui/lei vede', yourTurn: n => `Turno di ${n}`, pickOne: 'Scegli — il tuo voto è anonimo', voteCast: 'Voto registrato', reveal: 'Rivela il verdetto', revealAnon: 'Rivela risultato anonimo', next: 'Carta successiva', exposed: n => `${n} è stato smascherato — avanti`, capReached: 'Tutti i voti espressi', removeVote: 'Rimuovi voto' },
  ar: { secretVote: 'تصويت سري', groupVote: 'تصويت جماعي', passTo: n => `مرر الهاتف إلى ${n}`, passTap: 'اضغط عندما يراه ${n} فقط', yourTurn: n => `دور ${n}`, pickOne: 'اختر — صوتك سري', voteCast: 'تم تسجيل الصوت', reveal: 'كشف النتيجة', revealAnon: 'كشف النتيجة المجهولة', next: 'البطاقة التالية', exposed: n => `${n} انكشف — التالي`, capReached: 'تم الإدلاء بكل الأصوات', removeVote: 'إزالة الصوت' },
};

const VoteCard = ({ card, mood, fallbackPlayers, mode, lang = 'en', onComplete }: Props) => {
  const emojiByName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of fallbackPlayers) m[p.name] = p.emoji;
    return m;
  }, [fallbackPlayers]);
  const players: PlayerLite[] = useMemo(() => {
    const src = card.players?.length
      ? card.players.map(name => ({ name, emoji: emojiByName[name] ?? FALLBACK_EMOJI }))
      : fallbackPlayers;
    return src.slice(0, 12);
  }, [card.players, fallbackPlayers, emojiByName]);
  const isNasty = mode === 'nasty18';
  const t = I18N[lang] ?? I18N.en;
  const maxVotes = players.length;

  // Anonymous nasty mode uses a sequential pass-the-phone state machine.
  // - voterIndex iterates through every player in `players`
  // - between each voter, the screen blanks ("pass the phone") so no one sees prior tallies
  const [voterIndex, setVoterIndex] = useState(0);
  const [passedPhone, setPassedPhone] = useState(false); // is the current voter looking at their screen?
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);

  // Open mode (non-nasty): old running tally style, all votes visible while casting
  const [openTotal, setOpenTotal] = useState(0);

  useEffect(() => {
    setVoterIndex(0);
    setPassedPhone(false);
    setVotes({});
    setRevealed(false);
    setOpenTotal(0);
  }, [card.card_id]);

  const total = useMemo(() => Object.values(votes).reduce((a, b) => a + b, 0), [votes]);
  const allVoted = total >= maxVotes;
  const winner = useMemo(() => {
    if (!revealed || total === 0) return null;
    return Object.entries(votes).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [revealed, votes, total]);

  // ─────────────────────────────────────
  // Anonymous (nasty) flow
  // ─────────────────────────────────────
  if (isNasty) {
    if (revealed) {
      return (
        <div className="flex-1 flex flex-col px-5 pt-5 pb-4">
          <Header mood={mood} label={t.secretVote} count={`${total}/${maxVotes}`} cardId={card.card_id} />
          <p className="font-display text-[18px] font-bold text-foreground leading-snug text-center mb-4 vs-rise">
            {card.question}
          </p>
          <div className="grid grid-cols-3 gap-2 flex-1 content-start">
            {players.map((p) => {
              const v = votes[p.name] ?? 0;
              const pct = total > 0 ? Math.round((v / total) * 100) : 0;
              const isWinner = winner === p.name;
              return (
                <div
                  key={p.name}
                  className="relative w-full flex flex-col items-center gap-1.5 p-2.5 rounded-xl border bg-background/40 overflow-hidden"
                  style={{
                    borderColor: isWinner ? `hsl(${mood.primary})` : 'hsl(var(--border) / 0.12)',
                    boxShadow: isWinner ? `0 0 22px -4px hsl(${mood.primary} / 0.7)` : undefined,
                  }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                    style={{
                      height: `${pct}%`,
                      background: `linear-gradient(0deg, hsl(${mood.primary} / 0.35), hsl(${mood.primary} / 0.05))`,
                    }}
                  />
                  <span className="relative text-2xl">{p.emoji || FALLBACK_EMOJI}</span>
                  <span className="relative font-display font-bold text-[11px] truncate max-w-full text-foreground">{p.name}</span>
                  <span className="relative text-[11px] font-display font-black" style={{ color: `hsl(${mood.primary})` }}>
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[10px] font-display text-muted-foreground italic">
            Votes were anonymous — only the totals are shown.
          </p>
          <button
            onClick={onComplete}
            className="mt-3 py-3 rounded-xl font-display font-bold text-sm text-primary-foreground"
            style={{
              background: `linear-gradient(120deg, hsl(${mood.primary}), hsl(${mood.accent}))`,
              boxShadow: `0 0 22px -6px hsl(${mood.primary} / 0.7)`,
            }}
          >
            {winner ? t.exposed(winner) : t.next}
          </button>
        </div>
      );
    }

    const currentVoter = players[voterIndex];

    // Pass-the-phone gate before each voter sees the grid
    if (!passedPhone) {
      return (
        <div className="flex-1 flex flex-col px-5 pt-5 pb-4">
          <Header mood={mood} label={t.secretVote} count={`${voterIndex}/${maxVotes}`} cardId={card.card_id} />
          <p className="font-display text-[18px] font-bold text-foreground leading-snug text-center mb-4 vs-rise">
            {card.question}
          </p>
          <button
            onClick={() => setPassedPhone(true)}
            className="flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-foreground"
            style={{ borderColor: `hsl(${mood.primary} / 0.4)` }}
          >
            <EyeOff className="w-9 h-9" style={{ color: `hsl(${mood.primary})` }} />
            <p className="font-display font-bold text-base text-center px-4">
              {t.passTo(currentVoter?.name ?? '?')}
            </p>
            <p className="text-xs text-muted-foreground text-center px-4">{t.passTap}</p>
          </button>
        </div>
      );
    }

    // Voter ballot — they pick one player, vote is recorded silently, screen blanks
    return (
      <div className="flex-1 flex flex-col px-5 pt-5 pb-4">
        <Header
          mood={mood}
          label={t.yourTurn(currentVoter?.name ?? '?')}
          count={`${voterIndex + 1}/${maxVotes}`}
          cardId={card.card_id}
        />
        <p className="font-display text-[18px] font-bold text-foreground leading-snug text-center mb-3 vs-rise">
          {card.question}
        </p>
        <p className="text-center text-[11px] font-display text-muted-foreground mb-3">{t.pickOne}</p>
        <div className="grid grid-cols-3 gap-2 flex-1 content-start">
          {players.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setVotes(v => ({ ...v, [p.name]: (v[p.name] ?? 0) + 1 }));
                navigator.vibrate?.(12);
                if (voterIndex + 1 >= maxVotes) {
                  // last voter just cast — auto-reveal anonymous result
                  setRevealed(true);
                } else {
                  setVoterIndex(i => i + 1);
                  setPassedPhone(false);
                }
              }}
              className="relative w-full flex flex-col items-center gap-1.5 p-2.5 rounded-xl border bg-background/40 active:scale-95 transition-all"
              style={{ borderColor: 'hsl(var(--border) / 0.18)' }}
            >
              <span className="text-2xl">{p.emoji || FALLBACK_EMOJI}</span>
              <span className="font-display font-bold text-[11px] truncate max-w-full text-foreground">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────
  // Open (non-nasty) flow — original tally-as-you-go behaviour
  // ─────────────────────────────────────
  const addVote = (name: string) => {
    if (revealed || openTotal >= maxVotes) return;
    setVotes(v => ({ ...v, [name]: (v[name] ?? 0) + 1 }));
    setOpenTotal(o => o + 1);
    navigator.vibrate?.(8);
  };
  const removeVote = (name: string) => {
    if (revealed) return;
    setVotes(v => {
      const cur = v[name] ?? 0;
      if (cur <= 0) return v;
      const nv = { ...v, [name]: cur - 1 };
      if (nv[name] === 0) delete nv[name];
      return nv;
    });
    setOpenTotal(o => Math.max(0, o - 1));
    navigator.vibrate?.(6);
  };
  const capReached = openTotal >= maxVotes;

  return (
    <div className="flex-1 flex flex-col px-5 pt-5 pb-4">
      <Header mood={mood} label={t.groupVote} count={`${openTotal}/${maxVotes}`} cardId={card.card_id} />
      <p className="font-display text-[18px] font-bold text-foreground leading-snug text-center mb-4 vs-rise">
        {card.question}
      </p>

      <div className="grid grid-cols-3 gap-2 flex-1 content-start">
        {players.map((p) => {
          const v = votes[p.name] ?? 0;
          const pct = openTotal > 0 ? Math.round((v / openTotal) * 100) : 0;
          const isWinner = winner === p.name;
          const disabled = revealed || (capReached && v === 0);
          return (
            <div key={p.name} className="relative">
              <button
                onClick={() => addVote(p.name)}
                disabled={disabled}
                className="relative w-full flex flex-col items-center gap-1.5 p-2.5 rounded-xl border bg-background/40 active:scale-95 transition-all overflow-hidden disabled:opacity-60"
                style={{
                  borderColor: isWinner ? `hsl(${mood.primary})` : v > 0 ? `hsl(${mood.primary} / 0.5)` : 'hsl(var(--border) / 0.12)',
                  boxShadow: isWinner ? `0 0 22px -4px hsl(${mood.primary} / 0.7)` : undefined,
                }}
              >
                {revealed && (
                  <div
                    className="absolute bottom-0 left-0 right-0 transition-all duration-700"
                    style={{
                      height: `${pct}%`,
                      background: `linear-gradient(0deg, hsl(${mood.primary} / 0.35), hsl(${mood.primary} / 0.05))`,
                    }}
                  />
                )}
                <span className="relative text-2xl">{p.emoji || FALLBACK_EMOJI}</span>
                <span className="relative font-display font-bold text-[11px] truncate max-w-full text-foreground">{p.name}</span>
                {!revealed && v > 0 && (
                  <span
                    className="relative text-[10px] font-display font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `hsl(${mood.primary} / 0.2)`, color: `hsl(${mood.primary})` }}
                  >
                    +{v}
                  </span>
                )}
                {revealed && (
                  <span className="relative text-[11px] font-display font-black" style={{ color: `hsl(${mood.primary})` }}>
                    {pct}%
                  </span>
                )}
              </button>
              {!revealed && v > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeVote(p.name); }}
                  aria-label={t.removeVote}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-card border border-white/15 flex items-center justify-center active:scale-90 transition-all shadow-sm"
                  style={{ color: `hsl(${mood.primary})` }}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {capReached && !revealed && (
        <p className="mt-3 text-center text-[11px] font-display text-muted-foreground">{t.capReached}</p>
      )}

      <div className="mt-4 flex gap-2">
        {!revealed ? (
          <button
            onClick={() => { setRevealed(true); navigator.vibrate?.(20); }}
            disabled={openTotal === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-display font-bold text-sm text-primary-foreground disabled:opacity-40"
            style={{
              background: `linear-gradient(120deg, hsl(${mood.primary}), hsl(${mood.accent}))`,
              boxShadow: `0 0 22px -6px hsl(${mood.primary} / 0.7)`,
            }}
          >
            <Eye className="w-4 h-4" /> {t.reveal}
          </button>
        ) : (
          <button
            onClick={onComplete}
            className="flex-1 py-3 rounded-xl font-display font-bold text-sm text-primary-foreground"
            style={{
              background: `linear-gradient(120deg, hsl(${mood.primary}), hsl(${mood.accent}))`,
              boxShadow: `0 0 22px -6px hsl(${mood.primary} / 0.7)`,
            }}
          >
            {winner ? t.exposed(winner) : t.next}
          </button>
        )}
      </div>
    </div>
  );
};

const Header = ({ mood, label, count, cardId }: { mood: Mood; label: string; count: string; cardId: number }) => (
  <div className="flex items-center gap-2 mb-3">
    <span
      className="text-[11px] font-display font-bold px-2.5 py-1 rounded-md uppercase tracking-wide"
      style={{ color: `hsl(${mood.primary})`, background: `hsl(${mood.primary} / 0.12)` }}
    >
      {label}
    </span>
    <span className="ml-auto text-[10px] text-muted-foreground font-display">{count}</span>
    <span className="text-[10px] text-muted-foreground font-display">#{cardId}</span>
  </div>
);

export default VoteCard;
