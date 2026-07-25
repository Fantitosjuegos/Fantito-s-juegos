import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

const CONSENT_KEY = 'fantito:ai_consent_v1';

const LANGS: Record<string, {
  title: string; body: string; providers: string; confirm: string; privacy: string;
}> = {
  en: { title: 'How Fantito works', body: 'Fantito uses AI to generate personalized game cards. The player names you enter are sent to our AI providers to create your game.', providers: 'AI providers: Google Gemini · OpenAI', confirm: 'Got it, let\'s play!', privacy: 'See Privacy Policy' },
  es: { title: 'Cómo funciona Fantito', body: 'Fantito usa IA para generar cartas personalizadas. Los nombres de jugadores que introduces se envían a nuestros proveedores de IA para crear tu juego.', providers: 'Proveedores de IA: Google Gemini · OpenAI', confirm: '¡Entendido, vamos!', privacy: 'Ver política de privacidad' },
  fr: { title: 'Comment Fantito fonctionne', body: 'Fantito utilise l\'IA pour générer des cartes personnalisées. Les prénoms des joueurs sont envoyés à nos fournisseurs d\'IA pour créer ton jeu.', providers: 'Fournisseurs IA : Google Gemini · OpenAI', confirm: 'Compris, on joue !', privacy: 'Voir la politique de confidentialité' },
  de: { title: 'Wie Fantito funktioniert', body: 'Fantito nutzt KI, um personalisierte Spielkarten zu erstellen. Die Spielernamen werden an unsere KI-Anbieter gesendet.', providers: 'KI-Anbieter: Google Gemini · OpenAI', confirm: 'Verstanden, los geht\'s!', privacy: 'Datenschutzrichtlinie' },
  pt: { title: 'Como o Fantito funciona', body: 'O Fantito usa IA para gerar cartas personalizadas. Os nomes dos jogadores são enviados aos nossos fornecedores de IA para criar o jogo.', providers: 'Fornecedores de IA: Google Gemini · OpenAI', confirm: 'Entendido, vamos jogar!', privacy: 'Ver política de privacidade' },
  it: { title: 'Come funziona Fantito', body: 'Fantito usa l\'IA per generare carte personalizzate. I nomi dei giocatori vengono inviati ai nostri fornitori di IA per creare il gioco.', providers: 'Fornitori IA: Google Gemini · OpenAI', confirm: 'Capito, giochiamo!', privacy: 'Vedi informativa sulla privacy' },
  ar: { title: 'كيف يعمل فانتيتو', body: 'يستخدم فانتيتو الذكاء الاصطناعي لإنشاء بطاقات لعبة مخصصة. يتم إرسال أسماء اللاعبين التي تدخلها إلى مزودي الذكاء الاصطناعي لدينا.', providers: 'مزودو الذكاء الاصطناعي: Google Gemini · OpenAI', confirm: 'فهمت، لنلعب!', privacy: 'سياسة الخصوصية' },
};

interface Props {
  lang?: string;
  onPrivacy?: () => void;
}

export const useAIConsent = () => {
  const [needed, setNeeded] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    storage.get(CONSENT_KEY).then(val => {
      setNeeded(!val);
      setChecked(true);
    });
  }, []);

  const accept = async () => {
    await storage.set(CONSENT_KEY, '1');
    setNeeded(false);
  };

  return { needed, checked, accept };
};

const AIConsentModal = ({ lang = 'en', onPrivacy }: Props) => {
  const t = LANGS[lang] ?? LANGS.en;
  const { needed, checked, accept } = useAIConsent();

  if (!checked || !needed) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
      <div className="w-full max-w-[400px] bg-card border border-white/[0.12] rounded-3xl p-6 shadow-2xl"
        style={{ animation: 'consent-pop 0.3s cubic-bezier(.2,1.2,.4,1)' }}>
        <style>{`
          @keyframes consent-pop {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-3xl mx-auto mb-4">
          🤖
        </div>

        <h2 className="font-display font-black text-xl text-foreground text-center mb-3">
          {t.title}
        </h2>

        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-3">
          {t.body}
        </p>

        <div className="bg-background/60 border border-white/[0.08] rounded-xl px-4 py-2.5 mb-5 text-center">
          <p className="text-[11px] font-display font-semibold text-muted-foreground">
            {t.providers}
          </p>
        </div>

        <button onClick={accept}
          className="w-full bg-primary text-primary-foreground font-display font-bold py-3.5 rounded-2xl active:scale-[0.98] transition-transform mb-3">
          {t.confirm}
        </button>

        {onPrivacy && (
          <button onClick={onPrivacy}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1">
            {t.privacy}
          </button>
        )}
      </div>
    </div>
  );
};

export default AIConsentModal;