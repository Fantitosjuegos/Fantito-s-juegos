/**
 * i18n/types.ts
 * -------------
 * Defines the shape every language object must satisfy.
 * If you add a new key here, TypeScript will flag every language
 * file that hasn't provided a translation yet.
 */

export type TranslationKeys = {
  // ── Start screen ────────────────────────────────────────────────────────────
  partyGames: string;
  tagline: string;
  letsGo: string;
  // ── Language picker ─────────────────────────────────────────────────────────
  chooseLanguage: string;
  // ── Players & Group ─────────────────────────────────────────────────────────
  addPlayers: string;
  playerName: string;
  addAtLeast2: string;
  groupType: string;
  groupOptional: string;
  continuePlayers: string;
  // ── Group types ─────────────────────────────────────────────────────────────
  friends: string;
  couple: string;
  coworkers: string;
  strangers: string;
  family: string;
  // ── Relations ───────────────────────────────────────────────────────────────
  relationships: string;
  relationsOptional: string;
  relationsAdvice: string;
  relationsHowTo: string;
  tapToLink: string;
  nowTap: string;
  lovers: string;
  beef: string;
  crush: string;
  bestFriends: string;
  friendsRel: string;
  familyRel: string;
  strangersRel: string;
  roommates: string;
  coworkersRel: string;
  longTerm: string;
  shortTerm: string;
  skip: string;
  flirtyRel?: string;
  complicatedRel?: string;
  enemiesRel?: string;
  // ── Family roles ────────────────────────────────────────────────────────────
  familyBrother?: string;
  familySister?: string;
  familyCousin?: string;
  familyMother?: string;
  familyFather?: string;
  familyTwins?: string;
  pickRelationship?: string;
  pickFamilyRole?: string;
  removeLink?: string;
  cancel?: string;
  tapTwoPlayers?: string;
  // ── CTA ─────────────────────────────────────────────────────────────────────
  launchChaos: string;
  launchChaosSub: string;
  // ── Vibe & Mode ─────────────────────────────────────────────────────────────
  setTheVibe: string;
  gameMode: string;
  // ── Game Modes ──────────────────────────────────────────────────────────────
  normalMode: string;
  normalModeDesc: string;
  nasty18Mode: string;
  nasty18ModeDesc: string;
  familyMode: string;
  familyModeDesc: string;
  // ── Vibes ───────────────────────────────────────────────────────────────────
  chill: string;
  wild: string;
  flirty: string;
  deep: string;
  chaotic: string;
  // ── Play modes ──────────────────────────────────────────────────────────────
  classic: string;
  classicDesc: string;
  rapidFire: string;
  rapidDesc: string;
  custom: string;
  customDesc: string;
  // ── Intensity & Consumption ─────────────────────────────────────────────────
  intensityLevel: string;
  consumption: string;
  consumptionDesc: string;
  drinkers: string;
  smokers: string;
  chillers: string;
  // ── Intensity labels ────────────────────────────────────────────────────────
  mild: string;
  easy: string;
  medium: string;
  spicy: string;
  extreme: string;
  // ── Context & Details ───────────────────────────────────────────────────────
  whatsTheScene: string;
  extraDetails: string;
  detailsPlaceholder: string;
  // ── Context options ─────────────────────────────────────────────────────────
  houseParty: string;
  atABar: string;
  roadTrip: string;
  pregame: string;
  chillNight: string;
  vacation: string;
  afterparty: string;
  coffeeShop: string;
  // ── Quick chips ─────────────────────────────────────────────────────────────
  birthday: string;
  firstTime: string;
  reunion: string;
  someoneHasCrush: string;
  justVibing: string;
  // ── Summary ─────────────────────────────────────────────────────────────────
  allSet: string;
  gameSetup: string;
  startGame: string;
  players: string;
  vibes: string;
  mode: string;
  intensity: string;
  group: string;
  relations: string;
  scene: string;
  details: string;
  // ── Common ──────────────────────────────────────────────────────────────────
  continue_: string;
};