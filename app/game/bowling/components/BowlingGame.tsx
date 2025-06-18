"use client"

import { useEffect, useRef, useState } from "react"
import { useBowlingStore } from "../store"
import { BowlingCanvas } from "./BowlingCanvas"
import { GameControls } from "./GameControls"
import { GameStats } from "./GameStats"

export function BowlingGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const {
    gameStarted,
    gyroSupported,
    gyroPermission,
    startGame,
    detectGyroSupport
  } = useBowlingStore()

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 自动检测陀螺仪支持并启动游戏
  useEffect(() => {
    const init = async () => {
      await detectGyroSupport()
      if (!gameStarted) {
        startGame()
      }
    }
    init()
  }, [detectGyroSupport, gameStarted, startGame])

  // 陀螺仪监听
  useEffect(() => {
    if (!isMounted || !gyroSupported || !gyroPermission) {
      console.log('⚠️ 陀螺仪不可用:', { isMounted, gyroSupported, gyroPermission })
      return
    }

    console.log('🎯 启动陀螺仪监听')
    
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event
      if (beta !== null && gamma !== null) {
        // beta: 前后倾斜 (-180 到 180)
        // gamma: 左右倾斜 (-90 到 90)
        const normalizedX = Math.max(-1, Math.min(1, gamma / 45)) // 左右倾斜
        const normalizedY = Math.max(-1, Math.min(1, beta / 45)) // 前后倾斜
        
        useBowlingStore.getState().updateTilt(normalizedX, normalizedY)
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)
    console.log('✅ 陀螺仪监听器已添加')

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      console.log('🔄 陀螺仪监听器已移除')
    }
  }, [gyroSupported, gyroPermission, isMounted])

  // 物理更新现在由 BowlingCanvas 组件中的 Three.js 处理

  return (
    <div ref={gameRef} className="flex flex-col items-center space-y-6">
      {/* 游戏统计 */}
      <GameStats />
      
      {/* 游戏画布 */}
      <div className="relative">
        <BowlingCanvas />
        
        {/* 陀螺仪状态指示 - 只在客户端渲染完成后显示 */}
        {isMounted && (
          <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded text-sm">
            {gyroSupported ? (
              gyroPermission ? (
                <span className="text-green-400">🎯 陀螺仪已启用</span>
              ) : (
                <span className="text-yellow-400">⚠️ 等待权限...</span>
              )
            ) : (
              <span className="text-red-400">❌ 陀螺仪不支持</span>
            )}
          </div>
        )}
      </div>
      
      {/* 游戏控制 */}
      <GameControls />
    </div>
  )
} 