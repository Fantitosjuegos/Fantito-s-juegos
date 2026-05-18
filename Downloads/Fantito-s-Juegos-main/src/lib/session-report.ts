import { GameCard } from './game-types';
import { ConsumptionType, GameMode, Vibe } from './onboarding-types';
import type { SessionStats } from '@/components/game/SessionRecapScreen';

export interface PlayerRole {
  player: string;
  role: string;
  reason: string;
}

export interface SessionReport {
  // Headline
  sessionTitle: string;
  subtitle: string;

  // Score
  chaosScore: number;
  chaosLabel: string;
  dominantMood: string;

  // Tags (max 3 picked)
  tags: { label: string; value: string }[];

  // Callouts (3-4)
  groupCallouts: string[];

  // Player roles (2-3)
  playerRoles: PlayerRole[];

  // Learnings
  fantitoLearned: string;

  // Unlocks
  nextRoundAdjustments: string[];

  // Quote
  fantitoQuote: string;

  // FOMO numbers (passthrough)
  remainingInQueue: number;
  dangerSkipped: number;
  starred: number;
}

interface BuildOpts {
  stats: SessionStats;
  cards: GameCard[];
  players: string[];
  vibes: string[];
  consumptions: ConsumptionType[];
  mode?: GameMode;
}

function rng(seed: number) {
  let s = (seed || 1) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

export function buildSessionReport({ stats, cards, players, vibes, consumptions, mode }: BuildOpts): SessionReport {
  const total = Math.max(stats.total, 1);
  const r = rng(stats.done * 31 + stats.skipped * 17 + stats.starred * 7 + total);
  const v = (x: string) => vibes.includes(x as Vibe);

  const flirty = v('flirty');
  const deep = v('deep');
  const chaotic = v('chaotic') || v('wild');
  const family = mode === 'family';
  const nasty = mode === 'nasty18';

  // ---------- Chaos score (data-derived) ----------
  const engagement = (stats.done + stats.starred * 1.2) / total;
  const skipRatio = stats.skipped / total;
  let chaos = 30 + engagement * 35 + stats.starred * 1.6 + (stats.byType.pair || 0) * 2.5
    + (stats.byType.vote || 0) * 1.8 - skipRatio * 12;
  if (nasty) chaos += 10;
  if (family) chaos = Math.min(chaos, 60);
  const chaosScore = Math.max(8, Math.min(99, Math.round(chaos)));

  const chaosLabel =
    chaosScore <= 25 ? 'Calm' :
    chaosScore <= 50 ? 'Warm-up chaos' :
    chaosScore <= 75 ? 'Suspicious energy' :
    chaosScore <= 90 ? 'High chaos' :
    'Emotional damage detected';

  // ---------- Dominant mood ----------
  let dominantMood = 'Funny';
  if (family) dominantMood = 'Wholesome chaos';
  else if (skipRatio > 0.4) dominantMood = 'Shy';
  else if ((stats.byType.pair || 0) + (stats.byType.vote || 0) >= 5 && flirty) dominantMood = 'Flirty';
  else if (deep) dominantMood = 'Deep';
  else if (chaosScore >= 75) dominantMood = 'Chaotic';
  else if (nasty) dominantMood = 'Dangerous';

  // ---------- Tags ----------
  const exposure =
    family ? 'Contained' :
    stats.dangerSkipped >= 4 ? 'Low (you ducked a lot)' :
    chaosScore >= 80 ? 'Critical' :
    chaosScore >= 55 ? 'High' :
    chaosScore >= 30 ? 'Medium' : 'Low';

  const flirtCount = (stats.byType.pair || 0) + (stats.byType.vote || 0);
  const flirtLevel =
    family ? 'None' :
    flirtCount >= 6 && flirty ? 'Suspicious' :
    flirtCount >= 4 ? 'High' :
    flirtCount >= 2 ? 'Light' : 'None';

  const trust =
    skipRatio > 0.5 ? 'Dangerous' :
    skipRatio > 0.3 ? 'Wavering' :
    stats.starred >= 5 ? 'Surprisingly honest' :
    'Stable';

  const honesty =
    skipRatio > 0.4 && stats.starred >= 4 ? 'Fake chill' :
    skipRatio < 0.15 ? 'Too honest' :
    'Surprisingly honest';

  const dramaRisk =
    chaosScore >= 80 ? 'Concerning' :
    chaosScore >= 50 ? 'Rising' : 'Safe';

  const allTags = [
    { label: 'Exposure', value: exposure },
    { label: 'Flirt', value: flirtLevel },
    { label: 'Trust', value: trust },
    { label: 'Honesty', value: honesty },
    { label: 'Drama risk', value: dramaRisk },
    { label: 'Mood', value: dominantMood },
  ];
  // Pick the 3 most "interesting" tags (skip 'None' / 'Safe' / 'Stable' if possible)
  const boring = new Set(['None', 'Safe', 'Stable', 'Low']);
  const tags = [
    ...allTags.filter(t => !boring.has(t.value)),
    ...allTags.filter(t => boring.has(t.value)),
  ].slice(0, 3);

  // ---------- Group callouts (data-derived) ----------
  const pickPlayer = () => players[Math.floor(r() * Math.max(players.length, 1))] || 'Someone';
  const pickPair = (): [string, string] => {
    if (players.length < 2) return [pickPlayer(), pickPlayer()];
    const a = Math.floor(r() * players.length);
    let b = Math.floor(r() * players.length);
    while (b === a) b = Math.floor(r() * players.length);
    return [players[a], players[b]];
  };

  const callouts: string[] = [];
  if (stats.skipped >= 3) callouts.push(`💀 ${pickPlayer()} skipped ${stats.skipped} cards. Respectfully suspicious.`);
  if (stats.starred >= 2) callouts.push(`⭐ The group starred ${stats.starred} cards — saving them for later, apparently.`);
  if ((stats.byType.pair || 0) >= 3) {
    const [p1, p2] = pickPair();
    callouts.push(`❤️ ${p1} and ${p2} were paired ${stats.byType.pair} times. Fantito is not ignoring that.`);
  }
  if ((stats.byType.vote || 0) >= 3 && players.length > 0) {
    callouts.push(`🔥 ${pickPlayer()} got voted the most tonight.`);
  }
  if (stats.dangerSkipped >= 3) callouts.push(`👀 The group ducked ${stats.dangerSkipped} risky questions. We see you.`);
  if (flirty && (stats.byType.pair || 0) + (stats.byType.vote || 0) > stats.done * 0.4) {
    callouts.push(`😈 The group reacted more to flirty cards than to anything else.`);
  }
  if (callouts.length === 0) {
    callouts.push(`🤠 Fantito needs more chaos to give a proper read. This group hides behind jokes.`);
  }
  // Cap at 4
  const groupCallouts = callouts.slice(0, 4);

  // ---------- Player roles ----------
  const roles: PlayerRole[] = [];
  if (players.length > 0) {
    if (stats.skipped >= Math.max(3, stats.done * 0.4)) {
      roles.push({ player: pickPlayer(), role: 'The Escaper', reason: `skipped ${stats.skipped} cards` });
    }
    if ((stats.byType.vote || 0) >= 3) {
      roles.push({ player: pickPlayer(), role: 'The Chaos Magnet', reason: 'got mentioned in the most votes' });
    }
    if ((stats.byType.pair || 0) >= 3) {
      const [p1] = pickPair();
      roles.push({ player: p1, role: 'The Secret Main Character', reason: 'showed up in too many pair cards' });
    }
    if (flirty && stats.starred >= 3) {
      roles.push({ player: pickPlayer(), role: 'The Flirt Supplier', reason: 'starred the spicy ones' });
    }
    if (stats.starred === 0 && stats.skipped < stats.done * 0.2) {
      roles.push({ player: pickPlayer(), role: 'The Safe Player', reason: 'said yes to everything mild' });
    }
    if (deep && stats.dangerSkipped <= 1 && stats.done >= 5) {
      roles.push({ player: pickPlayer(), role: 'The Overexposed', reason: 'answered too honestly' });
    }
  }
  // Dedup roles by player, cap at 3
  const seen = new Set<string>();
  const playerRoles = roles.filter(rr => {
    if (seen.has(rr.player)) return false;
    seen.add(rr.player); return true;
  }).slice(0, 3);

  // ---------- What Fantito learned ----------
  let fantitoLearned: string;
  if (skipRatio > 0.4) {
    fantitoLearned = 'You skipped the dangerous stuff but kept tapping through. Next round will start indirect, then push slowly.';
  } else if ((stats.byType.pair || 0) + (stats.byType.vote || 0) > stats.done * 0.4) {
    fantitoLearned = 'This group reacts more to tension than direct confrontation. The next round will lean on indirect, slightly exposing cards.';
  } else if (deep && stats.starred >= 3) {
    fantitoLearned = 'You like the deep stuff but with an exit. Fantito will keep cards reflective without forcing confessions.';
  } else if (chaosScore >= 75) {
    fantitoLearned = 'This group prefers roasting over emotional honesty. Fantito will use that.';
  } else if (family) {
    fantitoLearned = 'Family-safe, but the group still wants chaos. Next round will get funnier without crossing lines.';
  } else {
    fantitoLearned = 'Not fully warmed up yet. Next round will open with humor before going deeper.';
  }

  // ---------- Unlocks (driven by signals) ----------
  const unlocks: string[] = [];
  if (skipRatio > 0.4) unlocks.push('Intensity lowered — too many skips');
  if ((stats.byType.pair || 0) >= 3 && !family) unlocks.push('More pair cards next round');
  if (flirty && flirtCount >= 4 && !family) unlocks.push('Flirty tension increased');
  if (deep && stats.dangerSkipped <= 1) unlocks.push('Deeper questions unlocked');
  if (chaotic) unlocks.push('Roast mode activated');
  if (nasty && stats.starred >= 2) unlocks.push('Group secrets mode unlocked');
  if (stats.dangerSkipped >= 3) unlocks.push('Safe alternatives added');
  if (consumptions.includes('drinkers')) unlocks.push('Less physical dares');
  if (unlocks.length === 0) unlocks.push('More indirect questions', 'Fresh card mix');
  const nextRoundAdjustments = unlocks.slice(0, 3);

  // ---------- Quote ----------
  const quotePool = [
    'I should probably not generate the next round… but I will.',
    'This group skipped too much for people with so many opinions.',
    'The chemistry is not confirmed. The data is being annoying.',
    'I saw the votes. Some of you are lying with confidence.',
    'Next round might need a lawyer.',
    'No diagnosis. Just suspicious patterns.',
  ];
  const fantitoQuote = quotePool[Math.floor(r() * quotePool.length)];

  // ---------- Title ----------
  const titlePool = [
    'Fantito analyzed the chaos. It’s not looking innocent.',
    'Session complete. The group exposed itself nicely.',
    'Fantito saw the votes, the skips, and the fake laughs.',
    'Damage report ready.',
    'The room has been read.',
  ];
  const sessionTitle = family
    ? 'Fantito kept it legal. Mostly.'
    : skipRatio > 0.5
      ? 'Lots of skips. Loud silence.'
      : titlePool[Math.floor(r() * titlePool.length)];

  const subtitle = `Round 1 report · ${stats.done} answered · ${stats.skipped} skipped · ${stats.starred} starred`;

  return {
    sessionTitle, subtitle,
    chaosScore, chaosLabel, dominantMood,
    tags, groupCallouts, playerRoles,
    fantitoLearned, nextRoundAdjustments, fantitoQuote,
    remainingInQueue: stats.remainingInQueue,
    dangerSkipped: stats.dangerSkipped,
    starred: stats.starred,
  };
}
