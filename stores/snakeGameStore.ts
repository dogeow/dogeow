import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SnakeGameState {
  bestScore: number
  gamesPlayed: number
  totalFoodEaten: number
  setBestScore: (score: number) => void
  incrementGamesPlayed: () => void
  addFoodEaten: (count: number) => void
  resetStats: () => void
}

export const useSnakeGameStore = create<SnakeGameState>()(
  persist(
    (set, get) => ({
      bestScore: 0,
      gamesPlayed: 0,
      totalFoodEaten: 0,
      setBestScore: (score: number) => {
        const currentBest = get().bestScore
        if (score > currentBest) {
          set({ bestScore: score })
        }
      },
      incrementGamesPlayed: () => set((state) => ({ 
        gamesPlayed: state.gamesPlayed + 1 
      })),
      addFoodEaten: (count: number) => set((state) => ({ 
        totalFoodEaten: state.totalFoodEaten + count 
      })),
      resetStats: () => set({ 
        bestScore: 0, 
        gamesPlayed: 0, 
        totalFoodEaten: 0 
      }),
    }),
    {
      name: 'snake-game-storage',
    }
  )
) 