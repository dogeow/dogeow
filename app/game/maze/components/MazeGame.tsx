"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useMazeStore } from '../store'
import { MazeCanvas } from './MazeCanvas'
import { GameControls } from './GameControls'
import { GameStats } from './GameStats'
import { GyroPermissionDialog } from './GyroPermissionDialog'

export function MazeGame() {
  const {
    isPlaying,
    isPaused,
    gameWon,
    updateBall,
    moveBall,
    updateTilt,
    gyroSupported,
    gyroPermission,
    requestGyroPermission
  } = useMazeStore()

  const animationFrameRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef<number>(0)

  // 游戏循环
  const gameLoop = useCallback((currentTime: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = currentTime
    }
    
    const deltaTime = Math.min((currentTime - lastTimeRef.current) / 1000, 0.016) // 限制最大帧时间
    lastTimeRef.current = currentTime

    updateBall(deltaTime)

    if (isPlaying && !isPaused && !gameWon) {
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }
  }, [isPlaying, isPaused, gameWon, updateBall])

  // 启动/停止游戏循环
  useEffect(() => {
    if (isPlaying && !isPaused && !gameWon) {
      lastTimeRef.current = 0
      animationFrameRef.current = requestAnimationFrame(gameLoop)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, isPaused, gameWon, gameLoop])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 总是输出按键信息进行调试
      console.log('按键事件:', event.key, event.code, '游戏状态:', { isPlaying, isPaused })
      
      if (!isPlaying || isPaused) {
        console.log('游戏未开始或已暂停，忽略按键')
        return
      }

      const force = 1
      const key = event.key.toLowerCase()
      const code = event.code.toLowerCase()
      
      console.log('处理按键:', { key, code })
      
      // 使用 if-else 替代 switch 以支持多种按键检测方式
      if (key === 'w' || code === 'keyw' || key === 'arrowup') {
        event.preventDefault()
        console.log('向上移动')
        moveBall(0, -force)
      } else if (key === 's' || code === 'keys' || key === 'arrowdown') {
        event.preventDefault()
        console.log('向下移动')
        moveBall(0, force)
      } else if (key === 'a' || code === 'keya' || key === 'arrowleft') {
        event.preventDefault()
        console.log('向左移动')
        moveBall(-force, 0)
      } else if (key === 'd' || code === 'keyd' || key === 'arrowright') {
        event.preventDefault()
        console.log('向右移动')
        moveBall(force, 0)
      } else if (key === ' ' || code === 'space') {
        event.preventDefault()
        console.log('空格键 - 暂停/继续')
        // 空格键暂停/继续
        if (isPaused) {
          useMazeStore.getState().resumeGame()
        } else {
          useMazeStore.getState().pauseGame()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, isPaused, moveBall])

  // 陀螺仪控制
  useEffect(() => {
    if (!gyroSupported || !gyroPermission) return

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (!isPlaying || isPaused) return

      // 获取设备倾斜角度
      const beta = event.beta || 0  // 前后倾斜 (-180 到 180)
      const gamma = event.gamma || 0 // 左右倾斜 (-90 到 90)

      // 将角度转换为标准化的力值
      const tiltX = Math.max(-1, Math.min(1, gamma / 30)) // 限制在-1到1之间
      const tiltY = Math.max(-1, Math.min(1, beta / 30))

      updateTilt(tiltX, tiltY)
    }

    window.addEventListener('deviceorientation', handleDeviceOrientation)
    return () => window.removeEventListener('deviceorientation', handleDeviceOrientation)
  }, [gyroSupported, gyroPermission, isPlaying, isPaused, updateTilt])

  // 检测陀螺仪支持
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      useMazeStore.getState().setSensitivity(0.3) // 初始化设置
    }
  }, [])

  return (
    <div className="flex flex-col items-center space-y-6">
      <GameStats />
      
      <div className="relative">
        <MazeCanvas />
        
        {/* 游戏暂停遮罩 */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="text-white text-2xl font-bold">游戏暂停</div>
          </div>
        )}
        
        {/* 胜利遮罩 */}
        {gameWon && (
          <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <div className="text-3xl font-bold mb-2">🎉 恭喜通关！</div>
              <div className="text-lg">准备挑战下一关吗？</div>
            </div>
          </div>
        )}
      </div>

      <GameControls />
      
      {/* 陀螺仪权限对话框 */}
      {gyroSupported && !gyroPermission && (
        <GyroPermissionDialog 
          onRequestPermission={requestGyroPermission}
        />
      )}

      {/* 控制说明 */}
      <div className="text-center text-sm text-slate-400 max-w-md">
        <p className="mb-2">
          <strong>PC端：</strong> 使用 WASD 或方向键控制小球移动
        </p>
        <p className="mb-2">
          <strong>手机端：</strong> 倾斜设备控制小球滚动方向
        </p>
        <p>
          <strong>目标：</strong> 将蓝色小球滚动到右下角的绿色终点
        </p>
      </div>
    </div>
  )
} 