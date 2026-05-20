export type CardType =
  // legacy / generic
  | 'question'
  | 'dare'
  | 'vote'
  | 'scenario'
  | 'quiz'
  | 'minigame'
  | 'charade'

  | 'tenbut'
  | 'whowould'
  | 'international'
  | 'truthslie'
  | 'oddoneout'

  // new "smart card" types
  | 'pair'
  | 'confession'
  | 'flirty'
  | 'family'
  | 'reaction'
  | 'team'
  | 'secret'
  | 'guess'
  | 'duo'
  | 'elim'
  | 'hottake';

export interface GameCard {
  card_id: number;
  type: CardType;
  /** The player this card is addressed to (shown prominently) */
  target_player?: string;
  /** The single question, dare, or prompt text */
  question: string;
  /** Emoji from the criteria that inspired this card */
  source_emoji?: string;

  /* ============ Optional smart-card fields ============ */
  /** Players involved (vote / pair / team / duo / guess) */
  players?: string[];
  /** Choice options (vote / quiz / hot-take) */
  options?: string[];
  /** Index of the correct option (quiz) */
  correct?: number;
  /** Countdown seconds (reaction / quiz) */
  timer_seconds?: number;
  /** Hidden role for pass-the-phone reveal (secret) */
  secret_role?: string;
  /** Team setup (team battles) */
  teams?: { name: string; players: string[] }[];
}

export type GenerationStatus = 'idle' | 'generating' | 'ready' | 'error';

export interface GenerationState {
  status: GenerationStatus;
  cards: GameCard[];
  systemPrompt: string;
  dynamicPrompt: string;
  error?: string;
}

/** Placeholder card library for future hybrid model */
export const CARD_LIBRARY: GameCard[] = [];
