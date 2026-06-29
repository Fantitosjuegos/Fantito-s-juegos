import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface GameState {
  chaosLevel: number;
  history: string[];
  setChaosLevel: (level: number) => void;
  addHistoryEvent: (event: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      chaosLevel: 1,
      history: [],
      setChaosLevel: (level) => set({ chaosLevel: level }),
      addHistoryEvent: (event) => set((state) => ({ 
        history: [...state.history, event] 
      })),
      resetGame: () => set({ chaosLevel: 1, history: [] }),
    }),
    {
      name: 'chaos-storage', // This is the key that will appear in your browser's LocalStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);