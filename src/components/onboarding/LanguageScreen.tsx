import { Language, LANGUAGES } from '@/lib/onboarding-types';
import { t, isRTL } from '@/lib/translations';
import OnboardingLayout from './OnboardingLayout';
import MascotBubble from './MascotBubble';

interface LanguageScreenProps {
  step: number;
  selected: Language;
  lang: Language;
  onSelect: (lang: Language) => void;
  onNext: () => void;
  onBack: () => void;
}

const LanguageScreen = ({ step, selected, lang, onSelect, onNext, onBack }: LanguageScreenProps) => {
  return (
    <OnboardingLayout step={step} onBack={onBack}>
      <div className={`flex-1 flex flex-col gap-4 pt-3 ${isRTL(lang) ? 'direction-rtl' : ''}`}>
        <MascotBubble message="🌍" size="sm" />

        <h2 className="font-display text-xl font-bold text-foreground">
          {t(lang, 'chooseLanguage')}
        </h2>

        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => {
            const active = selected === l.code;
            return (
              <button
                key={l.code}
                onClick={() => onSelect(l.code)}
                className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all duration-150 active:scale-[0.98] ${
                  active
                    ? 'border-primary bg-primary/8 text-foreground'
                    : 'border-white/[0.08] bg-card text-foreground hover:border-white/20'
                }`}
              >
                <span className="text-xl">{l.flag}</span>
                <span className="font-display font-semibold text-xs">{l.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-2">
          <button
            onClick={onNext}
            className="w-full bg-primary text-primary-foreground font-display font-semibold text-base py-3.5 rounded-lg active:scale-[0.98] transition-all"
          >
            {t(lang, 'continue_')}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default LanguageScreen;
