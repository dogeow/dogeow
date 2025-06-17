"use client"

import { useBowlingStore } from "../store"

export function GameStats() {
  const {
    currentFrame,
    currentThrow,
    totalScore,
    frameScores,
    pins
  } = useBowlingStore()

  // 计算当前局击倒的球瓶数
  const knockedPinsCount = pins.filter(pin => pin.isKnockedDown).length
  const remainingPins = 10 - knockedPinsCount

  return (
    <div className="bg-amber-800/30 p-4 rounded-lg w-full max-w-md">
      <h3 className="text-white font-bold text-lg text-center mb-4">📊 游戏统计</h3>
      
      {/* 当前局信息 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-amber-700/30 p-3 rounded text-center">
          <div className="text-amber-100 text-sm">当前局</div>
          <div className="text-white text-xl font-bold">{currentFrame}/10</div>
        </div>
        
        <div className="bg-amber-700/30 p-3 rounded text-center">
          <div className="text-amber-100 text-sm">第几球</div>
          <div className="text-white text-xl font-bold">{currentThrow}/2</div>
        </div>
      </div>

      {/* 总分和当前局得分 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-600/30 p-3 rounded text-center">
          <div className="text-blue-100 text-sm">总分</div>
          <div className="text-white text-2xl font-bold">{totalScore}</div>
        </div>
        
        <div className="bg-green-600/30 p-3 rounded text-center">
          <div className="text-green-100 text-sm">本局得分</div>
          <div className="text-white text-xl font-bold">
            {frameScores[currentFrame - 1] || 0}
          </div>
        </div>
      </div>

      {/* 球瓶状态 */}
      <div className="bg-amber-700/30 p-3 rounded mb-4">
        <div className="text-amber-100 text-sm mb-2 text-center">球瓶状态</div>
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-red-400 text-lg font-bold">{knockedPinsCount}</div>
            <div className="text-red-300 text-xs">已击倒</div>
          </div>
          
          <div className="flex-1 mx-4">
            <div className="bg-amber-900 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-red-500 to-red-400 h-full transition-all duration-500"
                style={{ width: `${(knockedPinsCount / 10) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-white text-lg font-bold">{remainingPins}</div>
            <div className="text-amber-200 text-xs">剩余</div>
          </div>
        </div>
      </div>

      {/* 球瓶可视化 */}
      <div className="bg-amber-700/30 p-3 rounded">
        <div className="text-amber-100 text-sm mb-2 text-center">球瓶排列</div>
        <div className="flex flex-col items-center space-y-1">
          {/* 第一排 */}
          <div className="flex space-x-2">
            <PinIcon pinId={1} />
          </div>
          
          {/* 第二排 */}
          <div className="flex space-x-2">
            <PinIcon pinId={2} />
            <PinIcon pinId={3} />
          </div>
          
          {/* 第三排 */}
          <div className="flex space-x-2">
            <PinIcon pinId={4} />
            <PinIcon pinId={5} />
            <PinIcon pinId={6} />
          </div>
          
          {/* 第四排 */}
          <div className="flex space-x-2">
            <PinIcon pinId={7} />
            <PinIcon pinId={8} />
            <PinIcon pinId={9} />
            <PinIcon pinId={10} />
          </div>
        </div>
      </div>

      {/* 得分历史 */}
      <div className="mt-4 bg-amber-700/30 p-3 rounded">
        <div className="text-amber-100 text-sm mb-2 text-center">各局得分</div>
        <div className="grid grid-cols-5 gap-1 text-xs">
          {frameScores.slice(0, 10).map((score, index) => (
            <div
              key={index}
              className={`text-center p-1 rounded ${
                index === currentFrame - 1
                  ? 'bg-yellow-500 text-black font-bold'
                  : score > 0
                  ? 'bg-green-600/50 text-white'
                  : 'bg-gray-600/50 text-gray-300'
              }`}
            >
              {index + 1}: {score || '-'}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 球瓶图标组件
function PinIcon({ pinId }: { pinId: number }) {
  const { pins } = useBowlingStore()
  const pin = pins.find(p => p.id === pinId)
  const isKnockedDown = pin?.isKnockedDown || false

  return (
    <div
      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
        isKnockedDown
          ? 'bg-red-500 border-red-400 text-white transform rotate-45'
          : 'bg-white border-gray-300 text-black'
      }`}
    >
      {pinId}
    </div>
  )
} 