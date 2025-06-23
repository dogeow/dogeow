"use client"

import { useEffect, useCallback, useRef } from 'react'
import { useMazeStore } from '../store'
import MazeCanvas from './MazeCanvas'

export default function MazeGame() {
  const {
    moveToPosition,
    gameStarted,
    gameCompleted,
    isAutoMoving,
    mazeSize,
    moves,
    gameTime,
    startGame,
    resetGame
  } = useMazeStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 将屏幕坐标转换为迷宫网格坐标
  const screenToMazeCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return null
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // 获取canvas内的相对坐标
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    // 转换为标准化坐标 (0 到 1)
    const normalizedX = x / rect.width
    const normalizedY = y / rect.height
    
    // 转换为迷宫网格坐标 - 使用四舍五入获得更准确的映射
    const mazeX = Math.round(normalizedX * mazeSize - 0.5)
    const mazeY = Math.round(normalizedY * mazeSize - 0.5)
    
    // 确保坐标在有效范围内
    const clampedX = Math.max(0, Math.min(mazeSize - 1, mazeX))
    const clampedY = Math.max(0, Math.min(mazeSize - 1, mazeY))
    
    console.log('🎯 坐标转换:', {
      click: { x: clientX, y: clientY },
      canvas: { x, y },
      canvasSize: { width: rect.width, height: rect.height },
      normalized: { x: normalizedX, y: normalizedY },
      maze: { x: mazeX, y: mazeY },
      clamped: { x: clampedX, y: clampedY },
      mazeSize
    })
    
    return { x: clampedX, y: clampedY }
  }, [mazeSize])

  // 处理画布点击
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    console.log('🖱️ 画布点击事件:', { gameStarted, gameCompleted, isAutoMoving })
    
    if (!gameStarted || gameCompleted || isAutoMoving) {
      // 如果游戏未开始，点击开始游戏
      if (!gameStarted) {
        console.log('🎮 点击开始游戏')
        startGame()
      }
      return
    }

    const coordinates = screenToMazeCoordinates(event.clientX, event.clientY)
    if (!coordinates) return

    console.log('🎯 点击坐标:', coordinates)
    moveToPosition(coordinates.x, coordinates.y)
  }, [gameStarted, gameCompleted, isAutoMoving, screenToMazeCoordinates, moveToPosition, startGame])

  // 处理触摸点击
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!gameStarted || gameCompleted || isAutoMoving) {
      // 如果游戏未开始，点击开始游戏
      if (!gameStarted) {
        startGame()
      }
      return
    }

    event.preventDefault()
    
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0]
      const coordinates = screenToMazeCoordinates(touch.clientX, touch.clientY)
      if (!coordinates) return

      console.log('🎯 触摸坐标:', coordinates)
      moveToPosition(coordinates.x, coordinates.y)
    }
  }, [gameStarted, gameCompleted, isAutoMoving, screenToMazeCoordinates, moveToPosition, startGame])

  // 绑定事件监听器
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('click', handleCanvasClick)
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleCanvasClick, handleTouchEnd])

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameStarted || gameCompleted || isAutoMoving) return

      const { moveBall } = useMazeStore.getState()
      
      switch (event.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          event.preventDefault()
          moveBall('up')
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          event.preventDefault()
          moveBall('down')
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          event.preventDefault()
          moveBall('left')
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          event.preventDefault()
          moveBall('right')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStarted, gameCompleted, isAutoMoving])

  return (
    <div className="relative w-full">
      {/* 游戏信息 */}
      <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-6">
          <div className="text-sm">
            <span className="text-gray-600">移动次数:</span>
            <span className="ml-2 font-bold text-blue-600">{moves}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">用时:</span>
            <span className="ml-2 font-bold text-green-600">{gameTime}秒</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {gameStarted ? (
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              重新开始
            </button>
          ) : (
            <button
              onClick={startGame}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              开始游戏
            </button>
          )}
        </div>
      </div>

      {/* 游戏画布 */}
      <MazeCanvas ref={canvasRef} />

      {/* 控制说明 */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">游戏说明</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• 点击迷宫中的任意位置，小球会自动寻路到达</p>
          <p>• 使用方向键或 WASD 键控制小球移动</p>
          <p>• 将蓝色小球移动到右下角的红色终点即可获胜</p>
          <p>• 绿色方块是起点，红色方块是终点</p>
        </div>
      </div>
      
      {gameCompleted && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg p-8 text-center shadow-xl">
            <h3 className="text-3xl font-bold mb-4 text-green-600">🎉 恭喜通关！</h3>
            <div className="text-gray-600 space-y-2 mb-6">
              <p>移动次数: <span className="font-bold text-blue-600">{moves}</span></p>
              <p>用时: <span className="font-bold text-green-600">{gameTime}秒</span></p>
            </div>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 