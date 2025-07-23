import React, { memo } from 'react'

interface GameInfoProps {
  score: number
  lines: number
  level: number
  bestScore: number
}

export const GameInfo = memo<GameInfoProps>(({ score, lines, level, bestScore }) => {
  return (
    <div className="rounded border border-gray-600 bg-gray-900 p-3 dark:border-green-500/30">
      <div className="space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-gray-300 dark:text-green-400">SCORE</span>
          <span className="font-bold text-white dark:text-green-300">{score.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300 dark:text-green-400">LINES</span>
          <span className="font-bold text-white dark:text-green-300">{lines}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300 dark:text-green-400">LEVEL</span>
          <span className="font-bold text-white dark:text-green-300">{level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300 dark:text-green-400">HIGH</span>
          <span className="font-bold text-white dark:text-green-300">
            {bestScore.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
})

GameInfo.displayName = 'GameInfo'
