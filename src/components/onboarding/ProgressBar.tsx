import { TOTAL_STEPS } from '@/lib/onboarding-types';

interface ProgressBarProps {
  step: number;
}

const ProgressBar = ({ step }: ProgressBarProps) => {
  const progress = ((step) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="w-full py-2">
      <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
