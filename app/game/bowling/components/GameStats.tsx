'use client'

import { useBowlingStore } from '../store'

export function GameStats() {
  const { currentFrame, currentThrow, totalScore, frameScores, gameStarted } = useBowlingStore()

  if (!gameStarted) {
    return (
      <div className="rounded-lg bg-amber-800/30 p-4 text-center">
        <div className="text-lg text-amber-100">🎳 保龄球游戏</div>
        <div className="mt-1 text-sm text-amber-200">准备开始...</div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-3 rounded-lg bg-amber-800/30 p-4">
      {/* 总分显示 */}
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{totalScore}</div>
        <div className="text-sm text-amber-200">总分</div>
      </div>

      {/* 当前轮次信息 */}
      <div className="flex items-center justify-center space-x-4 text-amber-100">
        <div className="text-center">
          <div className="text-xl font-bold text-white">{currentFrame}</div>
          <div className="text-xs">第几轮</div>
        </div>

        <div className="text-amber-300">|</div>

        <div className="text-center">
          <div className="text-xl font-bold text-white">{currentThrow}</div>
          <div className="text-xs">第几投</div>
        </div>
      </div>

      {/* 轮次得分 */}
      <div className="grid grid-cols-5 gap-1 text-xs">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`rounded p-1 text-center ${
              i + 1 === currentFrame ? 'bg-amber-500 text-black' : 'bg-amber-700/50 text-amber-100'
            }`}
          >
            <div className="font-bold">{i + 1}</div>
            <div>{frameScores[i] || 0}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
