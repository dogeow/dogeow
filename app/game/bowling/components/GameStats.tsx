"use client"

import { useBowlingStore } from "../store"

export function GameStats() {
  const {
    currentFrame,
    currentThrow,
    totalScore,
    frameScores,
    isPlaying,
    gameStarted
  } = useBowlingStore()

  if (!gameStarted) {
    return (
      <div className="bg-amber-800/30 p-4 rounded-lg text-center">
        <div className="text-amber-100 text-lg">
          🎳 保龄球游戏
        </div>
        <div className="text-amber-200 text-sm mt-1">
          准备开始...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-800/30 p-4 rounded-lg space-y-3 w-full max-w-md">
      {/* 总分显示 */}
      <div className="text-center">
        <div className="text-3xl font-bold text-white">
          {totalScore}
        </div>
        <div className="text-amber-200 text-sm">总分</div>
      </div>
      
      {/* 当前轮次信息 */}
      <div className="flex justify-center items-center space-x-4 text-amber-100">
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {currentFrame}
          </div>
          <div className="text-xs">第几轮</div>
        </div>
        
        <div className="text-amber-300">|</div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-white">
            {currentThrow}
          </div>
          <div className="text-xs">第几投</div>
        </div>
      </div>
      
      {/* 轮次得分 */}
      <div className="grid grid-cols-5 gap-1 text-xs">
        {Array.from({ length: 10 }, (_, i) => (
          <div 
            key={i}
            className={`text-center p-1 rounded ${
              i + 1 === currentFrame 
                ? 'bg-amber-500 text-black' 
                : 'bg-amber-700/50 text-amber-100'
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

 