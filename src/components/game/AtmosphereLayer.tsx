import { Mood } from '@/lib/card-mood';
import { useMemo } from 'react';
import { cssVars } from '@/lib/css-utils';

interface Props { mood: Mood }

const AtmosphereLayer = ({ mood }: Props) => {
  // Stable particle layout per mood key (re-shuffles on mood change)
  const dots = useMemo(() => {
    const n = Math.round(8 + mood.particles * 18);
    return Array.from({ length: n }).map((_, i) => ({
      id: i,
      left: ((i * 53) % 100),
      top:  60 + ((i * 31) % 40),
      dx:   ((i % 5) - 2) * 18,
      dy:  -(120 + (i % 4) * 36),
      delay:   ((i % 7) * 0.32).toFixed(2),
      duration:(1.4 + (i % 3) * 0.5 / mood.speed).toFixed(2),
    }));
  }, [mood.key, mood.particles, mood.speed]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Base radial atmosphere */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `
            radial-gradient(50% 35% at 18% 12%, hsl(${mood.primary} / 0.30), transparent 70%),
            radial-gradient(45% 30% at 82% 88%, hsl(${mood.accent}  / 0.26), transparent 70%),
            radial-gradient(70% 50% at 50% 50%, hsl(${mood.primary} / 0.08), transparent 75%)
          `,
          filter: 'blur(2px)',
        }}
      />

      {/* Spotlight vignette for intimate moods */}
      {mood.spotlight && (
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            background:
              'radial-gradient(50% 45% at 50% 38%, transparent 0%, hsl(0 0% 0% / 0.55) 100%)',
          }}
        />
      )}

      {/* Glitch flicker for chaos */}
      {mood.glitch && (
        <div
          className="absolute inset-0 mix-blend-screen opacity-40 animate-pulse"
          style={{
            background: `repeating-linear-gradient(0deg, transparent 0 3px, hsl(${mood.primary} / 0.12) 3px 4px)`,
          }}
        />
      )}

      {/* Floating particles */}
      {dots.map(d => (
        <span
          key={d.id}
          className="absolute w-1 h-1 rounded-full vs-particle"
          style={{
            left: `${d.left}%`,
            top:  `${d.top}%`,
            background: `hsl(${mood.primary} / 0.7)`,
            boxShadow: `0 0 6px hsl(${mood.primary} / 0.6)`,
            ...cssVars({ '--dx': `${d.dx}px`, '--dy': `${d.dy}px` }),
            animationDelay:    `${d.delay}s`,
            animationDuration: `${d.duration}s`,
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </div>
  );
};

export default AtmosphereLayer;