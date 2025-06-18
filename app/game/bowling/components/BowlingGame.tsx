"use client"

import { useEffect, useRef, useState } from "react"
import { useBowlingStore } from "../store"
import { BowlingCanvas } from "./BowlingCanvas"
import { GameControls } from "./GameControls"
import { GameStats } from "./GameStats"

export function BowlingGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  const {
    isPlaying,
    isPaused,
    gameStarted,
    gyroSupported,
    gyroPermission,
    updateTilt,
    detectGyroSupport
  } = useBowlingStore()

  // 确保组件已在客户端挂载
  useEffect(() => {
    setIsMounted(true)
    // 在客户端挂载后检测陀螺仪支持
    detectGyroSupport()
  }, [])

  // 自动启动游戏和权限请求
  useEffect(() => {
    if (!isMounted) return
    
    console.log('🎳 保龄球游戏初始化...')
    
    // 如果还没开始游戏，自动开始
    if (!gameStarted) {
      console.log('🚀 自动开始游戏')
      useBowlingStore.getState().startGame()
    }
  }, [gameStarted, isMounted])

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
        
        updateTilt(normalizedX, normalizedY)
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)
    console.log('✅ 陀螺仪监听器已添加')

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      console.log('🔄 陀螺仪监听器已移除')
    }
  }, [gyroSupported, gyroPermission, updateTilt, isMounted])

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