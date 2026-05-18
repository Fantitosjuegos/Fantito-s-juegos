import type { TranslationKey } from './translations';

export type Language = 'en' | 'es' | 'de' | 'fr' | 'pt' | 'it' | 'ar';

export type Vibe = 'chill' | 'wild' | 'flirty' | 'deep' | 'chaotic';
export type Intensity = 1 | 2 | 3 | 4 | 5;
export type RelationType =
  | 'lovers' | 'crush' | 'beef' | 'bestfriends' | 'flirtyrel'
  | 'complicated' | 'enemies' | 'roommates' | 'family';

export type FamilyRole = 'brother' | 'sister' | 'cousin' | 'mother' | 'father' | 'twins';
export type ConsumptionType = 'drinkers' | 'smokers';
export type GameMode = 'normal' | 'nasty18' | 'family';

export interface Player {
  id: string;
  name: string;
  emoji: string;
}

export interface Relation {
  type: RelationType;
  player1Id: string;
  player2Id: string;
  familyRole?: FamilyRole;
}

export interface OnboardingState {
  language: Language;
  players: Player[];
  relations: Relation[];
  vibes: Vibe[];
  /** Multi-select: users can pick drinkers, smokers, both, or none. */
  selectedConsumptions: ConsumptionType[];
  consumptionLevel: Intensity;
  gameMode: GameMode;
  contextState: string;
  /** When scene is house-party or chill-night-in: the player whose place it is. */
  hostPlayerId?: string;
  /** When scene is road-trip: the player who's driving. */
  driverPlayerId?: string;
  freeTextDetails: string;
  step: number;
}

export const PLAYER_EMOJIS = ['😎', '😈', '👽', '🤠', '💪', '🫦', '🦋', '🌸', '💅', '🥳', '🥷', '👼'];

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export const VIBES: { id: Vibe; labelKey: TranslationKey; emoji: string }[] = [
  { id: 'chill', labelKey: 'chill', emoji: '😎' },
  { id: 'wild', labelKey: 'wild', emoji: '🤪' },
  { id: 'flirty', labelKey: 'flirty', emoji: '😏' },
  { id: 'deep', labelKey: 'deep', emoji: '🧠' },
  { id: 'chaotic', labelKey: 'chaotic', emoji: '🌪️' },
];

export const RELATION_TYPES: { id: RelationType; labelKey: TranslationKey; emoji: string; color: string }[] = [
  { id: 'lovers',      labelKey: 'lovers',        emoji: '❤️',            color: 'text-pink-300' },
  { id: 'crush',       labelKey: 'crush',         emoji: '😍',            color: 'text-pink-300' },
  { id: 'beef',        labelKey: 'beef',          emoji: '🥩',            color: 'text-red-300' },
  { id: 'bestfriends', labelKey: 'bestFriends',   emoji: '🤝',            color: 'text-blue-300' },
  { id: 'flirtyrel',   labelKey: 'flirtyRel',     emoji: '🔥',            color: 'text-orange-300' },
  { id: 'complicated', labelKey: 'complicatedRel', emoji: '👀',           color: 'text-purple-300' },
  { id: 'enemies',     labelKey: 'enemiesRel',    emoji: '💀',            color: 'text-zinc-300' },
  { id: 'roommates',   labelKey: 'roommates',     emoji: '🏠',            color: 'text-teal-300' },
  { id: 'family',      labelKey: 'familyRel',     emoji: '👨\u200d👩\u200d👧', color: 'text-green-300' },
];

export const FAMILY_ROLES: { id: FamilyRole; labelKey: TranslationKey; emoji: string }[] = [
  { id: 'brother', labelKey: 'familyBrother', emoji: '👦' },
  { id: 'sister',  labelKey: 'familySister',  emoji: '👧' },
  { id: 'cousin',  labelKey: 'familyCousin',  emoji: '🧑' },
  { id: 'mother',  labelKey: 'familyMother',  emoji: '👩' },
  { id: 'father',  labelKey: 'familyFather',  emoji: '👨' },
  { id: 'twins',   labelKey: 'familyTwins',   emoji: '👯' },
];

export const CONSUMPTION_TYPES: { id: ConsumptionType; labelKey: TranslationKey; emoji: string }[] = [
  { id: 'drinkers', labelKey: 'drinkers', emoji: '🍺' },
  { id: 'smokers',  labelKey: 'smokers',  emoji: '🌿' },
];

export const GAME_MODES: { id: GameMode; labelKey: TranslationKey; emoji: string; descKey: TranslationKey }[] = [
  { id: 'family',  labelKey: 'familyMode',  emoji: '👨‍👩‍👧', descKey: 'familyModeDesc' },
  { id: 'normal',  labelKey: 'normalMode',  emoji: '🎉',    descKey: 'normalModeDesc' },
  { id: 'nasty18', labelKey: 'nasty18Mode', emoji: '🔞',    descKey: 'nasty18ModeDesc' },
];

export const TOTAL_STEPS = 4;