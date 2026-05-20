// Lightweight in-memory live-feedback buffer for the current play session.
// Captured from cards 1-7 (calibration) and passed into the phase-2 generation
// request so the AI can adapt cards 8-25 to what THIS group reacted to.

import { GameCard } from './game-types';

export type FeedbackAction = 'skip' | 'done' | 'star';

export interface FeedbackEvent {
  card_type: string;
  question: string;
  action: FeedbackAction;
  at: number;
}

let buffer: FeedbackEvent[] = [];

export function recordFeedback(card: GameCard, action: FeedbackAction) {
  buffer.push({
    card_type: card.type,
    question: card.question,
    action,
    at: Date.now(),
  });
  // Keep bounded
  if (buffer.length > 60) buffer = buffer.slice(-60);
}

export function getLiveFeedback(): FeedbackEvent[] {
  return [...buffer];
}

export function resetLiveFeedback() {
  buffer = [];
}
