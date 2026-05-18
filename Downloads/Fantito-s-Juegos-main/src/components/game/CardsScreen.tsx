import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameCard } from '@/lib/game-types';
import { Language, ConsumptionType, GameMode, OnboardingState, VIBES } from '@/lib/onboarding-types';
import { isRTL } from '@/lib/translations';
import { RotateCcw, Sparkles, Settings, X } from 'lucide-react';
import { trackSkippedCard, trackDoneCard, trackStarredCard } from '@/lib/skip-tracking';
import { resetLiveFeedback } from '@/lib/session-feedback';
import { commitGameSession } from '@/lib/card-generation-service';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useAuth } from '@/hooks/useAuth';
import { cardToMood } from '@/lib/card-mood';
import { toast } from '@/hooks/use-toast';

import mascot from '@/assets/mascot.png';
import AtmosphereLayer from './AtmosphereLayer';
import CardShell from './CardShell';
import QuestionCard from './cards/QuestionCard';
import VoteCard from './cards/VoteCard';
import PairCard from './cards/PairCard';
import QuizCard from './cards/QuizCard';
import MinigameCard from './cards/MinigameCard';
import SessionRecapScreen, { SessionStats } from './SessionRecapScreen';
import WalletSheet from '../WalletSheet';

export interface PlayerLite { name: string; emoji: string }

interface CardsScreenProps {
  lang: Language;
  cards: GameCard[];
  vibes: string[];
  consumptions: ConsumptionType[];
  scene: string;
  /** Full session players with chosen emoji — used by vote/pair cards and the in-game settings recap */
  players?: PlayerLite[];
  /** Game mode — drives nasty18 secret-vote flow + family palette overrides */
  mode?: GameMode;
  /** Optional full onboarding state for the in-game recap */
  state?: OnboardingState;
  onRestart: () => void;
  onRelaunch: () => void;
  moreCardsLoading?: boolean;
  /** Called once when the player reaches card 6 — triggers lazy generation of the remaining 18 cards. */
  onLoadMore?: () => void;
}

const LABELS: Record<Language, { of: string; cardsReady: string; playAgain: string; relaunch: string; endTitle: string; endSub: string; swipeRight: string; swipeLeft: string; unlimited: string; gamesLeft: string }> = {
  en: { of: 'of', cardsReady: 'cards ready', playAgain: 'New game', relaunch: 'More cards', endTitle: 'Game over', endSub: 'What do you want to do?', swipeRight: 'Done', swipeLeft: 'Skip', unlimited: 'Unlimited', gamesLeft: 'games left' },
  es: { of: 'de', cardsReady: 'cartas listas', playAgain: 'Nuevo juego', relaunch: 'Más cartas', endTitle: 'Fin del juego', endSub: '¿Qué quieres hacer?', swipeRight: 'Hecho', swipeLeft: 'Saltar', unlimited: 'Ilimitado', gamesLeft: 'partidas' },
  de: { of: 'von', cardsReady: 'Karten bereit', playAgain: 'Neues Spiel', relaunch: 'Mehr Karten', endTitle: 'Spiel vorbei', endSub: 'Was möchtest du tun?', swipeRight: 'Fertig', swipeLeft: 'Weiter', unlimited: 'Unbegrenzt', gamesLeft: 'Spiele übrig' },
  fr: { of: 'sur', cardsReady: 'cartes prêtes', playAgain: 'Nouvelle partie', relaunch: 'Encore des cartes', endTitle: 'Fin de partie', endSub: 'Que veux-tu faire ?', swipeRight: 'Fait', swipeLeft: 'Passer', unlimited: 'Illimité', gamesLeft: 'parties restantes' },
  pt: { of: 'de', cardsReady: 'cartas prontas', playAgain: 'Novo jogo', relaunch: 'Mais cartas', endTitle: 'Fim do jogo', endSub: 'O que queres fazer?', swipeRight: 'Feito', swipeLeft: 'Pular', unlimited: 'Ilimitado', gamesLeft: 'jogos restantes' },
  it: { of: 'di', cardsReady: 'carte pronte', playAgain: 'Nuova partita', relaunch: 'Altre carte', endTitle: 'Fine partita', endSub: 'Cosa vuoi fare?', swipeRight: 'Fatto', swipeLeft: 'Salta', unlimited: 'Illimitato', gamesLeft: 'partite rimaste' },
  ar: { of: 'من', cardsReady: 'بطاقة جاهزة', playAgain: 'لعبة جديدة', relaunch: 'بطاقات أكثر', endTitle: 'انتهت اللعبة', endSub: 'ماذا تريد أن تفعل؟', swipeRight: 'تم', swipeLeft: 'تخطي', unlimited: 'غير محدود', gamesLeft: 'ألعاب متبقية' },
};

const CardsScreen = ({
  lang, cards, vibes, consumptions, scene, players = [], mode, state,
  onRestart, onRelaunch, moreCardsLoading, onLoadMore,
}: CardsScreenProps) => {
  const [showRecap, setShowRecap] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const playerNames = useMemo(() => players.map(p => p.name), [players]);
  const { isSubscribed, cardsRemaining, refresh } = useEntitlements();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState<SessionStats>({
    total: cards.length, done: 0, skipped: 0, starred: 0, dangerSkipped: 0,
    byType: {}, remainingInQueue: 0,
  });

  const refreshedRef = useRef(false);
  useEffect(() => {
    if (refreshedRef.current) return;
    if (!user || isSubscribed) return;
    refreshedRef.current = true;
    refresh().catch(() => {});
  }, [user, isSubscribed, refresh]);

  // Reset live feedback buffer at the start of each new session
  useEffect(() => { resetLiveFeedback(); }, []);

  // When batch 2 arrives, update the session total so the recap counts the full deck.
  useEffect(() => {
    setStats(s => (s.total === cards.length ? s : { ...s, total: cards.length }));
  }, [cards.length]);

  // The Fantitos rule: a session only "counts" as a played game from card 5.
  // Deduct credits at that moment (server-side via commitGameSession).
  const committedRef = useRef(false);
  useEffect(() => {
    if (committedRef.current) return;
    if (currentIndex < 4) return; // 0-indexed: index 4 = card 5
    committedRef.current = true;
    commitGameSession().then(res => {
      if (res.outOfCredits) {
        toast({ title: 'Out of cards', description: 'Top up to keep the chaos going.', variant: 'destructive' });
      }
      refresh().catch(() => {});
    });
  }, [currentIndex, refresh]);

  // Lazy-load the remaining 18 adaptive cards the moment the player reaches card 6.
  const loadMoreFiredRef = useRef(false);
  useEffect(() => {
    if (loadMoreFiredRef.current) return;
    if (currentIndex < 5) return; // 0-indexed: index 5 = card 6
    if (!onLoadMore) return;
    loadMoreFiredRef.current = true;
    onLoadMore();
  }, [currentIndex, onLoadMore]);

  const rtl = isRTL(lang);
  const labels = LABELS[lang] || LABELS.en;
  const isEnd = currentIndex >= cards.length;
  const card = !isEnd ? cards[currentIndex] : null;

  const mood = useMemo(
    () => card ? cardToMood(card, { vibes, consumptions, mode }) : cardToMood({ card_id: 0, type: 'question', question: '' }, { vibes, consumptions, mode }),
    [card, vibes, consumptions, mode],
  );

  const isDangerType = (c: GameCard) =>
    c.type === 'pair' || c.type === 'vote' || c.type === 'whowould' ||
    (typeof c.question === 'string' && c.question.length > 80);

  const next = useCallback(() => {
    setCurrentIndex(i => i + 1);
  }, []);



  const handleDone = useCallback(() => {
    if (card) {
      trackDoneCard(card, lang, vibes);
      setStats(s => ({ ...s, done: s.done + 1, byType: { ...s.byType, [card.type]: (s.byType[card.type] || 0) + 1 } }));
    }
    next();
  }, [card, lang, vibes, next]);

  const handleSkip = useCallback(() => {
    if (card) {
      trackSkippedCard(card, lang, vibes);
      setStats(s => ({
        ...s,
        skipped: s.skipped + 1,
        dangerSkipped: s.dangerSkipped + (isDangerType(card) ? 1 : 0),
        byType: { ...s.byType, [card.type]: (s.byType[card.type] || 0) + 1 },
      }));
    }
    next();
  }, [card, lang, vibes, next]);

  const handleStar = useCallback(() => {
    if (card) {
      trackStarredCard(card, lang, vibes);
      setStats(s => ({ ...s, starred: s.starred + 1, byType: { ...s.byType, [card.type]: (s.byType[card.type] || 0) + 1 } }));
    }
    next();
  }, [card, lang, vibes, next]);

  // Decide which body component + whether to disable shell swipe
  // Vote/whowould stay swipe-enabled so groups can skip a card without voting.
  // Quiz keeps swipe disabled because the answer flow needs the timer to run.
  // Quiz, minigame and (in nasty mode) vote/whowould run their own multi-step flow
  // and call onComplete themselves — disable swipe so they can't be skipped mid-flow.
  const isInteractive = !!card && (card.type === 'quiz' || card.type === 'minigame');

  if (isEnd) {
    return (
      <SessionRecapScreen
        lang={lang}
        cards={cards}
        stats={{ ...stats, remainingInQueue: Math.max(20, 60 - stats.done) }}
        players={playerNames}
        vibes={vibes}
        consumptions={consumptions}
        mode={mode}
        mood={mood}
        onRelaunch={onRelaunch}
        onRestart={onRestart}
        relaunchLoading={moreCardsLoading}
      />
    );
  }

  return (
    <div className={`relative min-h-[100dvh] max-w-[430px] mx-auto bg-background flex flex-col overflow-hidden ${rtl ? 'direction-rtl' : ''}`}>
      {/* Adaptive atmosphere */}
      <AtmosphereLayer mood={mood} />

      {/* Header */}
      <div className="relative flex items-center gap-3 px-5 pt-4 pb-2 z-10">
        <img src={mascot} alt="Fantito" className="w-10 h-10 object-cover rounded-lg border border-white/[0.08]" loading="lazy" width={512} height={512} />
        <div className="flex-1">
          <p className="font-display text-sm font-semibold text-foreground">
            {cards.length} {labels.cardsReady}
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.min(currentIndex + 1, cards.length)} {labels.of} {cards.length}
          </p>
        </div>
        {isSubscribed ? (
          <span className="flex items-center gap-1 text-[11px] font-display font-semibold text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" /> {labels.unlimited}
          </span>
        ) : cardsRemaining >= 25 ? (
          <button
            onClick={() => setShowWallet(true)}
            className="flex items-center gap-1 text-[11px] font-display font-semibold text-accent bg-accent/10 border border-accent/30 px-2 py-1 rounded-full hover:bg-accent/20 transition-colors"
          >
            {Math.floor(cardsRemaining / 25)} {labels.gamesLeft}
          </button>
        ) : (
          <button
            onClick={() => setShowWallet(true)}
            className="flex items-center gap-1 text-[11px] font-display font-semibold text-primary bg-primary/10 border border-primary/30 px-2 py-1 rounded-full hover:bg-primary/20 transition-colors"
          >
            0 {labels.gamesLeft}
          </button>
        )}
        <button
          onClick={() => setShowRecap(true)}
          aria-label="Game settings"
          className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full bg-card border border-white/[0.08]"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={onRestart}
          className="flex items-center gap-1.5 text-xs font-display font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full bg-card border border-white/[0.08]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {labels.playAgain}
        </button>
      </div>

      {showRecap && (
        <SettingsRecapSheet
          lang={lang}
          players={players}
          vibes={vibes}
          consumptions={consumptions}
          scene={scene}
          mode={mode}
          state={state}
          onClose={() => setShowRecap(false)}
        />
      )}

      <WalletSheet open={showWallet} onClose={() => setShowWallet(false)} />

      {/* Progress */}
      <div className="relative px-5 pb-2 z-10">
        <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(Math.min(currentIndex + 1, cards.length) / cards.length) * 100}%`,
              background: `linear-gradient(90deg, hsl(${mood.accent}), hsl(${mood.primary}))`,
            }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="relative flex-1 flex flex-col px-5 pb-4 z-10">
        {card && (
          <CardShell
            mood={mood}
            disableSwipe={isInteractive}
            swipeRightLabel={labels.swipeRight}
            swipeLeftLabel={labels.swipeLeft}
            onDone={handleDone}
            onSkip={handleSkip}
            onStar={handleStar}
          >
            {(card.type === 'vote' || card.type === 'whowould') ? (
              <VoteCard
                key={card.card_id}
                card={card}
                mood={mood}
                fallbackPlayers={players}
                mode={mode}
                lang={lang}
                onComplete={handleDone}
              />
            ) : card.type === 'pair' ? (
              <PairCard
                key={card.card_id}
                card={card}
                mood={mood}
                fallbackPlayers={players}
              />
            ) : card.type === 'quiz' ? (
              <QuizCard
                key={card.card_id}
                card={card}
                mood={mood}
                lang={lang}
                onComplete={handleDone}
              />
            ) : card.type === 'minigame' ? (
              <MinigameCard
                key={card.card_id}
                card={card}
                mood={mood}
                lang={lang}
                onComplete={handleDone}
              />
            ) : (
              <QuestionCard card={card} mood={mood} />
            )}
          </CardShell>
        )}
      </div>
    </div>
  );
};

const RECAP_I18N: Record<Language, { title: string; players: string; vibes: string; mode: string; consumption: string; scene: string; details: string; close: string; none: string }> = {
  en: { title: 'Game settings', players: 'Players', vibes: 'Vibes', mode: 'Mode', consumption: 'Consumption', scene: 'Scene', details: 'Details', close: 'Close', none: '—' },
  es: { title: 'Ajustes de la partida', players: 'Jugadores', vibes: 'Vibras', mode: 'Modo', consumption: 'Consumo', scene: 'Escena', details: 'Detalles', close: 'Cerrar', none: '—' },
  fr: { title: 'Paramètres de la partie', players: 'Joueurs', vibes: 'Ambiance', mode: 'Mode', consumption: 'Consommation', scene: 'Scène', details: 'Détails', close: 'Fermer', none: '—' },
  de: { title: 'Spieleinstellungen', players: 'Spieler', vibes: 'Stimmung', mode: 'Modus', consumption: 'Konsum', scene: 'Szene', details: 'Details', close: 'Schließen', none: '—' },
  pt: { title: 'Definições do jogo', players: 'Jogadores', vibes: 'Vibes', mode: 'Modo', consumption: 'Consumo', scene: 'Cena', details: 'Detalhes', close: 'Fechar', none: '—' },
  it: { title: 'Impostazioni partita', players: 'Giocatori', vibes: 'Vibe', mode: 'Modalità', consumption: 'Consumo', scene: 'Scena', details: 'Dettagli', close: 'Chiudi', none: '—' },
  ar: { title: 'إعدادات اللعبة', players: 'اللاعبون', vibes: 'الأجواء', mode: 'الوضع', consumption: 'الاستهلاك', scene: 'المشهد', details: 'تفاصيل', close: 'إغلاق', none: '—' },
};

const SettingsRecapSheet = ({
  lang, players, vibes, consumptions, scene, mode, state, onClose,
}: {
  lang: Language;
  players: PlayerLite[];
  vibes: string[];
  consumptions: ConsumptionType[];
  scene: string;
  mode?: GameMode;
  state?: OnboardingState;
  onClose: () => void;
}) => {
  const l = RECAP_I18N[lang] ?? RECAP_I18N.en;
  const vibeLabels = vibes
    .map(v => VIBES.find(vv => vv.id === v))
    .filter(Boolean)
    .map(v => `${v!.emoji} ${v!.labelKey}`)
    .join(' · ') || l.none;
  const consumptionLabel = consumptions.length
    ? consumptions.join(' · ') + (state?.consumptionLevel ? `  ·  ${state.consumptionLevel}/5` : '')
    : l.none;
  const detailsText = state?.freeTextDetails?.trim() || l.none;
  const sceneLabel = scene || l.none;
  const modeLabel = mode ?? 'normal';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="relative w-full max-w-md bg-card border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto shadow-soft"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-foreground">{l.title}</h2>
          <button onClick={onClose} aria-label={l.close} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <RecapRow label={l.players}>
          <div className="flex flex-wrap gap-1.5">
            {players.length === 0 && <span className="text-sm text-muted-foreground">{l.none}</span>}
            {players.map(p => (
              <span key={p.name} className="inline-flex items-center gap-1 text-xs font-display font-semibold bg-background/60 border border-white/[0.08] px-2 py-1 rounded-full text-foreground">
                <span className="text-sm leading-none">{p.emoji}</span>
                {p.name}
              </span>
            ))}
          </div>
        </RecapRow>

        <RecapRow label={l.mode}>
          <span className="text-sm font-display font-semibold text-foreground capitalize">{modeLabel}</span>
        </RecapRow>

        <RecapRow label={l.vibes}>
          <span className="text-sm text-foreground capitalize">{vibeLabels}</span>
        </RecapRow>

        <RecapRow label={l.consumption}>
          <span className="text-sm text-foreground capitalize">{consumptionLabel}</span>
        </RecapRow>

        <RecapRow label={l.scene}>
          <span className="text-sm text-foreground">{sceneLabel}</span>
        </RecapRow>

        <RecapRow label={l.details}>
          <span className="text-sm text-foreground whitespace-pre-wrap">{detailsText}</span>
        </RecapRow>
      </div>
    </div>
  );
};

const RecapRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="py-3 border-t border-white/[0.06] first:border-t-0">
    <p className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
    {children}
  </div>
);

export default CardsScreen;
