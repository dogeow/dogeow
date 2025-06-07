import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MinesweeperStats {
  easy: { gamesPlayed: number; gamesWon: number; bestTime: number }
  medium: { gamesPlayed: number; gamesWon: number; bestTime: number }
  hard: { gamesPlayed: number; gamesWon: number; bestTime: number }
}

interface MinesweeperState {
  stats: MinesweeperStats
  updateStats: (difficulty: 'easy' | 'medium' | 'hard', won: boolean, time?: number) => void
  resetStats: () => void
}

const initialStats: MinesweeperStats = {
  easy: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 },
  medium: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 },
  hard: { gamesPlayed: 0, gamesWon: 0, bestTime: 0 }
}

export const useMinesweeperStore = create<MinesweeperState>()(
  persist(
    (set) => ({
      stats: initialStats,
      updateStats: (difficulty: 'easy' | 'medium' | 'hard', won: boolean, time?: number) => {
        set((state) => {
          const newStats = { ...state.stats }
          newStats[difficulty].gamesPlayed += 1
          
          if (won) {
            newStats[difficulty].gamesWon += 1
            if (time && (newStats[difficulty].bestTime === 0 || time < newStats[difficulty].bestTime)) {
              newStats[difficulty].bestTime = time
            }
          }
          
          return { stats: newStats }
        })
      },
      resetStats: () => set({ stats: initialStats }),
    }),
    {
      name: 'minesweeper-storage',
    }
  )
) 