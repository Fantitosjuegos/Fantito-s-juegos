/**
 * players/constants.ts
 * --------------------
 * Static lookup tables for the player canvas.
 * Extracted from PlayersRelationsScreen to keep that file focused on logic.
 */
import type { RelationType } from '@/lib/onboarding-types';

/** SVG stroke styling per relationship type */
export const LINE_STYLE: Record<
  RelationType,
  { stroke: string; dash?: string; pulse?: boolean; double?: boolean; jitter?: boolean }
> = {
  lovers:      { stroke: '#ec4899', pulse: true },
  crush:       { stroke: '#f472b6', pulse: true, dash: '2 4' },
  beef:        { stroke: '#ef4444', jitter: true },
  bestfriends: { stroke: '#3b82f6' },
  flirtyrel:   { stroke: '#fb923c', dash: '6 4' },
  complicated: { stroke: '#a855f7', dash: '4 6' },
  enemies:     { stroke: '#71717a', dash: '1 5' },
  roommates:   { stroke: '#14b8a6' },
  family:      { stroke: '#22c55e', double: true },
};

/** Teaser text shown when a relation is added */
export const FUTURE_PREVIEW: Record<RelationType, string> = {
  lovers:      '🔓 Future Q: Who falls in love too fast?',
  crush:       '🔓 Future Q: Who would secretly date someone here?',
  beef:        '🔓 Future vote: Who starts the most drama?',
  bestfriends: '🔓 Future trivia: how well do you know them?',
  flirtyrel:   '🔓 Future dare: pick your flirt move',
  complicated: "🔓 Future Q: define 'complicated'",
  enemies:     '🔓 Future vote: who survives the breakup?',
  roommates:   '🔓 Roommate confession incoming',
  family:      '🔓 Family-mode question added',
};

/** Fantito's reaction quips per relation type */
export const FANTITO_QUIPS: Record<RelationType, string> = {
  lovers:      '👀 OHHHH this changes everything.',
  crush:       '😏 Saving that for later...',
  beef:        "💀 I'm definitely asking about this later.",
  bestfriends: '🤝 Tight crew. Easy targets.',
  flirtyrel:   '🔥 The flirty arc begins.',
  complicated: "🫣 'It's complicated.' Noted.",
  enemies:     '☠️ Bringing the popcorn.',
  roommates:   '🏠 The dishes story is coming.',
  family:      '🤠 Family drama detected.',
};

/** CSS keyframe animations injected once by PlayersRelationsScreen */
export const PLAYER_CANVAS_STYLES = `
  @keyframes pr-blob { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,-10px) scale(1.08)} }
  @keyframes pr-blob2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-18px,12px) scale(1.05)} }
  @keyframes pr-particle { 0%,100%{transform:translate(0,0);opacity:.35} 50%{transform:translate(8px,-12px);opacity:.7} }
  @keyframes pr-bubble-in { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
  @keyframes pr-bubble-bounce { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 100%{transform:scale(1)} }
  @keyframes pr-ring-pulse { 0%,100%{box-shadow:0 0 0 0 hsl(var(--primary)/.5)} 50%{box-shadow:0 0 0 8px hsl(var(--primary)/0)} }
  @keyframes pr-line-pulse { 0%,100%{opacity:.55} 50%{opacity:1} }
  @keyframes pr-dash { to { stroke-dashoffset: -40; } }
  @keyframes pr-jitter { 0%,100%{transform:translate(0,0)} 25%{transform:translate(.6px,-.5px)} 75%{transform:translate(-.6px,.5px)} }
  @keyframes pr-burst { from{transform:translate(0,0) scale(1);opacity:1} to{transform:translate(var(--bx),var(--by)) scale(0);opacity:0} }
  @keyframes pr-cta-glow { 0%,100%{box-shadow:0 0 0 0 hsl(var(--primary)/.45)} 50%{box-shadow:0 0 28px 4px hsl(var(--primary)/.5)} }
  @keyframes pr-preview-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  .pr-cta-active { animation: pr-cta-glow 2s ease-in-out infinite; }
`;