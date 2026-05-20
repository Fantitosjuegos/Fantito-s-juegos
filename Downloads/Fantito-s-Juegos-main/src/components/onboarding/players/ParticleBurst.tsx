/**
 * players/ParticleBurst.tsx
 * -------------------------
 * The confetti-style burst effect that fires when a relation is created.
 * Extracted from PlayersRelationsScreen — zero logic change.
 */
import { cssVars } from '@/lib/css-utils';

interface Burst { id: number; x: number; y: number }

interface Props {
  bursts: Burst[];
}

const ParticleBurst = ({ bursts }: Props) => (
  <>
    {bursts.map(b => (
      <div key={b.id} className="fixed pointer-events-none z-40" style={{ left: b.x, top: b.y }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const dist  = 30 + Math.random() * 20;
          return (
            <span
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                ...cssVars({
                  '--bx': `${Math.cos(angle) * dist}px`,
                  '--by': `${Math.sin(angle) * dist}px`,
                }),
                animation: 'pr-burst .7s ease-out forwards',
              }}
            />
          );
        })}
      </div>
    ))}
  </>
);

export default ParticleBurst;