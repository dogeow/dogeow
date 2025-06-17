"use client"

import { Card } from '@/components/ui/card'
import { useMazeStore } from '../store'
import { useEffect, useState } from 'react'

export function GameStats() {
  const { 
    isPlaying, 
    isPaused, 
    gameWon, 
    level, 
    tiltX, 
    tiltY, 
    gyroSupported, 
    gyroPermission 
  } = useMazeStore()

  const [gameTime, setGameTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  // 计时器
  useEffect(() => {
    if (isPlaying && !isPaused && !gameWon) {
      if (!startTime) {
        setStartTime(Date.now())
      }
      
      const interval = setInterval(() => {
        if (startTime) {
          setGameTime(Math.floor((Date.now() - startTime) / 1000))
        }
      }, 1000)

      return () => clearInterval(interval)
    } else if (!isPlaying) {
      setStartTime(null)
      setGameTime(0)
    }
  }, [isPlaying, isPaused, gameWon, startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {/* 基本统计 */}
      <Card className="p-4 min-w-[120px] text-center">
        <div className="text-2xl font-bold text-blue-500">
          {level}
        </div>
        <div className="text-sm text-slate-600">关卡</div>
      </Card>

      <Card className="p-4 min-w-[120px] text-center">
        <div className="text-2xl font-bold text-green-500">
          {formatTime(gameTime)}
        </div>
        <div className="text-sm text-slate-600">时间</div>
      </Card>

      {/* 游戏状态 */}
      <Card className="p-4 min-w-[120px] text-center">
        <div className="text-2xl font-bold">
          {!isPlaying ? (
            <span className="text-slate-500">⏸️</span>
          ) : isPaused ? (
            <span className="text-yellow-500">⏸️</span>
          ) : gameWon ? (
            <span className="text-green-500">🎉</span>
          ) : (
            <span className="text-blue-500">▶️</span>
          )}
        </div>
        <div className="text-sm text-slate-600">
          {!isPlaying ? '待开始' : isPaused ? '暂停中' : gameWon ? '已完成' : '进行中'}
        </div>
      </Card>

      {/* 陀螺仪状态（仅在支持时显示） */}
      {gyroSupported && gyroPermission && (
        <Card className="p-4 min-w-[120px] text-center">
          <div className="text-lg font-bold text-purple-500">
            <div className="flex items-center justify-center space-x-2">
              <span>📱</span>
              <div className="text-xs">
                <div>X: {tiltX.toFixed(1)}</div>
                <div>Y: {tiltY.toFixed(1)}</div>
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-600">陀螺仪</div>
        </Card>
      )}
    </div>
  )
} 