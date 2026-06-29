import { useEffect, useState, memo } from 'react';
import { cssVars } from '@/lib/css-utils';
import { Language, OnboardingState } from '@/lib/onboarding-types';
import { isRTL } from '@/lib/translations';
import fantitoLoader from '@/assets/fantito-loader.svg';

interface GeneratingScreenProps {
  lang: Language;
  state: OnboardingState;
}

const GeneratingScreen = ({ lang, state }: GeneratingScreenProps) => {
  const rtl = isRTL(lang);
  const [progress, setProgress] = useState(0);

  // Progress ticker — eases as it climbs
  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress(p => {
        if (p >= 99) return 99;
        const remaining = 99 - p;
        const step = Math.max(0.6, remaining * 0.04 + Math.random() * 1.2);
        return Math.min(99, p + step);
      });
    }, 110);
    return () => window.clearInterval(id);
  }, []);

  const intensity = Math.min(1, progress / 100);

  return (
    <div className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background overflow-hidden">
      {/* Ambient atmosphere */}
      <div
        className="vs-atmosphere"
        style={cssVars({ '--vs-intensity': intensity.toFixed(2) })}
      />

      {/* Floating particle dots */}
      <div className="pointer-events-none absolute inset-0">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/60 vs-particle"
            style={{
              left: `${(i * 37) % 100}%`,
              top:  `${60 + ((i * 17) % 40)}%`,
              ...cssVars({
                '--dx': `${((i % 5) - 2) * 14}px`,
                '--dy': `-${120 + (i % 4) * 30}px`,
              }),
              animationDelay: `${(i % 7) * 0.3}s`,
              animationDuration: `${1.6 + (i % 3) * 0.4}s`,
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

      <div className={`relative flex flex-col items-center justify-center min-h-[100dvh] px-6 py-8 gap-10 ${rtl ? 'direction-rtl' : ''}`}>

        {/* Bobbing Fantito loader */}
        <img
          src={fantitoLoader}
          alt=""
          aria-hidden="true"
          className="w-56 h-56 object-contain gs-bob select-none pointer-events-none"
          draggable={false}
        />

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-end mb-1.5">
            <span className="font-display font-black text-sm text-primary tabular-nums">
              {Math.floor(progress)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))',
                boxShadow: '0 0 14px hsl(var(--primary) / 0.6)',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gs-bob {
          0%, 100% { transform: translateY(-6px); }
          50%       { transform: translateY(6px); }
        }
        .gs-bob { animation: gs-bob 2.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default memo(GeneratingScreen);