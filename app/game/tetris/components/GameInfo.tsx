import React, { memo } from 'react'

interface GameInfoProps {
  score: number
  lines: number
  level: number
  bestScore: number
}

export const GameInfo = memo<GameInfoProps>(({ score, lines, level, bestScore }) => {
  return (
    <div className="rounded bg-slate-950/90 p-3 shadow-sm">
      <div className="space-y-2 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-slate-300 dark:text-amber-300">SCORE</span>
          <span className="font-bold text-white dark:text-amber-200">{score.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300 dark:text-emerald-300">LINES</span>
          <span className="font-bold text-white dark:text-emerald-200">{lines}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300 dark:text-violet-300">LEVEL</span>
          <span className="font-bold text-white dark:text-violet-200">{level}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-300 dark:text-rose-300">HIGH</span>
          <span className="font-bold text-white dark:text-rose-200">
            {bestScore.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
})

GameInfo.displayName = 'GameInfo'
