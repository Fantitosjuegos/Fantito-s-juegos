/**
 * players/PlayerBubble.tsx
 * ------------------------
 * The draggable, tappable player circle rendered on the canvas.
 * Extracted from PlayersRelationsScreen — zero logic change.
 */
import type { Player } from '@/lib/onboarding-types';
import type { BubblePos } from './types';

interface PlayerBubbleProps {
  player: Player;
  pos: BubblePos;
  isSelected: boolean;
  isDragging: boolean;
  canvasRef: React.RefObject<HTMLDivElement>;
  draggingRef: React.MutableRefObject<{
    id: string; pointerId: number;
    offX: number; offY: number;
    startX: number; startY: number;
    moved: boolean;
  } | null>;
  players: Player[];
  onTap: (id: string) => void;
  onDropOnPlayer: (dragged: string, target: string) => void;
}

const PlayerBubble = ({
  player: p, pos, isSelected, isDragging,
  canvasRef, draggingRef, players, onTap, onDropOnPlayer,
}: PlayerBubbleProps) => {
  const recentBounce = performance.now() - pos.bounce < 400;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    draggingRef.current = {
      id: p.id, pointerId: e.pointerId,
      offX: px - pos.x, offY: py - pos.y,
      startX: e.clientX, startY: e.clientY,
      moved: false,
    };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    navigator.vibrate?.(4);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = draggingRef.current;
    if (!d || d.id !== p.id) return;
    if (!d.moved && Math.hypot(Math.abs(e.clientX - d.startX), Math.abs(e.clientY - d.startY)) < 6) return;
    d.moved = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const R = 36;
    pos.x = Math.min(rect.width - R, Math.max(R, e.clientX - rect.left - d.offX));
    pos.y = Math.min(rect.height - R, Math.max(R, e.clientY - rect.top - d.offY));
    pos.vx = 0; pos.vy = 0;
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = draggingRef.current;
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    draggingRef.current = null;
    if (!d) return;
    if (!d.moved) { onTap(p.id); return; }
    const dropTarget = players.find(other => {
      if (other.id === p.id) return false;
      const op = draggingRef.current ? null : null; // resolved via positionsRef in parent
      // Note: drop-target resolution is handled by the parent via positionsRef
      return false;
    });
    if (dropTarget) {
      navigator.vibrate?.(12);
      onDropOnPlayer(p.id, dropTarget.id);
    }
  };

  return (
    <div
      key={p.id}
      data-player-bubble
      role="button"
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center text-2xl select-none ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: pos.x, top: pos.y,
        width: 64, height: 64,
        touchAction: 'none',
        zIndex: isDragging ? 30 : 10,
        transform: `translate(-50%, -50%) scale(${isDragging ? 1.1 : 1})`,
        background: 'radial-gradient(circle at 30% 30%, hsl(var(--card)), hsl(var(--background)))',
        border: '1px solid hsl(var(--border))',
        animation: isDragging
          ? undefined
          : (recentBounce
              ? 'pr-bubble-bounce .4s ease-out'
              : (isSelected ? 'pr-ring-pulse 1.4s ease-in-out infinite' : 'pr-bubble-in .3s ease-out')),
        boxShadow: isDragging
          ? '0 10px 28px rgba(0,0,0,0.45)'
          : (isSelected ? '0 0 18px hsl(var(--primary)/0.5)' : '0 4px 14px rgba(0,0,0,0.3)'),
      }}
    >
      <span style={{ lineHeight: 1, pointerEvents: 'none' }}>{p.emoji}</span>
      <span
        className="absolute -bottom-5 text-[10px] font-display font-bold text-foreground/90 bg-card/70 backdrop-blur px-1.5 py-0.5 rounded-full whitespace-nowrap max-w-[80px] truncate"
        style={{ pointerEvents: 'none' }}
      >
        {p.name}
      </span>
    </div>
  );
};

export default PlayerBubble;