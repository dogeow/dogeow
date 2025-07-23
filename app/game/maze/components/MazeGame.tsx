'use client'

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
    resetGame,
  } = useMazeStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 将屏幕坐标转换为迷宫网格坐标
  const screenToMazeCoordinates = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return null

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()

      // 获取canvas内的相对坐标
      const x = clientX - rect.left
      const y = clientY - rect.top

      // 计算实际的迷宫渲染区域（与Canvas绘制逻辑保持一致）
      const canvasWidth = rect.width
      const canvasHeight = rect.height
      const cellSize = Math.min(canvasWidth, canvasHeight) / mazeSize
      const mazeRenderWidth = cellSize * mazeSize
      const mazeRenderHeight = cellSize * mazeSize

      // 计算迷宫在Canvas中的偏移（如果Canvas不是正方形）
      const offsetX = (canvasWidth - mazeRenderWidth) / 2
      const offsetY = (canvasHeight - mazeRenderHeight) / 2

      // 调整坐标到迷宫渲染区域
      const adjustedX = x - offsetX
      const adjustedY = y - offsetY

      // 转换为网格坐标
      const mazeX = Math.floor(adjustedX / cellSize)
      const mazeY = Math.floor(adjustedY / cellSize)

      // 如果调整后的坐标为负数，说明点击在迷宫区域外，返回null
      if (
        adjustedX < 0 ||
        adjustedY < 0 ||
        adjustedX >= mazeRenderWidth ||
        adjustedY >= mazeRenderHeight
      ) {
        return null
      }

      // 确保坐标在有效范围内
      const clampedX = Math.max(0, Math.min(mazeSize - 1, mazeX))
      const clampedY = Math.max(0, Math.min(mazeSize - 1, mazeY))

      console.log('🎯 坐标转换:', {
        click: { x: clientX, y: clientY },
        canvas: { x, y },
        canvasSize: { width: rect.width, height: rect.height },
        cellSize,
        mazeRender: { width: mazeRenderWidth, height: mazeRenderHeight },
        offset: { x: offsetX, y: offsetY },
        adjusted: { x: adjustedX, y: adjustedY },
        maze: { x: mazeX, y: mazeY },
        clamped: { x: clampedX, y: clampedY },
        mazeSize,
      })

      return { x: clampedX, y: clampedY }
    },
    [mazeSize]
  )

  // 处理画布点击
  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      console.log('🖱️ 画布点击事件:', { gameStarted, gameCompleted })

      if (!gameStarted) {
        // 如果游戏未开始，点击开始游戏
        console.log('🎮 点击开始游戏')
        startGame()
        return
      }

      if (gameCompleted) {
        return
      }

      const coordinates = screenToMazeCoordinates(event.clientX, event.clientY)
      if (!coordinates) return

      console.log('🎯 点击坐标:', coordinates)
      moveToPosition(coordinates.x, coordinates.y)
    },
    [gameStarted, gameCompleted, screenToMazeCoordinates, moveToPosition, startGame]
  )

  // 处理触摸点击
  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!gameStarted) {
        // 如果游戏未开始，点击开始游戏
        startGame()
        return
      }

      if (gameCompleted) {
        return
      }

      event.preventDefault()

      if (event.changedTouches.length > 0) {
        const touch = event.changedTouches[0]
        const coordinates = screenToMazeCoordinates(touch.clientX, touch.clientY)
        if (!coordinates) return

        // console.log('🎯 触摸坐标:', coordinates)
        moveToPosition(coordinates.x, coordinates.y)
      }
    },
    [gameStarted, gameCompleted, screenToMazeCoordinates, moveToPosition, startGame]
  )

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
      if (!gameStarted || gameCompleted) return

      // 如果正在自动移动，先中断
      if (isAutoMoving) {
        const { interruptAutoMove } = useMazeStore.getState()
        interruptAutoMove()
        // 短暂延迟后再执行键盘移动
        setTimeout(() => {
          const { moveBall } = useMazeStore.getState()
          executeKeyboardMove(event, moveBall)
        }, 100)
        return
      }

      const { moveBall } = useMazeStore.getState()
      executeKeyboardMove(event, moveBall)
    }

    const executeKeyboardMove = (
      event: KeyboardEvent,
      moveBall: (direction: 'up' | 'down' | 'left' | 'right') => void
    ) => {
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
      <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-4">
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
              className="rounded-lg bg-gray-500 px-4 py-2 text-sm text-white transition-colors hover:bg-gray-600"
            >
              重新开始
            </button>
          ) : (
            <button
              onClick={startGame}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600"
            >
              开始游戏
            </button>
          )}
        </div>
      </div>

      {/* 游戏画布 */}
      <MazeCanvas ref={canvasRef} />

      {/* 控制说明 */}
      <div className="mt-4 rounded-lg bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-800">游戏说明</h3>
        <div className="space-y-1 text-sm text-blue-700">
          <p>• 点击迷宫中的任意位置，小球会自动寻路到达</p>
          <p>• 移动过程中可以随时点击其他位置来中断并重新导航</p>
          <p>• 使用方向键或 WASD 键控制小球移动（会中断自动移动）</p>
          <p>• 将蓝色小球移动到右下角的红色终点即可获胜</p>
          <p>• 绿色方块是起点，红色方块是终点</p>
        </div>
      </div>

      {gameCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-8 text-center shadow-xl">
            <h3 className="mb-4 text-3xl font-bold text-green-600">🎉 恭喜通关！</h3>
            <div className="mb-6 space-y-2 text-gray-600">
              <p>
                移动次数: <span className="font-bold text-blue-600">{moves}</span>
              </p>
              <p>
                用时: <span className="font-bold text-green-600">{gameTime}秒</span>
              </p>
            </div>
            <button
              onClick={resetGame}
              className="rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-600"
            >
              再来一局
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
