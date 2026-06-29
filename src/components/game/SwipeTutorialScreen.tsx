import { Language } from '@/lib/onboarding-types';
import { isRTL } from '@/lib/translations';
import fantitoLoader from '@/assets/fantito-loader.svg';

interface SwipeTutorialScreenProps {
  lang: Language;
  onGotIt: () => void;
}

const LABELS: Record<Language, {
  title: string;
  right: string; rightDesc: string;
  left: string;  leftDesc: string;
  star: string;  starDesc: string;
  gotIt: string;
}> = {
  en: {
    title: 'Help Fantito to be sharper\u00a0',
    right: 'Swipe Right →',
    rightDesc: 'Approve, good or normal question, you would like more like it',
    left: 'Swipe Left\u00a0←\u00a0',
    leftDesc: 'Skip, weird or awkward question, you would like less like it',
    star: 'Star',
    starDesc: 'Wonderful question, straight to the point, more and more questions like it',
    gotIt: 'Got it !',
  },
  es: {
    title: 'Ayuda a Fantito a ser más preciso',
    right: 'Desliza derecha →',
    rightDesc: '¡Hecho! Buena pregunta — el algoritmo sugerirá más así.',
    left: '← Desliza izquierda',
    leftDesc: 'Saltar — no es tu onda. La IA aprende a evitar similares.',
    star: '⭐ Estrella',
    starDesc: '¡Pregunta perfecta! Señal más fuerte — más exactamente así.',
    gotIt: '¡Entendido! Vamos 🤠',
  },
  fr: {
    title: 'Aide Fantito à s\'améliorer',
    right: 'Glissez à droite →',
    rightDesc: 'Fait ! Bonne question — l\'algorithme en proposera plus.',
    left: '← Glissez à gauche',
    leftDesc: 'Passer — pas ton truc. L\'IA apprend à éviter ce type.',
    star: '⭐ Étoile',
    starDesc: 'Question parfaite ! Signal le plus fort — encore plus comme ça.',
    gotIt: 'Compris ! C\'est parti 🤠',
  },
  de: {
    title: 'Hilf Fantito, besser zu werden',
    right: 'Nach rechts wischen →',
    rightDesc: 'Fertig! Tolle Frage — der Algorithmus schlägt mehr davon vor.',
    left: '← Nach links wischen',
    leftDesc: 'Weiter — nicht dein Ding. Die KI lernt, ähnliche zu vermeiden.',
    star: '⭐ Stern',
    starDesc: 'Perfekte Frage! Stärkstes Signal — mehr genau davon.',
    gotIt: 'Verstanden! Los geht\'s 🤠',
  },
  pt: {
    title: 'Ajuda o Fantito a melhorar',
    right: 'Deslize para a direita →',
    rightDesc: 'Feito! Boa pergunta — o algoritmo vai sugerir mais assim.',
    left: '← Deslize para a esquerda',
    leftDesc: 'Pular — não é a tua vibe. A IA aprende a evitar similares.',
    star: '⭐ Estrela',
    starDesc: 'Pergunta perfeita! Sinal mais forte — mais exatamente assim.',
    gotIt: 'Entendi! Bora 🤠',
  },
  it: {
    title: 'Aiuta Fantito a migliorare',
    right: 'Scorri a destra →',
    rightDesc: 'Fatto! Bella domanda — l\'algoritmo ne suggerirà di simili.',
    left: '← Scorri a sinistra',
    leftDesc: 'Salta — non fa per te. L\'IA impara a evitare simili.',
    star: '⭐ Stella',
    starDesc: 'Domanda perfetta! Segnale più forte — più esattamente così.',
    gotIt: 'Capito! Andiamo 🤠',
  },
  ar: {
    title: 'ساعد Fantito على التحسن',
    right: '← اسحب يميناً',
    rightDesc: 'تم! سؤال رائع — الخوارزمية ستقترح المزيد.',
    left: 'اسحب يساراً →',
    leftDesc: 'تخطي — ليس أسلوبك. الذكاء الاصطناعي يتعلم تجنب المماثل.',
    star: '⭐ نجمة',
    starDesc: 'سؤال مثالي! أقوى إشارة — المزيد بالضبط هكذا.',
    gotIt: 'فهمت! يلا 🤠',
  },
};

const SwipeTutorialScreen = ({ lang, onGotIt }: SwipeTutorialScreenProps) => {
  const rtl = isRTL(lang);
  const l = LABELS[lang] || LABELS.en;

  return (
    <div className={`min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col items-center justify-center px-6 gap-6 py-8 ${rtl ? 'direction-rtl' : ''}`}>
      <img src={fantitoLoader} alt="Fantito" className="w-24 h-24 object-contain" loading="lazy" />
      <h1 className="font-display text-2xl font-bold text-foreground text-center">{l.title}</h1>

      <div className="w-full space-y-3">
        {/* Right = Done */}
        <div className="relative flex items-start gap-3 bg-card border border-white/[0.08] rounded-xl p-4 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
          <span className="text-2xl">👉</span>
          <div>
            <p className="font-display font-semibold text-sm text-foreground">{l.right}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{l.rightDesc}</p>
          </div>
        </div>

        {/* Left = Skip */}
        <div className="relative flex items-start gap-3 bg-card border border-white/[0.08] rounded-xl p-4 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted-foreground/40" />
          <span className="text-2xl">👈</span>
          <div>
            <p className="font-display font-semibold text-sm text-foreground">{l.left}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{l.leftDesc}</p>
          </div>
        </div>

        {/* Star = Perfect */}
        <div className="relative flex items-start gap-3 bg-card border border-white/[0.08] rounded-xl p-4 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-display font-semibold text-sm text-foreground">{l.star}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{l.starDesc}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onGotIt}
        className="w-full bg-primary text-primary-foreground font-display font-bold text-lg py-4 rounded-full active:scale-[0.98] transition-transform"
      >
        {l.gotIt}
      </button>
    </div>
  );
};

export default SwipeTutorialScreen;