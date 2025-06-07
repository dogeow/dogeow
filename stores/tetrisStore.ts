import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TetrisState {
  bestScore: number
  gamesPlayed: number
  totalLinesCleared: number
  setBestScore: (score: number) => void
  incrementGamesPlayed: () => void
  addLinesCleared: (lines: number) => void
  resetStats: () => void
}

export const useTetrisStore = create<TetrisState>()(
  persist(
    (set, get) => ({
      bestScore: 0,
      gamesPlayed: 0,
      totalLinesCleared: 0,
      setBestScore: (score: number) => {
        const currentBest = get().bestScore
        if (score > currentBest) {
          set({ bestScore: score })
        }
      },
      incrementGamesPlayed: () => set((state) => ({ 
        gamesPlayed: state.gamesPlayed + 1 
      })),
      addLinesCleared: (lines: number) => set((state) => ({ 
        totalLinesCleared: state.totalLinesCleared + lines 
      })),
      resetStats: () => set({ 
        bestScore: 0, 
        gamesPlayed: 0, 
        totalLinesCleared: 0
      }),
    }),
    {
      name: 'tetris-game-storage',
    }
  )
) 