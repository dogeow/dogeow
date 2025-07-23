import { useState, useEffect } from 'react'

interface GameStats {
  bestTime: number | null
  bestMoves: number | null
  gamesPlayed: number
}

interface GameStatsHook {
  stats: GameStats
  updateStats: (time: number, moves: number) => void
  resetStats: () => void
}

export function useGameStats(difficulty: 3 | 4 | 5): GameStatsHook {
  const storageKey = `picture-puzzle-stats-${difficulty}x${difficulty}`

  const [stats, setStats] = useState<GameStats>({
    bestTime: null,
    bestMoves: null,
    gamesPlayed: 0,
  })

  // 从 localStorage 加载统计数据
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsedStats = JSON.parse(saved)
        setStats(parsedStats)
      }
    } catch (error) {
      console.error('Failed to load game stats:', error)
    }
  }, [storageKey])

  // 更新统计数据
  const updateStats = (time: number, moves: number) => {
    setStats(prevStats => {
      const newStats = {
        bestTime: prevStats.bestTime === null ? time : Math.min(prevStats.bestTime, time),
        bestMoves: prevStats.bestMoves === null ? moves : Math.min(prevStats.bestMoves, moves),
        gamesPlayed: prevStats.gamesPlayed + 1,
      }

      // 保存到 localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(newStats))
      } catch (error) {
        console.error('Failed to save game stats:', error)
      }

      return newStats
    })
  }

  // 重置统计数据
  const resetStats = () => {
    const emptyStats = {
      bestTime: null,
      bestMoves: null,
      gamesPlayed: 0,
    }
    setStats(emptyStats)

    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to reset game stats:', error)
    }
  }

  return {
    stats,
    updateStats,
    resetStats,
  }
}
