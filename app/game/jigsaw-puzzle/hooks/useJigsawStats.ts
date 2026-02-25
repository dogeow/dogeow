import { useState, useEffect } from 'react'

interface JigsawStats {
  bestTime: number | null
  gamesCompleted: number
  totalPiecesPlaced: number
}

interface JigsawStatsHook {
  stats: JigsawStats
  updateStats: (time: number, piecesCount: number) => void
  resetStats: () => void
}

export function useJigsawStats(difficulty: number): JigsawStatsHook {
  const storageKey = `jigsaw-puzzle-stats-${difficulty}x${difficulty}`

  const [stats, setStats] = useState<JigsawStats>({
    bestTime: null,
    gamesCompleted: 0,
    totalPiecesPlaced: 0,
  })

  // 从 localStorage 加载统计数据

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsedStats = JSON.parse(saved)

        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage 初始化
        setStats(parsedStats)
      }
    } catch (error) {
      console.error('Failed to load jigsaw stats:', error)
    }
  }, [storageKey])

  // 更新统计数据
  const updateStats = (time: number, piecesCount: number) => {
    setStats(prevStats => {
      const newStats = {
        bestTime: prevStats.bestTime === null ? time : Math.min(prevStats.bestTime, time),
        gamesCompleted: prevStats.gamesCompleted + 1,
        totalPiecesPlaced: prevStats.totalPiecesPlaced + piecesCount,
      }

      // 保存到 localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(newStats))
      } catch (error) {
        console.error('Failed to save jigsaw stats:', error)
      }

      return newStats
    })
  }

  // 重置统计数据
  const resetStats = () => {
    const emptyStats = {
      bestTime: null,
      gamesCompleted: 0,
      totalPiecesPlaced: 0,
    }
    setStats(emptyStats)

    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to reset jigsaw stats:', error)
    }
  }

  return {
    stats,
    updateStats,
    resetStats,
  }
}
