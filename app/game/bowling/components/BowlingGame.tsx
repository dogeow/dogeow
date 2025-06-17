"use client"

import { useEffect, useRef } from "react"
import { useBowlingStore } from "../store"
import { BowlingCanvas } from "./BowlingCanvas"
import { GameControls } from "./GameControls"
import { GameStats } from "./GameStats"

export function BowlingGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const {
    isPlaying,
    isPaused,
    gameStarted,
    gyroSupported,
    gyroPermission,
    updateTilt,
    updatePhysics
  } = useBowlingStore()

  // 自动启动游戏和权限请求
  useEffect(() => {
    console.log('🎳 保龄球游戏初始化...')
    
    // 如果还没开始游戏，自动开始
    if (!gameStarted) {
      console.log('🚀 自动开始游戏')
      useBowlingStore.getState().startGame()
    }
  }, [gameStarted])

  // 陀螺仪监听
  useEffect(() => {
    if (!gyroSupported || !gyroPermission) {
      console.log('⚠️ 陀螺仪不可用:', { gyroSupported, gyroPermission })
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
  }, [gyroSupported, gyroPermission, updateTilt])

  // 游戏物理更新循环
  useEffect(() => {
    if (!isPlaying || isPaused) return

    let lastTime = performance.now()
    let animationId: number

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000 // 转换为秒
      lastTime = currentTime

      updatePhysics(deltaTime)
      
      animationId = requestAnimationFrame(gameLoop)
    }

    animationId = requestAnimationFrame(gameLoop)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isPlaying, isPaused, updatePhysics])

  return (
    <div ref={gameRef} className="flex flex-col items-center space-y-6">
      {/* 游戏统计 */}
      <GameStats />
      
      {/* 游戏画布 */}
      <div className="relative">
        <BowlingCanvas />
        
        {/* 陀螺仪状态指示 */}
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
      </div>
      
      {/* 游戏控制 */}
      <GameControls />
      
      {/* 使用说明 */}
      <div className="bg-amber-800/30 p-4 rounded-lg text-amber-100 text-sm max-w-md text-center">
        <h3 className="font-bold mb-2">🎮 控制说明</h3>
        <div className="space-y-1">
          <p>📱 <strong>手机：</strong>左右倾斜设备瞄准</p>
          <p>💻 <strong>电脑：</strong>拖动滑块调整角度</p>
          <p>🎳 <strong>投球：</strong>点击投球按钮发射</p>
          <p>🎯 <strong>目标：</strong>击倒所有球瓶得分</p>
        </div>
      </div>
    </div>
  )
} 