"use client"

import { useEffect, useRef } from 'react'
import { useMazeStore } from '../store'
import type { MazeCell } from '../store'

export function MazeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { maze, ball, cellSize, mazeSize } = useMazeStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸
    const canvasSize = mazeSize * cellSize
    canvas.width = canvasSize
    canvas.height = canvasSize

    // 清空画布
    ctx.fillStyle = '#1e293b' // slate-800
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    // 绘制迷宫
    drawMaze(ctx, maze, cellSize)

    // 绘制起点
    ctx.fillStyle = '#10b981' // emerald-500
    ctx.fillRect(2, 2, cellSize - 4, cellSize - 4)

    // 绘制终点
    const endX = (mazeSize - 1) * cellSize
    const endY = (mazeSize - 1) * cellSize
    ctx.fillStyle = '#ef4444' // red-500
    ctx.fillRect(endX + 2, endY + 2, cellSize - 4, cellSize - 4)

    // 绘制小球
    drawBall(ctx, ball)

  }, [maze, ball, cellSize, mazeSize])

  return (
    <div className="flex justify-center">
      <canvas
        ref={canvasRef}
        className="border-2 border-slate-600 rounded-lg shadow-lg bg-slate-800"
        style={{ 
          maxWidth: '90vw', 
          maxHeight: '60vh',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  )
}

function drawMaze(ctx: CanvasRenderingContext2D, maze: MazeCell[][], cellSize: number) {
  if (!maze.length) return

  ctx.strokeStyle = '#64748b' // slate-500
  ctx.lineWidth = 2

  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[y].length; x++) {
      const cell = maze[y][x]
      const cellX = x * cellSize
      const cellY = y * cellSize

      ctx.beginPath()

      // 绘制墙壁
      if (cell.walls.top) {
        ctx.moveTo(cellX, cellY)
        ctx.lineTo(cellX + cellSize, cellY)
      }
      if (cell.walls.right) {
        ctx.moveTo(cellX + cellSize, cellY)
        ctx.lineTo(cellX + cellSize, cellY + cellSize)
      }
      if (cell.walls.bottom) {
        ctx.moveTo(cellX + cellSize, cellY + cellSize)
        ctx.lineTo(cellX, cellY + cellSize)
      }
      if (cell.walls.left) {
        ctx.moveTo(cellX, cellY + cellSize)
        ctx.lineTo(cellX, cellY)
      }

      ctx.stroke()
    }
  }
}

function drawBall(ctx: CanvasRenderingContext2D, ball: { x: number; y: number; radius: number }) {
  // 绘制小球阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.beginPath()
  ctx.arc(ball.x + 1, ball.y + 1, ball.radius, 0, Math.PI * 2)
  ctx.fill()

  // 绘制小球主体
  const gradient = ctx.createRadialGradient(
    ball.x - ball.radius * 0.3, 
    ball.y - ball.radius * 0.3, 
    0,
    ball.x, 
    ball.y, 
    ball.radius
  )
  gradient.addColorStop(0, '#60a5fa') // blue-400
  gradient.addColorStop(1, '#1d4ed8') // blue-700

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
  ctx.fill()

  // 绘制高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.beginPath()
  ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.3, 0, Math.PI * 2)
  ctx.fill()
} 