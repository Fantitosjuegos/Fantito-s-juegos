import { OnboardingState, RELATION_TYPES, CONSUMPTION_TYPES, VIBES } from './onboarding-types';

// ──────────────────────────────────────────────
// LANGUAGE STYLE & REGION MAPPING
// ──────────────────────────────────────────────

const LOCALE_MAP: Record<string, { locale_tag: string; region_hint: string; language_style: string }> = {
  en: { locale_tag: 'en', region_hint: 'global', language_style: 'casual English' },
  es: { locale_tag: 'es', region_hint: 'latin', language_style: 'casual Spanish' },
  de: { locale_tag: 'de', region_hint: 'europe', language_style: 'casual German' },
  fr: { locale_tag: 'fr', region_hint: 'europe', language_style: 'casual French' },
  pt: { locale_tag: 'pt', region_hint: 'europe', language_style: 'casual Portuguese' },
  it: { locale_tag: 'it', region_hint: 'europe', language_style: 'casual Italian' },
  ar: { locale_tag: 'ar', region_hint: 'middle-east', language_style: 'Modern Standard Arabic, casual tone' },
};

// ──────────────────────────────────────────────
// SCENE THEMES
// ──────────────────────────────────────────────

const SCENE_THEMES: Record<string, { theme: string; card_ideas: string[]; emoji: string }> = {
  'house-party': {
    theme: 'House party vibes — living room chaos, kitchen confessions, music battles',
    card_ideas: ['who controls the playlist', 'kitchen secrets', 'couch confessions', 'dance-off dares', 'house rules challenges'],
    emoji: '🏠',
  },
  'bar': {
    theme: 'Bar/pub atmosphere — social drinking games, bartender interactions, bar bets',
    card_ideas: ['bar bet dares', 'order something embarrassing', 'bartender impression', 'pub quiz style', 'toast challenges'],
    emoji: '🍻',
  },
  'road-trip': {
    theme: 'Road trip energy — car games, travel stories, highway madness',
    card_ideas: ['car karaoke battles', 'road trip confessions', 'license plate games', 'backseat drama', 'pit stop dares'],
    emoji: '🚗',
  },
  'pregame': {
    theme: 'Pre-game hype — getting ready, energy building, outfit drama',
    card_ideas: ['outfit roasts', 'pre-game predictions', 'hype man challenges', 'getting ready confessions', 'night plan votes'],
    emoji: '🎉',
  },
  'chill-night': {
    theme: 'Chill night in — cozy confessions, deep talks, blanket vibes',
    card_ideas: ['pillow confessions', 'cozy truths', 'late night deep thoughts', 'comfort food debates', 'sleepover secrets'],
    emoji: '🛋️',
  },
  'vacation': {
    theme: 'Vacation mode — travel adventures, holiday chaos, tourist moments',
    card_ideas: ['travel horror stories', 'tourist dares', 'holiday confessions', 'beach/pool challenges', 'vacation bucket list'],
    emoji: '🌴',
  },
};

// ──────────────────────────────────────────────
// CONSUMPTION RULES
// ──────────────────────────────────────────────

function buildConsumptionRules(state: OnboardingState): string {
  const types = state.selectedConsumptions;
  if (!types || types.length === 0) {
    return `[CONSUMPTION] NONE — zero substance references.`;
  }

  const level = state.consumptionLevel;
  const cardCount = level <= 2 ? '3-5' : level <= 3 ? '6-8' : '10-15';
  const drinking = types.includes('drinkers');
  const smoking = types.includes('smokers');

  if (drinking && smoking) {
    return `[CONSUMPTION] DRINKERS + SMOKERS lv${level}/5. ${cardCount} substance-themed cards mixing BOTH worlds: drink-and-pass moments, "sip OR puff" choices, sober-vs-stoned debates, bar-meets-smoke-circle dares. Make some cards reference both at once.`;
  }
  if (drinking) {
    return `[CONSUMPTION] DRINKERS lv${level}/5. ${cardCount} drink-themed cards. Integrate: toasts, bar bets, ordering dares.`;
  }
  if (smoking) {
    return `[CONSUMPTION] SMOKERS lv${level}/5. ${cardCount} chill-vibe cards. Integrate: pass-the-vibe, smoke circle confessions, elevated truths.`;
  }
  return '';
}

// ──────────────────────────────────────────────
// GAME MODE RULES
// ──────────────────────────────────────────────

function buildGameModeRules(state: OnboardingState): string {
  switch (state.gameMode) {
    case 'nasty18':
      return `[MODE: NASTY +18 🔞] Explicit/sexual/bold content ALLOWED. 15+ adult-themed cards. Playful, consensual, never degrading.`;
    case 'family':
      return `[MODE: FAMILY 👨‍👩‍👧] ZERO substance/flirty/sexual/crude. Only wholesome, family-friendly content. Override consumption.`;
    default:
      return `[MODE: NORMAL] Follow vibes and consumption as configured.`;
  }
}

// ──────────────────────────────────────────────
// DYNAMIC CONTEXT JSON BUILDER (compact)
// ──────────────────────────────────────────────

export function buildDynamicPrompt(state: OnboardingState): string {
  const localeInfo = LOCALE_MAP[state.language] || LOCALE_MAP.en;

  const players = state.players.map(p => ({ name: p.name, emoji: p.emoji }));

  const relations = state.relations.map(r => {
    const p1 = state.players.find(p => p.id === r.player1Id);
    const p2 = state.players.find(p => p.id === r.player2Id);
    const typeInfo = RELATION_TYPES.find(t => t.id === r.type);
    return `${p1?.name ?? '?'}-${p2?.name ?? '?'}:${r.type}${typeInfo?.emoji ?? ''}`;
  });

  const relations_detail = state.relations.map(r => {
    const p1 = state.players.find(p => p.id === r.player1Id);
    const p2 = state.players.find(p => p.id === r.player2Id);
    const typeInfo = RELATION_TYPES.find(t => t.id === r.type);
    return {
      p1: p1?.name ?? '?',
      p2: p2?.name ?? '?',
      type: r.type,
      label: typeInfo?.labelKey ?? r.type,
      emoji: typeInfo?.emoji ?? '',
    };
  });

  const vibeIds = state.vibes;
  const vibes_detail = vibeIds.map(v => {
    const info = VIBES.find(vi => vi.id === v);
    return { id: v, label: info?.labelKey ?? v, emoji: info?.emoji ?? '' };
  });

  const sceneInfo = state.contextState ? SCENE_THEMES[state.contextState] || null : null;

  const topicsAvoid: string[] = [];
  const topicsInclude: string[] = [];
  if (!vibeIds.includes('flirty')) topicsAvoid.push('flirty');
  if (!vibeIds.includes('deep')) topicsAvoid.push('deep_emotional');
  if (vibeIds.includes('chill')) topicsInclude.push('lighthearted');
  if (vibeIds.includes('wild')) topicsInclude.push('chaos');
  if (vibeIds.includes('chaotic')) topicsInclude.push('unpredictable');
  if (state.gameMode === 'family') {
    topicsAvoid.push('flirty', 'sexual', 'substance', 'crude', 'adult');
    topicsInclude.push('wholesome', 'family-friendly');
  }

  // Compact context object — every onboarding parameter that matters at generation time.
  const ctx: Record<string, any> = {
    locale: localeInfo.locale_tag,
    lang_style: localeInfo.language_style,
    region: localeInfo.region_hint,
    game_mode: state.gameMode,
    players,
    player_count: players.length,
    relations: relations_detail,
    has_relations: relations_detail.length > 0,
    vibes: vibeIds,
    vibes_detail,
    avoid: topicsAvoid,
    include: topicsInclude,
  };

  if (state.selectedConsumptions.length > 0) {
    ctx.consumption = { types: state.selectedConsumptions, level: state.consumptionLevel };
  }

  if (sceneInfo) {
    ctx.scene = {
      id: state.contextState,
      theme: sceneInfo.theme,
      emoji: sceneInfo.emoji,
    };
    const host = state.hostPlayerId ? state.players.find(p => p.id === state.hostPlayerId) : null;
    if (host && (state.contextState === 'house-party' || state.contextState === 'chill-night')) {
      ctx.scene.host = { name: host.name, emoji: host.emoji };
    }
    const driver = state.driverPlayerId ? state.players.find(p => p.id === state.driverPlayerId) : null;
    if (driver && state.contextState === 'road-trip') {
      ctx.scene.driver = { name: driver.name, emoji: driver.emoji };
    }
  }

  // Game type filter — only active when 2+ types selected
  if (state.selectedGameTypes?.length >= 2) {
    ctx.game_type_filter = {
      active: true,
      types: state.selectedGameTypes,
      instruction: 'Generate ONLY these card types. Ignore all other types.',
    };
  }

  // Time of night — flavors pacing and energy
  if (state.timing) {
    ctx.time_of_night = state.timing;
  }

  if (state.freeTextDetails) {
    // Sanitize: cap length and strip prompt-injection patterns
    const sanitized = state.freeTextDetails
      .slice(0, 500)
      .replace(/\[(SYSTEM|ASSISTANT|USER)[^\]]*\]/gi, '')
      .replace(/```/g, '')
      .trim();
    if (sanitized) ctx.free_text = sanitized;
  }

  const parts = [JSON.stringify(ctx)];
  parts.push(buildGameModeRules(state));
  parts.push(buildConsumptionRules(state));

  return parts.join('\n');
}

// ──────────────────────────────────────────────
// FINAL PROMPT COMPOSER
// ──────────────────────────────────────────────

export interface ComposedPrompt {
  dynamicPrompt: string;
}

export function composePrompt(state: OnboardingState): ComposedPrompt {
  return {
    dynamicPrompt: buildDynamicPrompt(state),
  };
}