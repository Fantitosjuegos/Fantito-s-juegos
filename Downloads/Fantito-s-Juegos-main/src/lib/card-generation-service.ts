import { GameCard } from './game-types';
import { OnboardingState } from './onboarding-types';
import { composePrompt, ComposedPrompt } from './prompt-engine';
import { supabase } from '@/integrations/supabase/client';
import { getLiveFeedback } from './session-feedback';
import { loadRecentQuestions, rememberQuestions } from './question-memory';

// Fantitos session = exactly 25 cards: 7 calibration + 18 adaptive.
const BATCH1_SIZE = 7;
const BATCH2_SIZE = 18;
const TOTAL_DECK_SIZE = BATCH1_SIZE + BATCH2_SIZE;

function parseCardsFromResponse(data: any, offset: number, size: number): GameCard[] {
  return (data.cards || []).slice(0, size).map((c: any, i: number) => {
    const type = c.card_type || c.type || 'question';
    const rawOptions = Array.isArray(c.options) ? c.options.map((o: any) => String(o)).filter(Boolean) : undefined;
    const rawCorrect = typeof c.correct === 'number' ? c.correct
      : typeof c.correct_index === 'number' ? c.correct_index
      : undefined;
    // For quiz cards we keep at most 3 AI options; the QuizCard component appends
    // a localized "Something else?" as the 4th choice. Correct is clamped to 0..2.
    const isQuiz = type === 'quiz';
    const cappedOptions = rawOptions && rawOptions.length >= 2
      ? rawOptions.slice(0, isQuiz ? 3 : 4)
      : undefined;
    const safeCorrect = cappedOptions && typeof rawCorrect === 'number' && rawCorrect >= 0 && rawCorrect < cappedOptions.length
      ? (isQuiz ? Math.min(rawCorrect, 2) : rawCorrect)
      : undefined;
    return {
      card_id: c.order_index || c.card_id || offset + i + 1,
      type,
      target_player: c.target_player || undefined,
      question: c.question || c.content || '',
      source_emoji: c.source_emoji || undefined,
      players: Array.isArray(c.players) ? c.players.map((p: any) => String(p)) : undefined,
      options: cappedOptions,
      correct: safeCorrect,
      timer_seconds: typeof c.timer_seconds === 'number' ? c.timer_seconds : undefined,
      secret_role: typeof c.secret_role === 'string' ? c.secret_role : undefined,
      teams: Array.isArray(c.teams) ? c.teams : undefined,
    };
  });
}

async function generateBatch(
  prompt: ComposedPrompt,
  state: OnboardingState,
  batch: 1 | 2,
  avoidQuestions: string[] = [],
): Promise<GameCard[]> {
  const size = batch === 1 ? BATCH1_SIZE : BATCH2_SIZE;
  const { data, error } = await supabase.functions.invoke('generate-cards', {
    body: {
      dynamicPrompt: prompt.dynamicPrompt,
      context: {
        language: state.language,
        consumptionLevel: state.consumptionLevel,
        consumptions: state.selectedConsumptions,
        scene: state.contextState,
        vibes: state.vibes,
        gameMode: state.gameMode,
        players: state.players.map(p => ({ name: p.name })),
        playerCount: state.players.length,
      },
      batch,
      batchSize: size,
      avoidQuestions,
      // Live in-session feedback only matters for phase 2 generation
      liveFeedback: batch === 2 ? getLiveFeedback() : undefined,
    },
  });

  if (error) {
    console.error(`Batch ${batch} error:`, error);
    throw new Error(error.message || `Batch ${batch} failed`);
  }
  const offset = batch === 1 ? 0 : BATCH1_SIZE;
  const cards = parseCardsFromResponse(data, offset, size);
  cards.sort((a, b) => a.card_id - b.card_id);
  return cards;
}

/**
 * Called by the player UI when the user reaches card 5.
 * That's the moment a Fantitos session officially "counts" as a played game,
 * so credit deduction happens here (not at deck-generation time).
 * Returns true on success, false if the user is out of credits.
 */
export async function commitGameSession(): Promise<{ success: boolean; outOfCredits?: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-cards', {
      body: { commitGame: true },
    });
    if (error) {
      // FunctionsHttpError has a typed .message — no cast needed
      const msg = error.message ?? '';
      if (msg.includes('insufficient_credits') || msg.includes('402')) {
        return { success: false, outOfCredits: true };
      }
      console.warn('commitGameSession error:', error);
      return { success: false };
    }
    // functions.invoke returns `data: unknown` — narrow it safely
    const result = data as Record<string, unknown> | null;
    return { success: !!result?.success };
  } catch (e) {
    console.warn('commitGameSession failed:', e);
    return { success: false };
  }
}

function generateMockFallback(count: number, state: OnboardingState): GameCard[] {
  const players = state.players.map(p => p.name);
  const pick = () => players[Math.floor(Math.random() * players.length)] ?? 'Someone';
  const pickOther = (exclude: string) => {
    const others = players.filter(n => n !== exclude);
    return others.length > 0 ? others[Math.floor(Math.random() * others.length)] : 'someone';
  };
  const templates: Array<() => Omit<GameCard, 'card_id'>> = [
    () => { const t = pick(); const o = pickOther(t); return { type: 'question', target_player: t, question: `What does ${o} think is your worst habit?`, source_emoji: '😎' }; },
    () => { const t = pick(); return { type: 'dare', target_player: t, question: `Do your best impression of ${pickOther(t)}!`, source_emoji: '🤪' }; },
    () => { const t = pick(); const o = pickOther(t); return { type: 'vote', target_player: t, question: `Who would ${o} say is the most dramatic person here?`, source_emoji: '🗳️' }; },
    () => { const t = pick(); return { type: 'pair', target_player: t, question: `${t}, what tiny green flag does ${pickOther(t)} have that they don't realize?`, source_emoji: '👀' }; },
    () => ({ type: 'minigame', target_player: undefined, question: `🎮 Speed Round! Everyone names their guilty pleasure song.`, source_emoji: '🎮' }),
  ];
  return Array.from({ length: count }, (_, i) => ({ card_id: i + 1, ...templates[i % templates.length]() }));
}

export interface GenerationResult {
  cards: GameCard[];
  prompt: ComposedPrompt;
  source: 'ai' | 'mock';
  /** Set when only batch 1 has been generated and batch 2 is still pending. */
  hasMoreLoading?: boolean;
}

/**
 * Phase 1 only: generates the 7 calibration cards so the user can start playing
 * immediately. Batch 2 (the remaining 18 adaptive cards) is generated lazily
 * via `generateRestOfCards` once the player reaches card 6.
 */
export async function generateGameCards(state: OnboardingState): Promise<GenerationResult> {
  const prompt = composePrompt(state);
  try {
    const crossSessionAvoid = loadRecentQuestions();
    const batch1Cards = await generateBatch(prompt, state, 1, crossSessionAvoid);
    rememberQuestions(batch1Cards.map(c => c.question));
    return { cards: batch1Cards, prompt, source: 'ai', hasMoreLoading: true };
  } catch {
    console.warn('AI generation failed, using mock fallback');
    const cards = generateMockFallback(BATCH1_SIZE, state);
    rememberQuestions(cards.map(c => c.question));
    return { cards, prompt, source: 'mock' };
  }
}

/**
 * Phase 2: triggered when the player reaches card 6. Generates the remaining
 * 18 adaptive cards using live in-session feedback and the batch 1 questions
 * as anti-repeat context.
 */
export async function generateRestOfCards(
  state: OnboardingState,
  prompt: ComposedPrompt,
  existingCards: GameCard[],
): Promise<GameCard[]> {
  const crossSessionAvoid = loadRecentQuestions();
  const avoid = [
    ...existingCards.map(c => c.question).filter(Boolean),
    ...crossSessionAvoid,
  ];
  let batch2Cards: GameCard[] = [];
  try {
    batch2Cards = await generateBatch(prompt, state, 2, avoid);
  } catch {
    console.warn('Batch 2 failed, using mock fallback');
    batch2Cards = generateMockFallback(BATCH2_SIZE, state);
  }
  const seen = new Set(existingCards.map(c => c.question.trim().toLowerCase()));
  const deduped = batch2Cards.filter(c => {
    const k = c.question.trim().toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  let allCards = [...existingCards, ...deduped];
  if (allCards.length < TOTAL_DECK_SIZE) {
    const missing = TOTAL_DECK_SIZE - allCards.length;
    const filler = generateMockFallback(missing, state).map((c, i) => ({
      ...c,
      card_id: allCards.length + i + 1,
    }));
    allCards = [...allCards, ...filler];
  }
  allCards = allCards.slice(0, TOTAL_DECK_SIZE).map((c, i) => ({ ...c, card_id: i + 1 }));
  rememberQuestions(allCards.slice(existingCards.length).map(c => c.question));
  return allCards;
}