import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface OnboardingLayoutProps {
  step: number;
  children: ReactNode;
  onBack?: () => void;
  showProgress?: boolean;
}

const OnboardingLayout = ({ step, children, onBack, showProgress = true }: OnboardingLayoutProps) => {
  return (
    <div className="min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col relative">
      <div className="h-[env(safe-area-inset-top,0px)]" />

      {showProgress && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-1 rounded-full hover:bg-white/5 transition-colors text-muted-foreground active:scale-90"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <ProgressBar step={step} />
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col px-5 pb-6 overflow-y-auto">
        {children}
      </div>
      <div className="h-[env(safe-area-inset-bottom,0px)]" />
    </div>
  );
};

export default OnboardingLayout;
