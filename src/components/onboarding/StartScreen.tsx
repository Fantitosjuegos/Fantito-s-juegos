import { useState, useEffect, useRef } from 'react';
import { Sparkles, Globe, LogIn, LogOut, X, Flame, Zap, Users, Wand2, Dice5 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import startBg from '@/assets/start-bg.webp';
import { Language, LANGUAGES } from '@/lib/onboarding-types';
import { useAuth } from '@/hooks/useAuth';

interface StartScreenProps {
  lang: Language;
  onStart: () => void;
  onLuck?: () => void;
  onLanguageChange?: (lang: Language) => void;
}

type PreviewKind = 'vote' | 'dare' | 'minigame';

const START_I18N: Record<string, {
  trending: string; headlinePrefix: string; headlineMid: string; headlineSuffix: string;
  subtitle: string; voteLabel: string; voteQuestion: string; challengeUnlocked: string;
  challengeTitle: string; sing: string; call: string; confess: string;
  minigameUnlocked: string; minigameTitle: string;
  pillPlayers: string; pillNoSignup: string; pillStartFast: string; pillAi: string;
  ctaStart: string; ctaSub: string; ctaLuck: string; tagline: string;
  langLabel: string; loginLabel: string;
}> = {
  en: { trending: 'Trending with party groups tonight', headlinePrefix: 'Let Fantito read the room', headlineMid: 'Fantito', headlineSuffix: 'and turn your crew into the game', subtitle: 'Answer a few quick questions. Fantito creates questions, votes, dares and mini-games based on your group’s vibe.', voteLabel: 'Vote', voteQuestion: "WHO'S MOST LIKELY TO TEXT THEIR EX TONIGHT?", challengeUnlocked: 'Fantito just noticed', challengeTitle: 'Someone here is acting way too innocent.', sing: 'Expose them', call: 'Protect them', confess: 'Make it worse', minigameUnlocked: 'Mini-game unlocked', minigameTitle: 'Chaos mode · everyone votes', pillPlayers: '2–10 players', pillNoSignup: 'No signup', pillStartFast: 'Starts in 10s', pillAi: 'AI adapts', ctaStart: 'Start the chaos', ctaSub: 'No signup · 2–10 players · Starts in 10s · AI adapts', ctaLuck: 'Try Luck Mode', tagline: 'No rules to learn. Just pass the phone.', langLabel: 'Language', loginLabel: 'Login' },
  es: { trending: 'Lo más popular en grupos de fiesta esta noche', headlinePrefix: 'Deja que Fantito lea el ambiente', headlineMid: 'Fantito', headlineSuffix: 'y convierta a tu grupo en el juego', subtitle: 'Responde unas preguntas rápidas. Fantito crea preguntas, votos, retos y mini-juegos según el vibe de tu grupo.', voteLabel: 'Voto', voteQuestion: '¿QUIÉN ES MÁS PROBABLE QUE LE ESCRIBA A SU EX HOY?', challengeUnlocked: 'Fantito acaba de notar', challengeTitle: 'Alguien aquí se hace el inocente.', sing: 'Delátalo', call: 'Protégelo', confess: 'Empeóralo', minigameUnlocked: 'Mini-juego desbloqueado', minigameTitle: 'Modo caos · todos votan', pillPlayers: '2–10 jugadores', pillNoSignup: 'Sin registro', pillStartFast: 'Empieza en 10s', pillAi: 'IA se adapta', ctaStart: 'Empezar el caos', ctaSub: 'Sin registro · 2–10 jugadores · Empieza en 10s · IA se adapta', ctaLuck: 'Probar modo suerte', tagline: 'Sin reglas que aprender. Solo pasa el móvil.', langLabel: 'Idioma', loginLabel: 'Entrar' },
  fr: { trending: 'En tendance dans les groupes de soirée', headlinePrefix: 'Laisse Fantito lire l’ambiance', headlineMid: 'Fantito', headlineSuffix: 'et transforme ta bande en jeu', subtitle: 'Réponds à quelques questions. Fantito crée questions, votes, défis et mini-jeux selon l’ambiance du groupe.', voteLabel: 'Vote', voteQuestion: 'QUI VA TEXTER SON EX CE SOIR ?', challengeUnlocked: 'Fantito vient de remarquer', challengeTitle: 'Quelqu’un ici joue beaucoup trop l’innocent.', sing: 'Dénonce-le', call: 'Protège-le', confess: 'Empire la chose', minigameUnlocked: 'Mini-jeu débloqué', minigameTitle: 'Mode chaos · tout le monde vote', pillPlayers: '2–10 joueurs', pillNoSignup: 'Sans compte', pillStartFast: 'Prêt en 10s', pillAi: 'L’IA s’adapte', ctaStart: 'Lancer le chaos', ctaSub: 'Sans compte · 2–10 joueurs · Prêt en 10s · IA s’adapte', ctaLuck: 'Essayer le mode chance', tagline: 'Aucune règle à apprendre. Passe juste le téléphone.', langLabel: 'Langue', loginLabel: 'Connexion' },
  de: { trending: 'Heute Abend angesagt in Party-Gruppen', headlinePrefix: 'Lass Fantito die Runde lesen', headlineMid: 'Fantito', headlineSuffix: 'und deine Crew zum Spiel machen', subtitle: 'Beantworte ein paar Fragen. Fantito macht Fragen, Votes, Dares & Mini-Games passend zur Stimmung der Gruppe.', voteLabel: 'Abstimmung', voteQuestion: 'WER SCHREIBT HEUTE NACHT SEINEM EX?', challengeUnlocked: 'Fantito hat etwas bemerkt', challengeTitle: 'Jemand hier tut viel zu unschuldig.', sing: 'Entlarven', call: 'Schützen', confess: 'Schlimmer machen', minigameUnlocked: 'Mini-Game freigeschaltet', minigameTitle: 'Chaos-Modus · alle stimmen ab', pillPlayers: '2–10 Spieler', pillNoSignup: 'Keine Anmeldung', pillStartFast: 'Start in 10s', pillAi: 'KI passt sich an', ctaStart: 'Chaos starten', ctaSub: 'Keine Anmeldung · 2–10 Spieler · Start in 10s · KI passt sich an', ctaLuck: 'Glücksmodus testen', tagline: 'Keine Regeln. Einfach das Handy weitergeben.', langLabel: 'Sprache', loginLabel: 'Anmelden' },
  pt: { trending: 'Em alta nos grupos de festa esta noite', headlinePrefix: 'Deixa o Fantito ler a sala', headlineMid: 'Fantito', headlineSuffix: 'e transformar a tua turma no jogo', subtitle: 'Responde a algumas perguntas. O Fantito cria perguntas, votos, desafios e mini-jogos conforme o vibe do grupo.', voteLabel: 'Voto', voteQuestion: 'QUEM VAI MANDAR SMS AO EX HOJE?', challengeUnlocked: 'O Fantito acabou de notar', challengeTitle: 'Alguém aqui está demasiado inocente.', sing: 'Expor', call: 'Proteger', confess: 'Piorar', minigameUnlocked: 'Mini-jogo desbloqueado', minigameTitle: 'Modo caos · todos votam', pillPlayers: '2–10 jogadores', pillNoSignup: 'Sem registo', pillStartFast: 'Começa em 10s', pillAi: 'A IA adapta-se', ctaStart: 'Começar o caos', ctaSub: 'Sem registo · 2–10 jogadores · Começa em 10s · IA adapta-se', ctaLuck: 'Experimentar modo sorte', tagline: 'Sem regras. Basta passar o telemóvel.', langLabel: 'Idioma', loginLabel: 'Entrar' },
  it: { trending: 'Di tendenza nei gruppi stasera', headlinePrefix: 'Lascia che Fantito legga la stanza', headlineMid: 'Fantito', headlineSuffix: 'e trasformi la tua crew nel gioco', subtitle: 'Rispondi a poche domande. Fantito crea domande, voti, sfide e mini-giochi sul vibe del gruppo.', voteLabel: 'Voto', voteQuestion: 'CHI SCRIVERÀ ALL’EX STASERA?', challengeUnlocked: 'Fantito ha appena notato', challengeTitle: 'Qualcuno qui fa troppo l’innocente.', sing: 'Smaschera', call: 'Proteggi', confess: 'Peggiora', minigameUnlocked: 'Mini-gioco sbloccato', minigameTitle: 'Modalità caos · tutti votano', pillPlayers: '2–10 giocatori', pillNoSignup: 'Senza registrazione', pillStartFast: 'Inizia in 10s', pillAi: 'L’IA si adatta', ctaStart: 'Inizia il caos', ctaSub: 'Senza registrazione · 2–10 giocatori · Inizia in 10s · IA si adatta', ctaLuck: 'Prova modalità fortuna', tagline: 'Nessuna regola. Basta passare il telefono.', langLabel: 'Lingua', loginLabel: 'Accedi' },
  ar: { trending: 'الأكثر رواجاً في المجموعات الليلة', headlinePrefix: 'دع Fantito يقرأ المجموعة', headlineMid: 'Fantito', headlineSuffix: 'ويحوّل رفاقك إلى اللعبة', subtitle: 'أجب على بضعة أسئلة سريعة. Fantito يصنع أسئلة وتصويتات وتحديات وألعاباً صغيرة حسب أجواء مجموعتك.', voteLabel: 'تصويت', voteQuestion: 'من الأرجح أن يراسل حبيبه السابق الليلة؟', challengeUnlocked: 'Fantito لاحظ شيئاً', challengeTitle: 'أحدهم هنا يتظاهر بالبراءة أكثر من اللازم.', sing: 'افضحه', call: 'احمِه', confess: 'زِد الأمر سوءاً', minigameUnlocked: 'لعبة مصغّرة جديدة', minigameTitle: 'وضع الفوضى · الجميع يصوّت', pillPlayers: '2–10 لاعبين', pillNoSignup: 'بدون تسجيل', pillStartFast: 'يبدأ خلال 10 ثوانٍ', pillAi: 'الذكاء يتكيّف', ctaStart: 'ابدأ الفوضى', ctaSub: 'بدون تسجيل · 2–10 لاعبين · يبدأ خلال 10 ثوانٍ · الذكاء يتكيّف', ctaLuck: 'جرّب وضع الحظ', tagline: 'بدون قواعد. فقط مرّر الهاتف.', langLabel: 'اللغة', loginLabel: 'تسجيل الدخول' },
};

const PREVIEW_CYCLE_MS = 3800;

const StartScreen = ({ lang, onStart, onLuck, onLanguageChange }: StartScreenProps) => {
  const t = START_I18N[lang] ?? START_I18N.en;
  const [langOpen, setLangOpen] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [voteFill, setVoteFill] = useState(0);
  const [confetti, setConfetti] = useState<{ id: number; tx: number; ty: number; hue: number }[]>([]);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const confettiId = useRef(0);

  const previews: PreviewKind[] = ['vote', 'dare', 'minigame'];
  const current = previews[previewIdx];

  // Cycle preview cards
  useEffect(() => {
    const id = setInterval(() => {
      setPreviewIdx((i) => (i + 1) % previews.length);
    }, PREVIEW_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  // Animate vote bar when vote card becomes active
  useEffect(() => {
    if (current === 'vote') {
      setVoteFill(0);
      const t = setTimeout(() => setVoteFill(83), 120);
      return () => clearTimeout(t);
    }
  }, [current]);

  const handleStart = () => {
    // Light haptic
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator as Navigator).vibrate?.(10); } catch { /* noop */ }
    }
    // Confetti burst
    const burst = Array.from({ length: 14 }).map(() => ({
      id: confettiId.current++,
      tx: (Math.random() - 0.5) * 220,
      ty: -80 - Math.random() * 160,
      hue: Math.random() < 0.5 ? 339 : 217,
    }));
    setConfetti(burst);
    setTimeout(() => setConfetti([]), 900);
    setTimeout(() => onStart(), 180);
  };

  return (
    <div className="min-h-[100dvh] max-w-[430px] mx-auto bg-background relative overflow-hidden flex flex-col px-5 pt-4 pb-6">
      <style>{`
        @keyframes drift { 0%,100% { transform: translate(0,0) } 50% { transform: translate(-10px,-8px) } }
        @keyframes blob { 0%,100% { transform: translate(0,0) scale(1); opacity: .55 } 50% { transform: translate(20px,-12px) scale(1.08); opacity: .8 } }
        @keyframes float-chip { 0%,100% { transform: translateY(0) rotate(var(--r,0deg)) } 50% { transform: translateY(-5px) rotate(var(--r,0deg)) } }
        @keyframes confetti-pop {
          0% { transform: translate(0,0) rotate(0); opacity: 1 }
          100% { transform: translate(var(--tx), var(--ty)) rotate(540deg); opacity: 0 }
        }
        @keyframes glow-pulse {
          0%,100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.55), 0 8px 28px -6px hsl(var(--primary) / 0.6) }
          50% { box-shadow: 0 0 0 10px hsl(var(--primary) / 0), 0 12px 36px -6px hsl(var(--primary) / 0.75) }
        }
        @keyframes card-in {
          0% { opacity: 0; transform: translateY(14px) scale(0.96) rotate(-1deg) }
          100% { opacity: 1; transform: translateY(0) scale(1) rotate(0) }
        }
      `}</style>

      {/* Background ambient layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-primary/30 blur-3xl"
          style={{ animation: 'blob 9s ease-in-out infinite' }}
        />
        <div
          className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-accent/25 blur-3xl"
          style={{ animation: 'blob 11s ease-in-out infinite reverse' }}
        />
        <img
          src={startBg}
          alt=""
          aria-hidden
          className="absolute right-[-30px] top-[40px] w-[230px] opacity-25 mix-blend-screen pointer-events-none select-none"
          style={{ animation: 'drift 14s ease-in-out infinite', filter: 'saturate(1.2) contrast(1.05)' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,hsl(var(--background))_75%)]" />
      </div>

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between">
        <button
          onClick={() => setLangOpen(true)}
          aria-label="Change language"
          className="bg-card/70 backdrop-blur border border-white/10 text-foreground rounded-full px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-sm">{LANGUAGES.find(l => l.code === lang)?.flag}</span>
        </button>
        {user ? (
          <button
            onClick={() => signOut()}
            aria-label="Sign out"
            className="bg-card/70 backdrop-blur border border-white/10 text-foreground rounded-full p-2 active:scale-95 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            aria-label="Sign in"
            className="bg-card/70 backdrop-blur border border-white/10 text-foreground rounded-full px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="text-xs font-display font-semibold">{t.loginLabel}</span>
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center mt-3 animate-fade-in">
        {/* Social proof */}
        <div className="inline-flex items-center gap-1.5 bg-card/70 border border-primary/30 rounded-full px-3 py-1 backdrop-blur shadow-soft">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          <Flame className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-display font-semibold tracking-wide text-foreground/90">
            {t.trending}
          </span>
        </div>

        {/* Headline */}
        <h1 className="mt-4 text-center font-display font-bold text-foreground leading-[1.05] text-[32px] whitespace-pre-line">
          {t.headlinePrefix}
          <br />
          <span className="bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            {t.headlineSuffix}
          </span>
        </h1>
        <p className="mt-2 text-center text-[13px] text-muted-foreground max-w-[300px] leading-snug">
          {t.subtitle}
        </p>

        {/* Animated preview card */}
        <div className="relative mt-5 w-full h-[168px] flex items-center justify-center">
          {/* Back stack */}
          <div className="absolute top-1 w-[78%] h-[140px] rounded-2xl bg-card/60 border border-white/10 -rotate-6 translate-x-[-22px] opacity-50" />
          <div className="absolute top-1 w-[78%] h-[140px] rounded-2xl bg-card/60 border border-white/10 rotate-[5deg] translate-x-[22px] opacity-50" />

          {/* Front card */}
          <div
            key={current}
            className="relative w-[88%] rounded-2xl bg-gradient-to-br from-card to-card/80 border border-white/15 shadow-soft p-4 backdrop-blur"
            style={{ animation: 'card-in 420ms cubic-bezier(.2,.8,.2,1)' }}
          >
            {current === 'vote' && (
              <>
                <div className="text-[10px] font-display font-bold tracking-[0.18em] text-primary uppercase">
                  {t.voteLabel}
                </div>
                <div className="mt-1 font-display font-bold text-foreground text-[15px] leading-tight">
                  {t.voteQuestion}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-display font-semibold text-foreground/90">
                    <span>Emna</span>
                    <span className="text-primary">{voteFill}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-[1800ms] ease-out"
                      style={{ width: `${voteFill}%` }}
                    />
                  </div>
                </div>
              </>
            )}

            {current === 'dare' && (
              <>
                <div className="text-[10px] font-display font-bold tracking-[0.18em] text-accent uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3" /> {t.challengeUnlocked}
                </div>
                <div className="mt-2 font-display font-bold text-foreground text-[17px] leading-tight">
                  {t.challengeTitle}
                </div>
                <div className="mt-3 flex gap-2">
                  <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-2 text-center text-[11px] font-display font-semibold">
                    {t.sing}
                  </div>
                  <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-2 text-center text-[11px] font-display font-semibold">
                    {t.call}
                  </div>
                  <div className="flex-1 rounded-lg bg-primary/15 border border-primary/40 p-2 text-center text-[11px] font-display font-semibold text-primary">
                    {t.confess}
                  </div>
                </div>
              </>
            )}

            {current === 'minigame' && (
              <>
                <div className="text-[10px] font-display font-bold tracking-[0.18em] text-primary uppercase flex items-center gap-1">
                  <Wand2 className="w-3 h-3" /> {t.minigameUnlocked}
                </div>
                <div className="mt-2 font-display font-bold text-foreground text-[17px] leading-tight">
                  {t.minigameTitle}
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {['😈','👀','🤫','🥂','💋'].map((e, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-base"
                      style={{ animation: `float-chip 2s ease-in-out infinite ${i * 0.15}s` }}
                    >
                      {e}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Progress dots */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5">
            {previews.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${i === previewIdx ? 'w-5 bg-primary' : 'w-1.5 bg-white/20'}`}
              />
            ))}
          </div>
        </div>

        {/* Value pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-1.5 max-w-[320px]">
          {[
            { icon: <Users className="w-3 h-3" />, label: t.pillPlayers },
            { icon: null, label: t.pillNoSignup },
            { icon: null, label: t.pillStartFast },
            { icon: null, label: t.pillAi },
          ].map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 bg-card/60 border border-white/10 rounded-full px-2.5 py-1 text-[11px] font-display font-semibold text-foreground/85"
            >
              {p.icon}
              {p.label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="relative mt-5 w-full max-w-[320px]">
          <button
            onClick={handleStart}
            className="relative w-full bg-gradient-to-r from-primary to-[hsl(339_100%_65%)] text-primary-foreground font-display font-bold text-base px-8 py-3.5 rounded-xl active:scale-[0.98] transition-transform"
            style={{ animation: 'glow-pulse 2.4s ease-in-out infinite' }}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t.ctaStart}
            </span>
          </button>

          {/* Confetti */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {confetti.map((c) => (
              <span
                key={c.id}
                className="absolute block w-1.5 h-2 rounded-sm"
                style={{
                  backgroundColor: `hsl(${c.hue} 100% 60%)`,
                  ['--tx' as string]: `${c.tx}px`,
                  ['--ty' as string]: `${c.ty}px`,
                  animation: 'confetti-pop 800ms cubic-bezier(.2,.7,.3,1) forwards',
                }}
              />
            ))}
          </div>

          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            {t.ctaSub}
          </p>

          {onLuck && (
            <button
              onClick={onLuck}
              className="mt-2.5 group relative overflow-hidden bg-card/70 backdrop-blur border border-white/10 text-foreground font-display font-semibold text-sm px-8 py-3 rounded-xl active:scale-[0.98] transition-all w-full hover:border-accent/40 flex items-center justify-center gap-2"
            >
              <Dice5 className="w-4 h-4 text-accent" />
              {t.ctaLuck}
            </button>
          )}
        </div>

        {/* Bottom microcopy */}
        <p className="mt-4 text-center text-[11px] italic text-muted-foreground">
          "{t.tagline}"
        </p>
      </div>

      {/* Language picker modal */}
      {langOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in"
          onClick={() => setLangOpen(false)}
        >
          <div
            className="w-full max-w-[400px] bg-card border border-white/10 rounded-2xl p-5 shadow-soft"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">{t.langLabel}</h2>
              <button
                onClick={() => setLangOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/5 text-muted-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => {
                const active = lang === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      onLanguageChange?.(l.code);
                      setLangOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all duration-150 active:scale-[0.98] ${
                      active
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-white/10 bg-background text-foreground hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl">{l.flag}</span>
                    <span className="font-display font-semibold text-xs">{l.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartScreen;
