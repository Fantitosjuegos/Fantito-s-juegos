import { CardType, GameCard } from './game-types';
import { ConsumptionType, GameMode } from './onboarding-types';

export type MoodKey =
  | 'flirty' | 'deep' | 'chaos' | 'family' | 'quiz'
  | 'vote' | 'pair' | 'reaction' | 'secret' | 'team'
  | 'neutral';

export interface Mood {
  key: MoodKey;
  /** HSL string fragments — used inline in style */
  primary: string;   // e.g. '339 100% 60%'
  accent:  string;
  /** Particle density 0..1 */
  particles: number;
  /** Motion speed 0..1 (higher = faster pacing) */
  speed: number;
  /** Apply spotlight vignette (intimate types) */
  spotlight: boolean;
  /** Subtle glitch flicker (chaos) */
  glitch: boolean;
  /** Tagline shown subtly */
  tag: string;
}

const MOODS: Record<MoodKey, Mood> = {
  flirty:   { key: 'flirty',   primary: '339 100% 65%', accent: '20 95% 60%',  particles: 0.6, speed: 0.45, spotlight: false, glitch: false, tag: 'tension' },
  deep:     { key: 'deep',     primary: '252 70% 65%',  accent: '217 80% 55%', particles: 0.4, speed: 0.25, spotlight: true,  glitch: false, tag: 'intimate' },
  chaos:    { key: 'chaos',    primary: '0 85% 60%',    accent: '339 100% 60%',particles: 0.95,speed: 0.95, spotlight: false, glitch: true,  tag: 'unstable' },
  family:   { key: 'family',   primary: '38 95% 62%',   accent: '175 75% 55%', particles: 0.5, speed: 0.55, spotlight: false, glitch: false, tag: 'wholesome' },
  quiz:     { key: 'quiz',     primary: '190 95% 58%',  accent: '50 95% 60%',  particles: 0.7, speed: 0.85, spotlight: false, glitch: false, tag: 'game show' },
  vote:     { key: 'vote',     primary: '339 100% 60%', accent: '190 95% 58%', particles: 0.75,speed: 0.7,  spotlight: false, glitch: false, tag: 'verdict' },
  pair:     { key: 'pair',     primary: '280 80% 65%',  accent: '339 100% 60%',particles: 0.5, speed: 0.45, spotlight: true,  glitch: false, tag: 'duo' },
  reaction: { key: 'reaction', primary: '40 100% 60%',  accent: '0 90% 60%',   particles: 1.0, speed: 1.0,  spotlight: false, glitch: true,  tag: 'fast' },
  secret:   { key: 'secret',   primary: '252 60% 50%',  accent: '232 50% 35%', particles: 0.25,speed: 0.2,  spotlight: true,  glitch: false, tag: 'hidden' },
  team:     { key: 'team',     primary: '217 100% 62%', accent: '0 85% 60%',   particles: 0.6, speed: 0.7,  spotlight: false, glitch: false, tag: 'versus' },
  neutral:  { key: 'neutral',  primary: '339 100% 59%', accent: '217 100% 62%',particles: 0.4, speed: 0.5,  spotlight: false, glitch: false, tag: '' },
};

/* Map raw card type → mood */
function typeToMood(type: CardType): MoodKey {
  switch (type) {
    case 'flirty':                       return 'flirty';
    case 'confession':                   return 'deep';
    case 'family':                       return 'family';
    case 'quiz':                         return 'quiz';
    case 'vote': case 'whowould':        return 'vote';
    case 'pair':                         return 'pair';
    case 'reaction': case 'minigame':    return 'reaction';
    case 'secret':                       return 'secret';
    case 'team':                         return 'team';
    case 'dare': case 'oddoneout':       return 'chaos';
    case 'hottake': case 'truthslie':    return 'vote';
    default:                             return 'neutral';
  }
}

export interface MoodContext {
  vibes: string[];
  consumptions?: ConsumptionType[];
  mode?: GameMode;
}

export function cardToMood(card: GameCard, ctx: MoodContext): Mood {
  let key = typeToMood(card.type);

  // Vibe nudges — only when type is neutral/generic
  if (key === 'neutral') {
    if (ctx.vibes.includes('chaotic'))      key = 'chaos';
    else if (ctx.vibes.includes('flirty'))  key = 'flirty';
    else if (ctx.vibes.includes('deep'))    key = 'deep';
    else if (ctx.vibes.includes('wild'))    key = 'reaction';
  }

  // Family mode overrides everything intense → wholesome palette
  if (ctx.mode === 'family' && (key === 'chaos' || key === 'flirty' || key === 'reaction')) {
    key = 'family';
  }

  const base = MOODS[key];
  // Slight intensity boost from consumption
  const boost = (ctx.consumptions?.length ?? 0) * 0.05;
  return { ...base, particles: Math.min(1, base.particles + boost) };
}

/** Routing: which component should render this card */
export function moodToComponent(card: GameCard): string {
  switch (card.type) {
    case 'vote': case 'whowould':        return 'VoteCard';
    case 'pair':                         return 'PairCard';
    case 'quiz':                         return 'QuizCard';
    // Phase 2 components fall back to QuestionCard for now
    default:                             return 'QuestionCard';
  }
}
