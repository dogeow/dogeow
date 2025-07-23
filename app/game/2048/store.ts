import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Game2048State {
  bestScore: number
  gamesPlayed: number
  gamesWon: number
  setBestScore: (score: number) => void
  incrementGamesPlayed: () => void
  incrementGamesWon: () => void
  resetStats: () => void
}

export const useGame2048Store = create<Game2048State>()(
  persist(
    (set, get) => ({
      bestScore: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      setBestScore: (score: number) => {
        const currentBest = get().bestScore
        if (score > currentBest) {
          set({ bestScore: score })
        }
      },
      incrementGamesPlayed: () =>
        set(state => ({
          gamesPlayed: state.gamesPlayed + 1,
        })),
      incrementGamesWon: () =>
        set(state => ({
          gamesWon: state.gamesWon + 1,
        })),
      resetStats: () =>
        set({
          bestScore: 0,
          gamesPlayed: 0,
          gamesWon: 0,
        }),
    }),
    {
      name: '2048-game-storage',
    }
  )
)
