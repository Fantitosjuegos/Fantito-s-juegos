import { useEffect, useMemo, useRef, useState, memo } from 'react';
import { Language, ConsumptionType, GameMode } from '@/lib/onboarding-types';
import { isRTL } from '@/lib/translations';
import { GameCard } from '@/lib/game-types';
import { Mood } from '@/lib/card-mood';
import { Flame, Repeat, RotateCcw, Sparkles, Eye, Skull, Lock, Brain, Users } from 'lucide-react';
import mascot from '@/assets/mascot.webp';
import AtmosphereLayer from './AtmosphereLayer';
import { buildSessionReport } from '@/lib/session-report';

export interface SessionStats {
  total: number;
  done: number;
  skipped: number;
  starred: number;
  /** danger types skipped (intimate / chaos / nasty) */
  dangerSkipped: number;
  byType: Record<string, number>;
  remainingInQueue: number;
}

interface Props {
  lang: Language;
  cards: GameCard[];
  stats: SessionStats;
  players: string[];
  vibes: string[];
  consumptions: ConsumptionType[];
  mode?: GameMode;
  mood: Mood;
  onRelaunch: () => void;
  onRestart: () => void;
  relaunchLoading?: boolean;
}

const LABELS: Record<Language, {
  chaosScore: string; callouts: string; roles: string; learned: string; unlocked: string;
  runItBack: string; runSub: string; newGame: string;
  fomoCards: string; fomoSkipped: string; fomoStars: string;
}> = {
  en: { chaosScore: 'Chaos score', callouts: 'Group callouts', roles: 'Tonight’s roles', learned: 'What Fantito learned', unlocked: 'Just unlocked', runItBack: 'Run it back', runSub: 'Fantito will adapt to what just happened', newGame: 'New game', fomoCards: 'cards still hidden', fomoSkipped: 'questions ducked', fomoStars: 'cards starred' },
  es: { chaosScore: 'Caos', callouts: 'Apuntes del grupo', roles: 'Roles de la noche', learned: 'Lo que Fantito aprendió', unlocked: 'Desbloqueado', runItBack: 'Otra ronda', runSub: 'Fantito se adaptará a lo que pasó', newGame: 'Nueva partida', fomoCards: 'cartas escondidas', fomoSkipped: 'preguntas esquivadas', fomoStars: 'cartas marcadas' },
  fr: { chaosScore: 'Chaos', callouts: 'Constats du groupe', roles: 'Rôles de la soirée', learned: 'Ce que Fantito a vu', unlocked: 'Déverrouillé', runItBack: 'On remet ça', runSub: "Fantito s'adaptera à ce qu'il a vu", newGame: 'Nouvelle partie', fomoCards: 'cartes cachées', fomoSkipped: 'questions esquivées', fomoStars: 'cartes favorites' },
  de: { chaosScore: 'Chaos', callouts: 'Notizen', roles: 'Rollen heute Abend', learned: 'Was Fantito gelernt hat', unlocked: 'Freigeschaltet', runItBack: 'Nochmal', runSub: 'Fantito passt sich an', newGame: 'Neues Spiel', fomoCards: 'Karten versteckt', fomoSkipped: 'Fragen ausgewichen', fomoStars: 'markiert' },
  pt: { chaosScore: 'Caos', callouts: 'Notas do grupo', roles: 'Papéis da noite', learned: 'O que o Fantito aprendeu', unlocked: 'Desbloqueado', runItBack: 'Outra ronda', runSub: 'O Fantito vai adaptar-se', newGame: 'Novo jogo', fomoCards: 'cartas escondidas', fomoSkipped: 'perguntas esquivadas', fomoStars: 'marcadas' },
  it: { chaosScore: 'Caos', callouts: 'Appunti', roles: 'Ruoli della serata', learned: 'Cosa ha imparato Fantito', unlocked: 'Sbloccato', runItBack: 'Si rifà', runSub: 'Fantito si adatterà', newGame: 'Nuova partita', fomoCards: 'carte nascoste', fomoSkipped: 'domande schivate', fomoStars: 'salvate' },
  ar: { chaosScore: 'الفوضى', callouts: 'ملاحظات', roles: 'أدوار الليلة', learned: 'ما تعلمه فانتيتو', unlocked: 'تم فتحه', runItBack: 'جولة أخرى', runSub: 'فانتيتو سيتكيف', newGame: 'لعبة جديدة', fomoCards: 'بطاقات مخفية', fomoSkipped: 'أسئلة تم تجنبها', fomoStars: 'محفوظة' },
};

const SessionRecapScreen = ({
  lang, cards, stats, players, vibes, consumptions, mode, mood,
  onRelaunch, onRestart, relaunchLoading,
}: Props) => {
  const rtl = isRTL(lang);
  const labels = LABELS[lang] || LABELS.en;

  const report = useMemo(
    () => buildSessionReport({ stats, cards, players, vibes, consumptions, mode }),
    [stats, cards, players, vibes, consumptions, mode],
  );

  // Reveal sequence
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [120, 700, 1300, 1900, 2500, 3100, 3700].map((d, i) =>
      setTimeout(() => setPhase((p) => Math.max(p, i + 1)), d),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Animated meter
  const [meter, setMeter] = useState(0);
  useEffect(() => {
    if (phase < 2) return;
    let raf = 0;
    const start = performance.now();
    const dur = 1400;
    const tick = (now: number) => {
      const t2 = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t2, 3);
      setMeter(eased * report.chaosScore);
      if (t2 < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, report.chaosScore]);

  const lastPhase = useRef(0);
  useEffect(() => {
    if (phase !== lastPhase.current && 'vibrate' in navigator) {
      navigator.vibrate?.(phase === 4 ? 30 : 12);
      lastPhase.current = phase;
    }
  }, [phase]);

  const ctaReady = phase >= 4;

  return (
    <div className={`relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col overflow-hidden ${rtl ? 'direction-rtl' : ''}`}>
      <AtmosphereLayer mood={mood} />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[40%] z-[1] opacity-60"
        style={{
          background: `linear-gradient(180deg, hsl(${mood.primary} / 0.18), transparent)`,
          mixBlendMode: 'screen',
        }}
      />

      <div className="relative z-10 flex flex-col flex-1 px-5 pt-6 pb-5 gap-4 overflow-y-auto">
        {/* Header — dynamic title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl blur-xl vs-pulse-glow"
              style={{ background: `hsl(${mood.primary} / 0.55)` }}
            />
            <img
              src={mascot}
              alt="Fantito"
              className="relative w-14 h-14 rounded-2xl object-cover border border-white/20 vs-float"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-display font-bold tracking-[0.18em] uppercase text-muted-foreground">
              {report.subtitle}
            </p>
            <p className="text-sm font-display font-semibold text-foreground leading-snug">
              {report.sessionTitle}
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        </div>

        {/* Chaos meter + tags */}
        {phase >= 1 && (
          <div className="vs-rise rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-display font-bold tracking-[0.16em] uppercase text-muted-foreground flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" style={{ color: `hsl(${mood.primary})` }} />
                {labels.chaosScore} · {report.chaosLabel}
              </span>
              <span
                className="font-display text-2xl font-black tabular-nums"
                style={{ color: `hsl(${mood.primary})`, textShadow: `0 0 18px hsl(${mood.primary} / 0.7)` }}
              >
                {Math.round(meter)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${meter}%`,
                  background: `linear-gradient(90deg, hsl(${mood.accent}), hsl(${mood.primary}))`,
                  boxShadow: `0 0 14px hsl(${mood.primary} / 0.7)`,
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              {report.tags.map((t, i) => (
                <Badge
                  key={t.label}
                  icon={i === 0 ? <Skull className="w-3 h-3" /> : i === 1 ? <Eye className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  label={t.label}
                  value={t.value}
                  mood={mood}
                />
              ))}
            </div>
          </div>
        )}

        {/* Group callouts */}
        {phase >= 2 && (
          <div className="vs-rise space-y-2">
            <p className="text-[11px] font-display font-bold tracking-[0.16em] uppercase text-muted-foreground px-1 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> {labels.callouts}
            </p>
            <div className="space-y-1.5">
              {report.groupCallouts.map((line, i) => (
                <div
                  key={i}
                  className="vs-rise rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm px-3.5 py-2.5 text-sm font-display text-foreground"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player roles */}
        {phase >= 3 && report.playerRoles.length > 0 && (
          <div className="vs-rise space-y-2">
            <p className="text-[11px] font-display font-bold tracking-[0.16em] uppercase text-muted-foreground px-1">
              {labels.roles}
            </p>
            <div className="space-y-1.5">
              {report.playerRoles.map((r, i) => (
                <div
                  key={i}
                  className="vs-rise rounded-xl border border-white/10 bg-card/40 backdrop-blur-sm px-3.5 py-2.5 flex items-center justify-between gap-3"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-foreground truncate">
                      {r.player} <span className="text-primary">· {r.role}</span>
                    </p>
                    <p className="text-[10.5px] text-muted-foreground truncate">{r.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What Fantito learned */}
        {phase >= 4 && (
          <div
            className="vs-rise rounded-2xl border border-primary/25 p-3.5"
            style={{ background: `linear-gradient(135deg, hsl(${mood.primary} / 0.12), hsl(${mood.accent} / 0.08))` }}
          >
            <p className="text-[11px] font-display font-bold tracking-[0.16em] uppercase text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Brain className="w-3 h-3" style={{ color: `hsl(${mood.primary})` }} />
              {labels.learned}
            </p>
            <p className="font-display text-sm text-foreground/95 leading-snug italic">
              “{report.fantitoLearned}”
            </p>
          </div>
        )}

        {/* FOMO stats */}
        {phase >= 5 && (
          <div className="vs-rise grid grid-cols-3 gap-2">
            <FomoStat n={report.remainingInQueue} label={labels.fomoCards} mood={mood} />
            <FomoStat n={report.dangerSkipped}    label={labels.fomoSkipped} mood={mood} />
            <FomoStat n={report.starred}          label={labels.fomoStars} mood={mood} />
          </div>
        )}

        {/* Unlocks */}
        {phase >= 5 && (
          <div className="vs-rise rounded-2xl border border-white/10 p-4"
               style={{ background: `linear-gradient(135deg, hsl(${mood.primary} / 0.12), hsl(${mood.accent} / 0.08))` }}>
            <p className="text-[11px] font-display font-bold tracking-[0.16em] uppercase text-muted-foreground flex items-center gap-1.5 mb-2">
              <Lock className="w-3 h-3" /> {labels.unlocked}
            </p>
            <div className="space-y-1.5">
              {report.nextRoundAdjustments.map((u, i) => (
                <div
                  key={u}
                  className="vs-rise text-sm font-display font-semibold text-foreground flex items-center gap-2"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <span style={{ color: `hsl(${mood.primary})` }}>⚠</span> {u}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quote */}
        {phase >= 6 && (
          <div className="vs-rise rounded-2xl border border-white/15 bg-card/70 backdrop-blur-md p-4 flex items-start gap-3">
            <img src={mascot} alt="" className="w-9 h-9 rounded-xl object-cover border border-white/15 flex-shrink-0" />
            <p className="font-display text-sm italic text-foreground leading-snug">
              “{report.fantitoQuote}”
            </p>
          </div>
        )}

        <div className="flex-1 min-h-2" />

        {/* CTAs */}
        <div className="space-y-2 sticky bottom-0 -mx-5 px-5 pt-2 pb-1 bg-gradient-to-t from-background via-background/95 to-transparent">
          <button
            onClick={onRelaunch}
            disabled={relaunchLoading}
            className={`relative w-full text-primary-foreground font-display font-black text-base py-4 rounded-2xl active:scale-[0.98] transition-all overflow-hidden ${ctaReady ? 'vs-pulse-glow' : ''}`}
            style={{
              background: `linear-gradient(120deg, hsl(${mood.primary}), hsl(${mood.accent}))`,
              boxShadow: `0 0 28px -4px hsl(${mood.primary} / 0.85)`,
              opacity: relaunchLoading ? 0.7 : 1,
            }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Repeat className="w-4 h-4" />
              {relaunchLoading ? '…' : `🔥 ${labels.runItBack}`}
            </span>
            <span
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 opacity-60"
              style={{
                background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent)',
                animation: 'vs-shine 2.4s ease-in-out infinite',
              }}
            />
          </button>
          <p className="text-center text-[11px] text-muted-foreground -mt-1">{labels.runSub}</p>
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm text-foreground font-display font-semibold text-xs py-2.5 rounded-xl border border-white/10 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {labels.newGame}
          </button>
        </div>
      </div>
    </div>
  );
};

function Badge({ icon, label, value, mood }: { icon: React.ReactNode; label: string; value: string; mood: Mood }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card/40 px-2 py-2">
      <div className="flex items-center justify-center gap-1 text-[9px] font-display font-bold tracking-wider uppercase text-muted-foreground">
        {icon}{label}
      </div>
      <div
        className="text-[11px] font-display font-black mt-0.5"
        style={{ color: `hsl(${mood.primary})` }}
      >
        {value}
      </div>
    </div>
  );
}

function FomoStat({ n, label, mood }: { n: number; label: string; mood: Mood }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card/40 backdrop-blur-sm px-2 py-3 text-center">
      <div
        className="font-display font-black text-2xl tabular-nums"
        style={{ color: `hsl(${mood.primary})`, textShadow: `0 0 14px hsl(${mood.primary} / 0.55)` }}
      >
        {n}
      </div>
      <div className="text-[10px] leading-tight text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

export default memo(SessionRecapScreen);
