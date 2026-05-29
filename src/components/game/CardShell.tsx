import { ReactNode, useRef, useState, useCallback } from 'react';
import { Star } from 'lucide-react';
import { Mood } from '@/lib/card-mood';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface CardShellProps {
  mood: Mood;
  /** Disable swipe (vote/quiz cards manage their own completion) */
  disableSwipe?: boolean;
  /** Hide star button (e.g. for mini-games) */
  hideStar?: boolean;
  swipeRightLabel: string;
  swipeLeftLabel:  string;
  starLabel?: string;
  onDone:  () => void;
  onSkip:  () => void;
  onStar?: () => void;
  children: ReactNode;
}

const SWIPE_THRESHOLD = 80;

const CardShell = ({
  mood, disableSwipe, hideStar,
  swipeRightLabel, swipeLeftLabel, starLabel = 'Star',
  onDone, onSkip, onStar, children,
}: CardShellProps) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [starAnim, setStarAnim] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const finish = useCallback((dir: 'left' | 'right', cb: () => void) => {
    setExitDirection(dir);
    setTimeout(() => {
      cb();
      setExitDirection(null);
      setDragX(0);
    }, 240);
  }, []);

  const done = () => finish('right', onDone);
  const skip = () => finish('left',  onSkip);
  const star = () => {
    if (!onStar) return done();
    setStarAnim(true);
    setTimeout(() => { setStarAnim(false); finish('right', onStar); }, 380);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (disableSwipe) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = false;
    setIsDragging(true);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (disableSwipe) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!swiping.current && Math.abs(dx) > 10) {
      if (Math.abs(dx) > Math.abs(dy)) swiping.current = true;
      else { setIsDragging(false); return; }
    }
    if (swiping.current) { e.preventDefault(); setDragX(dx); }
  };
  const onTouchEnd = () => {
    if (disableSwipe) return;
    setIsDragging(false);
    if (dragX > SWIPE_THRESHOLD) {
  Haptics.impact({ style: ImpactStyle.Medium });
  done();
} else if (dragX < -SWIPE_THRESHOLD) {
  Haptics.impact({ style: ImpactStyle.Light });
  skip();
}
    else setDragX(0);
  };
  const onMouseDown = (e: React.MouseEvent) => {
    if (disableSwipe) return;
    startX.current = e.clientX;
    swiping.current = true;
    setIsDragging(true);
    const move = (ev: MouseEvent) => setDragX(ev.clientX - startX.current);
    const up = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      setDragX(prev => {
        if (prev > SWIPE_THRESHOLD) {
  Haptics.impact({ style: ImpactStyle.Medium });
  done();
} else if (prev < -SWIPE_THRESHOLD) {
  Haptics.impact({ style: ImpactStyle.Light });
  skip();
}
        return 0;
      });
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  };

  const swipeHintOpacity = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const swipeDir = dragX > 20 ? 'right' : dragX < -20 ? 'left' : null;
  const rotation = dragX * 0.05;
  const transform =
    exitDirection === 'right' ? 'translateX(120%) rotate(15deg)' :
    exitDirection === 'left'  ? 'translateX(-120%) rotate(-15deg)' :
    dragX !== 0 ? `translateX(${dragX}px) rotate(${rotation}deg)` :
    'translateX(0) rotate(0)';

  return (
    <>
      {/* Swipe hint pills */}
      {swipeDir === 'right' && (
        <div className="absolute top-4 left-8 z-30 bg-accent text-accent-foreground font-display font-bold text-base px-4 py-2 rounded-lg"
             style={{ opacity: swipeHintOpacity }}>{swipeRightLabel}</div>
      )}
      {swipeDir === 'left' && (
        <div className="absolute top-4 right-8 z-30 bg-card border border-white/12 text-foreground font-display font-bold text-base px-4 py-2 rounded-lg"
             style={{ opacity: swipeHintOpacity }}>{swipeLeftLabel}</div>
      )}

      {/* Star burst */}
      {starAnim && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <span className="text-7xl animate-ping">⭐</span>
        </div>
      )}

      <div
        className={`flex-1 flex flex-col rounded-2xl border overflow-hidden relative ${disableSwipe ? '' : 'select-none cursor-grab active:cursor-grabbing'}`}
        style={{
          transform,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          opacity: exitDirection ? 0.7 : 1,
          background: `linear-gradient(155deg, hsl(var(--card)) 0%, hsl(var(--card)) 55%, hsl(${mood.primary} / 0.18) 100%)`,
          borderColor: `hsl(${mood.primary} / 0.35)`,
          boxShadow: `0 0 32px -10px hsl(${mood.primary} / 0.55)`,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
      >
        {/* top accent stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, hsl(${mood.primary}), hsl(${mood.accent}))` }}
        />
        {children}
      </div>

      {/* Footer controls */}
      {!disableSwipe && (
        <div className="flex items-center justify-between pt-3 px-2">
          <span className="text-xs text-muted-foreground font-display font-semibold">← {swipeLeftLabel.replace(' →', '')}</span>
          {!hideStar && (
            <button
              onClick={star}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-card border font-display font-semibold text-sm active:scale-95 transition-all"
              style={{ color: `hsl(${mood.primary})`, borderColor: `hsl(${mood.primary} / 0.5)` }}
            >
              <Star className="w-4 h-4" style={{ fill: `hsl(${mood.primary})` }} />
              {starLabel}
            </button>
          )}
          <span className="text-xs font-display font-semibold" style={{ color: `hsl(${mood.accent})` }}>
            {swipeRightLabel.replace(' ✓', '')} →
          </span>
        </div>
      )}
    </>
  );
};

export default CardShell;
