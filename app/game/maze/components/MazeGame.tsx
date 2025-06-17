"use client"

import { useEffect, useRef } from 'react'
import { useMazeStore } from '../store'
import { MazeCanvas } from './MazeCanvas'
import { GameControls } from './GameControls'
import { GameStats } from './GameStats'

export function MazeGame() {
  const {
    isPlaying,
    isPaused,
    gameWon,
    moveBall
  } = useMazeStore()

  const touchStartRef = useRef<{ x: number, y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // 键盘控制
  useEffect(() => {
    console.log('设置键盘监听器，当前状态:', { isPlaying, isPaused })
    
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('🎮 按键事件:', {
        key: event.key,
        code: event.code,
        游戏状态: { isPlaying, isPaused }
      })
      
      if (!isPlaying || isPaused) {
        console.log('❌ 游戏未开始或已暂停，忽略按键')
        return
      }

      const key = event.key.toLowerCase()
      const code = event.code.toLowerCase()
      
      console.log('🔍 处理按键:', { key, code })
      
      if (key === 'w' || code === 'keyw' || key === 'arrowup') {
        event.preventDefault()
        console.log('⬆️ 向上移动')
        moveBall('up')
      } else if (key === 's' || code === 'keys' || key === 'arrowdown') {
        event.preventDefault()
        console.log('⬇️ 向下移动')
        moveBall('down')
      } else if (key === 'a' || code === 'keya' || key === 'arrowleft') {
        event.preventDefault()
        console.log('⬅️ 向左移动')
        moveBall('left')
      } else if (key === 'd' || code === 'keyd' || key === 'arrowright') {
        event.preventDefault()
        console.log('➡️ 向右移动')
        moveBall('right')
      } else if (key === ' ' || code === 'space') {
        event.preventDefault()
        console.log('⏸️ 空格键 - 暂停/继续')
        if (isPaused) {
          useMazeStore.getState().resumeGame()
        } else {
          useMazeStore.getState().pauseGame()
        }
      } else {
        console.log('🚫 未识别的按键:', { key, code })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      console.log('🧹 清理键盘监听器')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPlaying, isPaused, moveBall])

  // 触摸手势控制
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleTouchStart = (event: TouchEvent) => {
      if (!isPlaying || isPaused) return
      
      event.preventDefault()
      const touch = event.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      }
      console.log('👆 触摸开始:', touchStartRef.current)
    }

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault() // 防止页面滚动
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (!isPlaying || isPaused || !touchStartRef.current) return
      
      event.preventDefault()
      const touch = event.changedTouches[0]
      const touchEnd = {
        x: touch.clientX,
        y: touch.clientY
      }
      
      const deltaX = touchEnd.x - touchStartRef.current.x
      const deltaY = touchEnd.y - touchStartRef.current.y
      
      console.log('👆 触摸结束:', { 
        start: touchStartRef.current, 
        end: touchEnd, 
        delta: { x: deltaX, y: deltaY } 
      })
      
      // 计算滑动距离和方向
      const minSwipeDistance = 30 // 最小滑动距离
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      if (absX < minSwipeDistance && absY < minSwipeDistance) {
        console.log('👆 滑动距离太短，忽略')
        touchStartRef.current = null
        return
      }
      
      // 判断主要滑动方向
      if (absX > absY) {
        // 水平滑动
        if (deltaX > 0) {
          console.log('👆 向右滑动')
          moveBall('right')
        } else {
          console.log('👆 向左滑动')
          moveBall('left')
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          console.log('👆 向下滑动')
          moveBall('down')
        } else {
          console.log('👆 向上滑动')
          moveBall('up')
        }
      }
      
      touchStartRef.current = null
    }

    // 添加触摸事件监听器
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPlaying, isPaused, moveBall])

  return (
    <div className="flex flex-col items-center space-y-6">
      <GameStats />
      
      <div className="relative" ref={canvasRef}>
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
        
        {/* 手势提示 */}
        {isPlaying && !isPaused && (
          <div className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded">
            滑动控制小球移动
          </div>
        )}
      </div>

      <GameControls />

      {/* 调试测试按钮 */}
      {isPlaying && (
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm text-slate-500">调试测试（点击测试移动）</div>
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <button 
              onClick={() => {
                console.log('🧪 测试向上移动')
                moveBall('up')
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              ↑
            </button>
            <div></div>
            
            <button 
              onClick={() => {
                console.log('🧪 测试向左移动')
                moveBall('left')
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              ←
            </button>
            <div></div>
            <button 
              onClick={() => {
                console.log('🧪 测试向右移动')
                moveBall('right')
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              →
            </button>
            
            <div></div>
            <button 
              onClick={() => {
                console.log('🧪 测试向下移动')
                moveBall('down')
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              ↓
            </button>
            <div></div>
          </div>
        </div>
      )}
    </div>
  )
} 