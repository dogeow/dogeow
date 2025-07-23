'use client'

import { useEffect, useRef, forwardRef, useCallback } from 'react'
import { useMazeStore } from '../store'

const MazeCanvas = forwardRef<HTMLCanvasElement>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { maze, ball, mazeSize, gameStarted } = useMazeStore()

  // console.log('🎨 MazeCanvas 渲染状态:', {
  //   gameStarted,
  //   mazeLength: maze.length,
  //   ballPosition: ball,
  //   mazeSize
  // })

  // 合并内部ref和外部ref
  const setRef = (element: HTMLCanvasElement | null) => {
    canvasRef.current = element
    if (typeof ref === 'function') {
      ref(element)
    } else if (ref) {
      ref.current = element
    }
  }

  // 绘制迷宫
  const drawMaze = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置canvas尺寸
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const canvasWidth = rect.width
    const canvasHeight = rect.height
    const cellSize = Math.min(canvasWidth, canvasHeight) / mazeSize

    // 计算迷宫在Canvas中的实际偏移
    const mazeRenderSize = cellSize * mazeSize
    const offsetX = (canvasWidth - mazeRenderSize) / 2
    const offsetY = (canvasHeight - mazeRenderSize) / 2

    // console.log('🎨 Canvas尺寸:', {
    //   rect: { width: rect.width, height: rect.height },
    //   canvas: { width: canvas.width, height: canvas.height },
    //   cellSize,
    //   mazeSize
    // })

    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // 绘制背景
    ctx.fillStyle = '#f0f8ff'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // 如果迷宫还没生成，只绘制背景
    if (maze.length === 0) {
      // console.log('🎨 迷宫未生成，只绘制背景')
      return
    }

    // 绘制迷宫网格
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2

    for (let y = 0; y < mazeSize; y++) {
      for (let x = 0; x < mazeSize; x++) {
        const cell = maze[y][x]
        const cellX = x * cellSize + offsetX
        const cellY = y * cellSize + offsetY

        // 绘制墙壁
        ctx.beginPath()

        // 顶部墙壁
        if (cell.top) {
          ctx.moveTo(cellX, cellY)
          ctx.lineTo(cellX + cellSize, cellY)
        }

        // 右侧墙壁
        if (cell.right) {
          ctx.moveTo(cellX + cellSize, cellY)
          ctx.lineTo(cellX + cellSize, cellY + cellSize)
        }

        // 底部墙壁
        if (cell.bottom) {
          ctx.moveTo(cellX, cellY + cellSize)
          ctx.lineTo(cellX + cellSize, cellY + cellSize)
        }

        // 左侧墙壁
        if (cell.left) {
          ctx.moveTo(cellX, cellY)
          ctx.lineTo(cellX, cellY + cellSize)
        }

        ctx.stroke()
      }
    }

    // 绘制起点标记
    ctx.fillStyle = '#4ade80'
    ctx.fillRect(offsetX + cellSize * 0.1, offsetY + cellSize * 0.1, cellSize * 0.8, cellSize * 0.8)

    // 绘制终点标记
    ctx.fillStyle = '#ef4444'
    const endX = (mazeSize - 1) * cellSize + offsetX
    const endY = (mazeSize - 1) * cellSize + offsetY
    ctx.fillRect(endX + cellSize * 0.1, endY + cellSize * 0.1, cellSize * 0.8, cellSize * 0.8)

    // 绘制小球
    const ballGridX = ball.x
    const ballGridY = ball.z
    const ballX = ballGridX * cellSize + cellSize / 2 + offsetX
    const ballY = ballGridY * cellSize + cellSize / 2 + offsetY

    // console.log('🎨 绘制小球:', {
    //   ballGrid: { x: ballGridX, y: ballGridY },
    //   ballCanvas: { x: ballX, y: ballY },
    //   cellSize
    // })

    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(ballX, ballY, cellSize * 0.3, 0, 2 * Math.PI)
    ctx.fill()

    // 绘制小球的阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    ctx.beginPath()
    ctx.arc(ballX + 2, ballY + 2, cellSize * 0.3, 0, 2 * Math.PI)
    ctx.fill()

    // 重新绘制小球
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(ballX, ballY, cellSize * 0.3, 0, 2 * Math.PI)
    ctx.fill()

    // 绘制小球高光
    ctx.fillStyle = '#60a5fa'
    ctx.beginPath()
    ctx.arc(ballX - cellSize * 0.1, ballY - cellSize * 0.1, cellSize * 0.1, 0, 2 * Math.PI)
    ctx.fill()
  }, [maze, ball, mazeSize])

  // 监听状态变化重新绘制
  useEffect(() => {
    drawMaze()
  }, [drawMaze])

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      drawMaze()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawMaze])

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-lg border-2 border-gray-300 bg-gray-100">
      <canvas ref={setRef} className="h-full w-full cursor-pointer" style={{ display: 'block' }} />

      {!gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
          <div className="text-center text-white">
            <h3 className="mb-2 text-xl font-bold">🎮 点击开始游戏</h3>
            <p className="text-sm opacity-90">将蓝色小球移动到红色终点</p>
          </div>
        </div>
      )}
    </div>
  )
})

MazeCanvas.displayName = 'MazeCanvas'

export default MazeCanvas
