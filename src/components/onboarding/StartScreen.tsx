import { useState, useEffect, useRef } from 'react';
import { Globe, LogIn, LogOut, X, Dice5, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Language, LANGUAGES } from '@/lib/onboarding-types';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import startBg from '@/assets/start-bg.png';


interface StartScreenProps {
  lang: Language;
  onStart: () => void;
  onLuck?: () => void;
  onLanguageChange?: (lang: Language) => void;
}

const START_I18N: Record<string, {
  headline1: string; headline2: string;
  subtitle: string;
  teasers: string[];
  cta: string;
  reassurance: string;
  luck: string;
  intro: string;
  loginLabel: string;
}> = {
  en: {
    headline1: 'Pass the phone.',
    headline2: 'Fantito reads the room.',
    subtitle: 'Questions, votes, dares and mini-games made for your exact group.',
    teasers: [
      "Who's most likely to text their ex tonight?",
      'Who here is hiding a crush?',
      'Which two people should never date?',
    ],
    cta: 'Start in 10 seconds',
    reassurance: '2–10 players • personalised party card games',
    luck: 'Feeling lucky? Try Luck Mode',
    intro: 'Fantito is reading the room…',
    loginLabel: 'Login',
  },
  es: {
    headline1: 'Pasa el móvil.',
    headline2: 'Fantito lee el ambiente.',
    subtitle: 'Preguntas, votos, retos y mini-juegos hechos para tu grupo exacto.',
    teasers: [
      '¿Quién es más probable que escriba a su ex hoy?',
      '¿Quién aquí esconde un crush?',
      '¿Qué dos personas no deberían salir nunca?',
    ],
    cta: 'Empezar en 10 segundos',
    reassurance: '2–10 jugadores • juegos de cartas personalizados',
    luck: '¿Con suerte? Prueba el Modo Suerte',
    intro: 'Fantito está leyendo el ambiente…',
    loginLabel: 'Entrar',
  },
  fr: {
    headline1: 'Passe le téléphone.',
    headline2: 'Fantito lit l’ambiance.',
    subtitle: 'Questions, votes, défis et mini-jeux faits pour ton groupe exact.',
    teasers: [
      'Qui va texter son ex ce soir ?',
      'Qui ici cache un crush ?',
      'Quelles deux personnes ne devraient jamais sortir ensemble ?',
    ],
    cta: 'Commencer en 10 secondes',
    reassurance: '2–10 joueurs • jeux de cartes personnalisés',
    luck: 'Tu te sens chanceux ? Mode Chance',
    intro: 'Fantito lit l’ambiance…',
    loginLabel: 'Connexion',
  },
  de: {
    headline1: 'Reich das Handy weiter.',
    headline2: 'Fantito liest die Runde.',
    subtitle: 'Fragen, Votes, Dares und Mini-Games — gemacht für deine Crew.',
    teasers: [
      'Wer schreibt heute Nacht seinem Ex?',
      'Wer hier verheimlicht einen Crush?',
      'Welche zwei sollten nie zusammen sein?',
    ],
    cta: 'In 10 Sekunden starten',
    reassurance: '2–10 Spieler • personalisierte Partyspiel-Karten',
    luck: 'Glück gefragt? Glücksmodus',
    intro: 'Fantito liest die Runde…',
    loginLabel: 'Anmelden',
  },
  pt: {
    headline1: 'Passa o telemóvel.',
    headline2: 'O Fantito lê a sala.',
    subtitle: 'Perguntas, votos, desafios e mini-jogos feitos para o teu grupo.',
    teasers: [
      'Quem vai mandar SMS ao ex hoje?',
      'Quem aqui esconde um crush?',
      'Que duas pessoas nunca deveriam namorar?',
    ],
    cta: 'Começar em 10 segundos',
    reassurance: '2–10 jogadores • jogos de cartas personalizados',
    luck: 'Com sorte? Modo Sorte',
    intro: 'O Fantito está a ler a sala…',
    loginLabel: 'Entrar',
  },
  it: {
    headline1: 'Passa il telefono.',
    headline2: 'Fantito legge la stanza.',
    subtitle: 'Domande, voti, sfide e mini-giochi fatti per il tuo gruppo.',
    teasers: [
      'Chi scriverà all’ex stasera?',
      'Chi qui nasconde una cotta?',
      'Quali due persone non dovrebbero mai stare insieme?',
    ],
    cta: 'Inizia in 10 secondi',
    reassurance: '2–10 giocatori • giochi di carte personalizzati',
    luck: 'Ti senti fortunato? Modalità Fortuna',
    intro: 'Fantito sta leggendo la stanza…',
    loginLabel: 'Accedi',
  },
  ar: {
    headline1: 'مرّر الهاتف.',
    headline2: 'Fantito يقرأ المجموعة.',
    subtitle: 'أسئلة، تصويتات، تحديات وألعاب مصغّرة مصنوعة لمجموعتك بالضبط.',
    teasers: [
      'من الأرجح أن يراسل حبيبه السابق الليلة؟',
      'من هنا يخفي إعجاباً سرّياً؟',
      'أي شخصين لا يجب أن يتواعدا أبداً؟',
    ],
    cta: 'ابدأ خلال 10 ثوانٍ',
    reassurance: '2–10 لاعبين • ألعاب أوراق مخصّصة للحفلات',
    luck: 'تشعر بالحظ؟ جرّب وضع الحظ',
    intro: 'Fantito يقرأ المجموعة…',
    loginLabel: 'تسجيل الدخول',
  },
};

const StartScreen = ({ lang, onStart, onLuck, onLanguageChange }: StartScreenProps) => {
  const t = START_I18N[lang] ?? START_I18N.en;
  const [langOpen, setLangOpen] = useState(false);
  const [intro, setIntro] = useState(true);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { cardsRemaining } = useEntitlements();
  const introTimer = useRef<number | null>(null);


  useEffect(() => {
    // Short opening animation: ~1.4s
    introTimer.current = window.setTimeout(() => setIntro(false), 1400);
    return () => {
      if (introTimer.current) window.clearTimeout(introTimer.current);
    };
  }, []);

  const handleStart = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { (navigator as Navigator).vibrate?.(10); } catch { /* noop */ }
    }
    setStarting(true);
    setTimeout(() => onStart(), 650);
  };

  return (
    <div className="min-h-[100dvh] max-w-[430px] mx-auto bg-background relative overflow-hidden flex flex-col px-5 pt-4 pb-6">
      <style>{`
        @keyframes ss-fade-up { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes ss-whisper { 0% { opacity: 0; transform: translateY(8px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes ss-cta-pulse {
          0%, 100% { box-shadow: 0 0 0 0 hsl(var(--primary) / 0.35), 0 8px 24px -10px hsl(var(--primary) / 0.5); }
          50% { box-shadow: 0 0 0 6px hsl(var(--primary) / 0); 0 10px 28px -8px hsl(var(--primary) / 0.6); }
        }
        @keyframes ss-eye-glow {
          0%, 100% { opacity: 0.35; filter: blur(0.5px); }
          50% { opacity: 0.65; filter: blur(0px); }
        }
        @keyframes ss-particle {
          0% { opacity: 0; transform: translate(0,0) scale(0.4); }
          25% { opacity: 0.7; }
          100% { opacity: 0; transform: translate(var(--px,0), var(--py,-60px)) scale(1); }
        }
        @keyframes ss-intro-fade { 0% { opacity: 1 } 80% { opacity: 1 } 100% { opacity: 0 } }
        @keyframes ss-dice-roll {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
        }
        @keyframes ss-destiny-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes ss-dice-wobble {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-12deg); }
          75% { transform: rotate(12deg); }
        }
        @keyframes ss-destiny-shimmer {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Background photo of Fantito */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={startBg}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.22]"
          style={{ filter: 'saturate(0.85) contrast(1.02)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background/90" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]" />
      </div>

      {/* Intro overlay */}
      {intro && (
        <div
          className="absolute inset-0 z-50 bg-background flex flex-col items-center justify-center"
          style={{ animation: 'ss-intro-fade 1.4s ease-out forwards' }}
        >
          <div className="relative w-16 h-16 mb-4">
            <div
              className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
              style={{ animation: 'ss-eye-glow 1.2s ease-in-out infinite' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" style={{ boxShadow: '0 0 16px 4px hsl(var(--primary)/0.7)' }} />
              <div className="w-2 h-2 rounded-full bg-primary ml-4" style={{ boxShadow: '0 0 16px 4px hsl(var(--primary)/0.7)' }} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-display tracking-wide">{t.intro}</p>
        </div>
      )}

      {/* Top bar — discreet */}
      <div className="relative z-20 flex items-center justify-between opacity-90">
        <button
          onClick={() => setLangOpen(true)}
          aria-label="Change language"
          className="text-muted-foreground hover:text-foreground rounded-full p-1.5 active:scale-95 transition-all flex items-center gap-1"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="text-xs">{LANGUAGES.find(l => l.code === lang)?.flag}</span>
        </button>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-display font-semibold text-primary"
            title="Cards remaining"
          >
            <Sparkles className="w-3 h-3" />
            {cardsRemaining}
          </span>
          {user ? (
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              className="text-muted-foreground hover:text-foreground rounded-full p-1.5 active:scale-95 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              aria-label="Sign in"
              className="text-muted-foreground hover:text-foreground rounded-full p-1.5 active:scale-95 transition-all flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="text-xs">{t.loginLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main content — two big choices, anchored lower */}
      <div className="relative z-10 flex-1 flex flex-col justify-end items-stretch gap-4 max-w-[360px] w-full mx-auto pb-12">
        <div
          className="flex items-center justify-center gap-2 text-[11px] font-display font-semibold tracking-wide text-muted-foreground mb-1"
          style={{ animation: 'ss-fade-up 0.6s ease-out both' }}
        >
          <span className="rounded-full bg-card/70 border border-white/10 px-2.5 py-1">2–10 players</span>
          <span className="rounded-full bg-card/70 border border-white/10 px-2.5 py-1">personalised party card games</span>
        </div>
        <button
          onClick={handleStart}
          disabled={starting}
          className="relative w-full bg-primary text-primary-foreground rounded-full py-10 font-display font-bold text-3xl active:scale-[0.98] transition-transform disabled:opacity-80"
          style={{ animation: 'ss-cta-pulse 2.6s ease-in-out infinite, ss-fade-up 0.6s ease-out 0.1s both' }}
        >
          Yalla !
        </button>

        {onLuck && (
          <button
            onClick={onLuck}
            className="relative w-[85%] mx-auto bg-card border-2 border-primary/30 text-foreground rounded-full py-7 font-display font-bold text-2xl active:scale-[0.98] transition-transform inline-flex items-center justify-center gap-3 group overflow-hidden"
            style={{ animation: 'ss-fade-up 0.6s ease-out 0.25s both, ss-destiny-float 3.2s ease-in-out infinite 1s' }}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -translate-x-full"
              style={{
                background: 'linear-gradient(110deg, transparent 30%, hsl(var(--primary) / 0.18) 50%, transparent 70%)',
                animation: 'ss-destiny-shimmer 3.8s ease-in-out infinite 1.4s',
              }}
            />
            <Dice5 className="w-6 h-6 text-primary" style={{ animation: 'ss-dice-wobble 3.2s ease-in-out infinite 1s' }} />
            Destiny
          </button>
        )}
      </div>


      {/* Language sheet */}
      {langOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end" onClick={() => setLangOpen(false)}>
          <div
            className="w-full max-w-[430px] mx-auto bg-card border-t border-white/10 rounded-t-3xl p-5 pb-8 animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-bold text-foreground">{LANGUAGES.find(l => l.code === lang)?.flag} {lang.toUpperCase()}</span>
              <button onClick={() => setLangOpen(false)} className="p-1 rounded-full hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { onLanguageChange?.(l.code as Language); setLangOpen(false); }}
                  className={`rounded-xl border px-3 py-2.5 text-left flex items-center gap-2 transition-all ${l.code === lang ? 'border-primary bg-primary/10' : 'border-white/10 bg-card/60 hover:border-white/20'}`}
                >
                  <span className="text-lg">{l.flag}</span>
                  <span className="text-sm font-display font-semibold">{l.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartScreen;