import { Language } from '@/lib/onboarding-types';
import { isRTL } from '@/lib/translations';
import mascot from '@/assets/mascot.png';

interface SwipeTutorialScreenProps {
  lang: Language;
  onGotIt: () => void;
}

const LABELS: Record<Language, { title: string; right: string; rightDesc: string; left: string; leftDesc: string; star: string; starDesc: string; gotIt: string }> = {
  en: { title: 'How to play', right: 'Swipe Right →', rightDesc: 'Done! Great question — the algorithm will suggest more like it.', left: '← Swipe Left', leftDesc: 'Skip — not your vibe. The AI learns to avoid similar ones.', star: '⭐ Star', starDesc: 'Perfect question! Strongest signal — more of exactly this.', gotIt: 'Got it! Let\'s go 🤠' },
  es: { title: 'Cómo jugar', right: 'Desliza derecha →', rightDesc: '¡Hecho! Buena pregunta — el algoritmo sugerirá más así.', left: '← Desliza izquierda', leftDesc: 'Saltar — no es tu onda. La IA aprende a evitar similares.', star: '⭐ Estrella', starDesc: '¡Pregunta perfecta! Señal más fuerte — más exactamente así.', gotIt: '¡Entendido! Vamos 🤠' },
  de: { title: 'So geht\'s', right: 'Nach rechts wischen →', rightDesc: 'Fertig! Tolle Frage — der Algorithmus schlägt mehr davon vor.', left: '← Nach links wischen', leftDesc: 'Weiter — nicht dein Ding. Die KI lernt, ähnliche zu vermeiden.', star: '⭐ Stern', starDesc: 'Perfekte Frage! Stärkstes Signal — mehr genau davon.', gotIt: 'Verstanden! Los geht\'s 🤠' },
  fr: { title: 'Comment jouer', right: 'Glissez à droite →', rightDesc: 'Fait ! Bonne question — l\'algorithme en proposera plus.', left: '← Glissez à gauche', leftDesc: 'Passer — pas ton truc. L\'IA apprend à éviter ce type.', star: '⭐ Étoile', starDesc: 'Question parfaite ! Signal le plus fort — encore plus comme ça.', gotIt: 'Compris ! C\'est parti 🤠' },
  pt: { title: 'Como jogar', right: 'Deslize para a direita →', rightDesc: 'Feito! Boa pergunta — o algoritmo vai sugerir mais assim.', left: '← Deslize para a esquerda', leftDesc: 'Pular — não é a tua vibe. A IA aprende a evitar similares.', star: '⭐ Estrela', starDesc: 'Pergunta perfeita! Sinal mais forte — mais exatamente assim.', gotIt: 'Entendi! Bora 🤠' },
  it: { title: 'Come giocare', right: 'Scorri a destra →', rightDesc: 'Fatto! Bella domanda — l\'algoritmo ne suggerirà di simili.', left: '← Scorri a sinistra', leftDesc: 'Salta — non fa per te. L\'IA impara a evitare simili.', star: '⭐ Stella', starDesc: 'Domanda perfetta! Segnale più forte — più esattamente così.', gotIt: 'Capito! Andiamo 🤠' },
  ar: { title: 'كيف تلعب', right: '← اسحب يميناً', rightDesc: 'تم! سؤال رائع — الخوارزمية ستقترح المزيد.', left: 'اسحب يساراً →', leftDesc: 'تخطي — ليس أسلوبك. الذكاء الاصطناعي يتعلم تجنب المماثل.', star: '⭐ نجمة', starDesc: 'سؤال مثالي! أقوى إشارة — المزيد بالضبط هكذا.', gotIt: 'فهمت! يلا 🤠' },
};

const SwipeTutorialScreen = ({ lang, onGotIt }: SwipeTutorialScreenProps) => {
  const rtl = isRTL(lang);
  const l = LABELS[lang] || LABELS.en;

  return (
    <div className={`min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col items-center justify-center px-6 gap-6 py-8 ${rtl ? 'direction-rtl' : ''}`}>
      <img src={mascot} alt="Fantito" className="w-20 h-20 object-cover rounded-xl border border-white/[0.08]" loading="lazy" width={512} height={512} />
      <h1 className="font-display text-2xl font-bold text-foreground">{l.title}</h1>

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
        className="w-full bg-primary text-primary-foreground font-display font-semibold text-base py-3.5 rounded-lg active:scale-[0.98] transition-all mt-2"
      >
        {l.gotIt}
      </button>
    </div>
  );
};

export default SwipeTutorialScreen;
