import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TetrisStats {
  bestScore: number
  gamesPlayed: number
  totalLinesCleared: number
  totalPlayTime: number // 总游戏时间（秒）
  averageScore: number
  highestLevel: number
  sessionStats: {
    gamesPlayed: number
    bestScore: number
    totalLines: number
  }
}

interface TetrisState extends TetrisStats {
  setBestScore: (score: number) => void
  incrementGamesPlayed: () => void
  addLinesCleared: (lines: number) => void
  addPlayTime: (seconds: number) => void
  updateHighestLevel: (level: number) => void
  updateSessionStats: (score: number) => void
  resetStats: () => void
  resetSessionStats: () => void
}

const initialStats: TetrisStats = {
  bestScore: 0,
  gamesPlayed: 0,
  totalLinesCleared: 0,
  totalPlayTime: 0,
  averageScore: 0,
  highestLevel: 1,
  sessionStats: {
    gamesPlayed: 0,
    bestScore: 0,
    totalLines: 0,
  },
}

export const useTetrisStore = create<TetrisState>()(
  persist(
    (set, get) => ({
      ...initialStats,

      setBestScore: (score: number) => {
        const currentBest = get().bestScore
        if (score > currentBest) {
          set({ bestScore: score })
        }
      },

      incrementGamesPlayed: () => {
        const state = get()
        const newGamesPlayed = state.gamesPlayed + 1
        const newAverageScore =
          state.gamesPlayed > 0
            ? Math.round(
                (state.averageScore * state.gamesPlayed + state.bestScore) / newGamesPlayed
              )
            : state.bestScore

        set({
          gamesPlayed: newGamesPlayed,
          averageScore: newAverageScore,
          sessionStats: {
            ...state.sessionStats,
            gamesPlayed: state.sessionStats.gamesPlayed + 1,
          },
        })
      },

      addLinesCleared: (lines: number) => {
        const state = get()
        set({
          totalLinesCleared: state.totalLinesCleared + lines,
          sessionStats: {
            ...state.sessionStats,
            totalLines: state.sessionStats.totalLines + lines,
          },
        })
      },

      addPlayTime: (seconds: number) => {
        const state = get()
        set({ totalPlayTime: state.totalPlayTime + seconds })
      },

      updateHighestLevel: (level: number) => {
        const currentHighest = get().highestLevel
        if (level > currentHighest) {
          set({ highestLevel: level })
        }
      },

      updateSessionStats: (score: number) => {
        const state = get()
        const currentSessionBest = state.sessionStats.bestScore
        set({
          sessionStats: {
            ...state.sessionStats,
            bestScore: score > currentSessionBest ? score : currentSessionBest,
          },
        })
      },

      resetStats: () => set(initialStats),

      resetSessionStats: () => {
        set({
          sessionStats: {
            gamesPlayed: 0,
            bestScore: 0,
            totalLines: 0,
          },
        })
      },
    }),
    {
      name: 'tetris-game-storage',
      // 只持久化非会话数据
      partialize: state => ({
        bestScore: state.bestScore,
        gamesPlayed: state.gamesPlayed,
        totalLinesCleared: state.totalLinesCleared,
        totalPlayTime: state.totalPlayTime,
        averageScore: state.averageScore,
        highestLevel: state.highestLevel,
      }),
    }
  )
)
