import { supabase } from '@/integrations/supabase/client';
import { GameCard } from './game-types';

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  return sessionId;
}

export function resetSession() {
  sessionId = null;
}

export async function trackSkippedCard(
  card: GameCard,
  language: string,
  vibes: string[]
) {
  try {
    await supabase.from('skipped_cards').insert({
      session_id: getSessionId(),
      card_type: card.type,
      category: card.type,
      source_emoji: card.source_emoji || '',
      question: card.question,
      target_player: card.target_player || null,
      language,
      vibes,
      action: 'skip',
    });
  } catch (e) {
    console.warn('Failed to track skipped card:', e);
  }
}

export async function trackDoneCard(
  card: GameCard,
  language: string,
  vibes: string[]
) {
  try {
    await supabase.from('skipped_cards').insert({
      session_id: getSessionId(),
      card_type: card.type,
      category: card.type,
      source_emoji: card.source_emoji || '',
      question: card.question,
      target_player: card.target_player || null,
      language,
      vibes,
      action: 'done',
    });
  } catch (e) {
    console.warn('Failed to track done card:', e);
  }
}

export async function trackStarredCard(
  card: GameCard,
  language: string,
  vibes: string[]
) {
  try {
    await supabase.from('skipped_cards').insert({
      session_id: getSessionId(),
      card_type: card.type,
      category: card.type,
      source_emoji: card.source_emoji || '',
      question: card.question,
      target_player: card.target_player || null,
      language,
      vibes,
      action: 'star',
    });
  } catch (e) {
    console.warn('Failed to track starred card:', e);
  }
}
