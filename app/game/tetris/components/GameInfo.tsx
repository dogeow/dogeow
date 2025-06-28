import React, { memo } from 'react'

interface GameInfoProps {
  score: number
  lines: number
  level: number
  bestScore: number
}

export const GameInfo = memo<GameInfoProps>(({ score, lines, level, bestScore }) => {
  return (
    <div className="bg-gray-900 p-3 rounded border border-gray-600 dark:border-green-500/30">
      <div className="space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-gray-300 dark:text-green-400">SCORE</span>
          <span className="text-white dark:text-green-300 font-bold">{score.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300 dark:text-green-400">LINES</span>
          <span className="text-white dark:text-green-300 font-bold">{lines}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300 dark:text-green-400">LEVEL</span>
          <span className="text-white dark:text-green-300 font-bold">{level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300 dark:text-green-400">HIGH</span>
          <span className="text-white dark:text-green-300 font-bold">{bestScore.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
})

GameInfo.displayName = 'GameInfo' 