import { useState, useCallback, useRef, useEffect } from 'react';
import { OnboardingState, Language, Vibe, Intensity, Player, Relation, ConsumptionType, GameMode, GameType, Timing } from '@/lib/onboarding-types';
import { GameCard, GenerationStatus } from '@/lib/game-types';
import { generateGameCards, generateRestOfCards } from '@/lib/card-generation-service';
import type { ComposedPrompt } from '@/lib/prompt-engine';
import { saveLuckPlayers } from '@/lib/luck-storage';
import { storage } from '@/lib/storage';
import StartScreen from './StartScreen';
import { useAuth } from '@/hooks/useAuth';
import PaywallModal from '../PaywallModal';
import { AgeGateModal, hasConfirmedAge } from './AgeGateModal';
import VibeSettingsScreen from './VibeSettingsScreen';
import SummaryScreen from './SummaryScreen';
import GeneratingScreen from '../game/GeneratingScreen';
import SwipeTutorialScreen from '../game/SwipeTutorialScreen';
import CardsScreen from '../game/CardsScreen';
import LuckMode from '../luck/LuckMode';

const INITIAL_STATE: OnboardingState = {
  language: 'en',
  players: [],
  relations: [],
  vibes: [],
  selectedConsumptions: [],
  consumptionLevel: 3,
  gameMode: 'normal',
  contextState: '',
  hostPlayerId: undefined,
  driverPlayerId: undefined,
  freeTextDetails: '',
  selectedGameTypes: [],
  timing: '',
  step: 0,
};

const OnboardingFlow = () => {
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>('idle');
  const [generatedCards, setGeneratedCards] = useState<GameCard[]>([]);
  const [showTutorial, setShowTutorial] = useState(true);
  const [moreCardsLoading, setMoreCardsLoading] = useState(false);
  const [luckMode, setLuckMode] = useState(false);
  const [showAnonPaywall, setShowAnonPaywall] = useState(false);
  const { user } = useAuth();
  const cardsRef = useRef<GameCard[]>([]);
  const promptRef = useRef<ComposedPrompt | null>(null);
  const restLoadedRef = useRef(false);
  const tutorialShownRef = useRef(false);
  const [showAgeGate, setShowAgeGate] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode | null>(null);
  // Persist player names for Luck tools
  useEffect(() => {
    if (state.players.length > 0) {
      saveLuckPlayers(state.players.map(p => p.name));
    }
  }, [state.players]);

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const updateState = useCallback(<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const next = () => setStep(state.step + 1);
  const back = () => setStep(Math.max(0, state.step - 1));

  const toggleVibe = (vibe: Vibe) => {
    const current = state.vibes;
    updateState('vibes', current.includes(vibe) ? current.filter(v => v !== vibe) : [...current, vibe]);
  };

  const handleStartGame = async () => {
    const isAnon = !user;
    if (isAnon) {
      // Use storage abstraction — not localStorage directly
      const stored = await storage.get('fantito:anonGamesPlayed');
      const played = Number(stored ?? '0');
      if (played >= 1) {
        setShowAnonPaywall(true);
        return;
      }
    }
    setGenerationStatus('generating');
    setMoreCardsLoading(true);
    tutorialShownRef.current = false;
    restLoadedRef.current = false;
    try {
      const result = await generateGameCards(state);
      cardsRef.current = result.cards;
      promptRef.current = result.prompt;
      setGeneratedCards(result.cards);
      setGenerationStatus('ready');
      setShowTutorial(true);
      tutorialShownRef.current = true;
      setMoreCardsLoading(!!result.hasMoreLoading);
      if (isAnon) {
        const stored = await storage.get('fantito:anonGamesPlayed');
        const played = Number(stored ?? '0');
        await storage.set('fantito:anonGamesPlayed', String(played + 1));
      }
    } catch {
      setGenerationStatus('error');
      setMoreCardsLoading(false);
    }
  };

  const handleLoadMoreCards = useCallback(async () => {
    if (restLoadedRef.current) return;
    if (!promptRef.current) return;
    restLoadedRef.current = true;
    setMoreCardsLoading(true);
    try {
      const all = await generateRestOfCards(state, promptRef.current, cardsRef.current);
      cardsRef.current = all;
      setGeneratedCards(all);
    } catch {
      // Keep batch 1 cards — user can still finish the round
    } finally {
      setMoreCardsLoading(false);
    }
  }, [state]);

  const handleRestart = () => {
    setState(INITIAL_STATE);
    setGenerationStatus('idle');
    setGeneratedCards([]);
    setMoreCardsLoading(false);
    tutorialShownRef.current = false;
  };

  const handleRelaunch = async () => {
    setGenerationStatus('generating');
    setMoreCardsLoading(true);
    tutorialShownRef.current = true;
    restLoadedRef.current = false;
    try {
      const result = await generateGameCards(state);
      cardsRef.current = result.cards;
      promptRef.current = result.prompt;
      setGeneratedCards(result.cards);
      setGenerationStatus('ready');
      setShowTutorial(false);
      setMoreCardsLoading(!!result.hasMoreLoading);
    } catch {
      setGenerationStatus('error');
      setMoreCardsLoading(false);
    }
  };

  const lang = state.language;

  const renderView = () => {
    if (luckMode) return <LuckMode onExit={() => setLuckMode(false)} />;

    if (generationStatus === 'generating') {
      return <GeneratingScreen lang={lang} state={state} />;
    }

    // NEW ERROR STATE BLOCK ADDED HERE
    if (generationStatus === 'error') {
      return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6">
          <img src="/fantito-loader.svg" className="w-24 h-24 opacity-60" alt="Loading error" />
          <p className="font-display font-bold text-lg text-foreground text-center">
            Fantito hit a wall 🧱
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Check your connection and try again.
          </p>
          <button onClick={handleRestart}
            className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-display font-bold">
            Try again
          </button>
        </div>
      );
    }

    if (generationStatus === 'ready' && generatedCards.length > 0) {
      if (showTutorial) {
        return <SwipeTutorialScreen lang={lang} onGotIt={() => setShowTutorial(false)} />;
      }
      return (
        <CardsScreen
          lang={lang}
          cards={generatedCards}
          vibes={state.vibes}
          consumptions={state.selectedConsumptions}
          scene={state.contextState}
          players={state.players.map(p => ({ name: p.name, emoji: p.emoji }))}
          state={state}
          mode={state.gameMode}
          onRestart={handleRestart}
          onRelaunch={handleRelaunch}
          moreCardsLoading={moreCardsLoading}
          onLoadMore={handleLoadMoreCards}
        />
      );
    }

    // 3-step flow: 0 = Start, 1 = Vibes+Players, 2 = Summary
    switch (state.step) {
      case 0:
        return (
          <StartScreen
            lang={lang}
            onStart={next}
            onLuck={() => setLuckMode(true)}
            onLanguageChange={(l: Language) => updateState('language', l)}
          />
        );
      case 1:
        return (
          <VibeSettingsScreen
            step={state.step}
            lang={lang}
            players={state.players}
            relations={state.relations}
            selectedVibes={state.vibes}
            selectedConsumptions={state.selectedConsumptions}
            consumptionLevel={state.consumptionLevel}
            gameMode={state.gameMode}
            contextValue={state.contextState}
            hostPlayerId={state.hostPlayerId}
            driverPlayerId={state.driverPlayerId}
            detailsValue={state.freeTextDetails}
            selectedGameTypes={state.selectedGameTypes}
            timing={state.timing}
            onPlayersChange={(p: Player[]) => updateState('players', p)}
            onRelationsChange={(r: Relation[]) => updateState('relations', r)}
            onToggleVibe={toggleVibe}
            onToggleConsumption={(c: ConsumptionType) => {
              const cur = state.selectedConsumptions;
              updateState('selectedConsumptions', cur.includes(c) ? cur.filter(x => x !== c) : [...cur, c]);
            }}
            onConsumptionLevelChange={(l: Intensity) => updateState('consumptionLevel', l)}
            onGameModeChange={async (m: GameMode) => {
  if (m === 'nasty18') {
    const confirmed = await hasConfirmedAge();
    if (!confirmed) {
      setPendingMode(m);
      setShowAgeGate(true);
      return;
    }
  }
  updateState('gameMode', m);
}}
            onContextChange={(v: string) => {
              updateState('contextState', v);
              if (v !== 'house-party' && v !== 'chill-night') updateState('hostPlayerId', undefined);
              if (v !== 'road-trip') updateState('driverPlayerId', undefined);
            }}
            onHostChange={(id?: string) => updateState('hostPlayerId', id)}
            onDriverChange={(id?: string) => updateState('driverPlayerId', id)}
            onDetailsChange={(v: string) => updateState('freeTextDetails', v)}
            onToggleGameType={(g: GameType) => {
              const cur = state.selectedGameTypes;
              updateState('selectedGameTypes', cur.includes(g) ? cur.filter(x => x !== g) : [...cur, g]);
            }}
            onClearGameTypes={() => updateState('selectedGameTypes', [])}
            onTimingChange={(v: Timing) => updateState('timing', v)}
            onNext={next}
            onBack={back}
          />
        );
      case 2:
        return (
          <SummaryScreen
            step={state.step}
            lang={lang}
            state={state}
            onBack={back}
            onStart={handleStartGame}
            onJumpToStep={(s: number) => setStep(s)}
          />
        );
      default:
        return <StartScreen lang={lang} onStart={() => setStep(0)} onLuck={() => setLuckMode(true)} />;
    }
  };

  return (
    <>
      {renderView()}
      <PaywallModal
        open={showAnonPaywall}
        onClose={() => setShowAnonPaywall(false)}
        reason="You've used your free game! Sign up to unlock 5 free games (125 cards) and keep the chaos going. Luck games stay free forever."
      />
{showAgeGate && (
  <AgeGateModal
    onConfirm={() => {
      setShowAgeGate(false);
      if (pendingMode) updateState('gameMode', pendingMode);
      setPendingMode(null);
    }}
    onCancel={() => {
      setShowAgeGate(false);
      setPendingMode(null);
    }}
  />
)}
    </>
  );
};

export default OnboardingFlow;