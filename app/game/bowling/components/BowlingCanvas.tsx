"use client"

import { useEffect, useRef } from "react"
import { useBowlingStore } from "../store"

export function BowlingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { ball, pins, aimAngle, isPlaying } = useBowlingStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 设置3D透视效果
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const scale = 4

      // 绘制保龄球道
      drawLane(ctx, canvas.width, canvas.height)
      
      // 绘制瞄准线
      if (!ball.isRolling) {
        drawAimLine(ctx, centerX, centerY, aimAngle)
      }
      
      // 绘制球瓶
      pins.forEach(pin => {
        if (!pin.isKnockedDown) {
          drawPin(ctx, centerX, centerY, pin, scale)
        }
      })
      
      // 绘制保龄球
      drawBall(ctx, centerX, centerY, ball, scale)
      
      // 绘制UI元素
      drawUI(ctx, canvas.width, canvas.height)
    }

    render()
  }, [ball, pins, aimAngle, isPlaying])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={600}
      className="border-2 border-amber-600 rounded-lg bg-gradient-to-b from-amber-100 to-amber-200"
    />
  )
}

// 绘制保龄球道
function drawLane(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // 球道背景
  ctx.fillStyle = '#8B4513'
  ctx.fillRect(width * 0.2, 0, width * 0.6, height)
  
  // 球道边界
  ctx.strokeStyle = '#654321'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(width * 0.2, 0)
  ctx.lineTo(width * 0.2, height)
  ctx.moveTo(width * 0.8, 0)
  ctx.lineTo(width * 0.8, height)
  ctx.stroke()
  
  // 球道中心线
  ctx.strokeStyle = '#DDD'
  ctx.lineWidth = 1
  ctx.setLineDash([10, 10])
  ctx.beginPath()
  ctx.moveTo(width / 2, 0)
  ctx.lineTo(width / 2, height)
  ctx.stroke()
  ctx.setLineDash([])
}

// 绘制瞄准线
function drawAimLine(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, angle: number) {
  const startY = centerY + 200 // 从球的位置开始
  const length = 300
  
  const angleRad = (angle * Math.PI) / 180
  const endX = centerX + Math.sin(angleRad) * length
  const endY = startY - Math.cos(angleRad) * length
  
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)'
  ctx.lineWidth = 3
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(centerX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()
  ctx.setLineDash([])
}

// 绘制球瓶
function drawPin(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, pin: { id: number; x: number; y: number; z: number; isKnockedDown: boolean; angle: number }, scale: number) {
  // 3D透视转换
  const perspective = 1 + (pin.z + 50) / 100
  const x = centerX + (pin.x * scale) / perspective
  const y = centerY - (pin.z * scale) / perspective / 2
  const size = 8 / perspective
  
  if (pin.isKnockedDown) {
    // 倒下的球瓶
    ctx.fillStyle = '#FFF'
    ctx.fillRect(x - size, y - size/4, size * 2, size/2)
  } else {
    // 立着的球瓶
    ctx.fillStyle = '#FFF'
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    
    // 球瓶身体
    ctx.beginPath()
    ctx.ellipse(x, y, size/2, size, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    
    // 球瓶编号
    ctx.fillStyle = '#000'
    ctx.font = `${size}px Arial`
    ctx.textAlign = 'center'
    ctx.fillText(pin.id.toString(), x, y + size/4)
  }
}

// 绘制保龄球
function drawBall(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, ball: { x: number; y: number; z: number; radius: number; isRolling: boolean }, scale: number) {
  // 3D透视转换
  const perspective = 1 + (ball.z + 50) / 100
  const x = centerX + (ball.x * scale) / perspective
  const y = centerY - (ball.z * scale) / perspective / 2
  const radius = (ball.radius * scale) / perspective
  
  // 球的阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.beginPath()
  ctx.ellipse(x, y + radius * 0.8, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2)
  ctx.fill()
  
  // 保龄球
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, 0,
    x, y, radius
  )
  gradient.addColorStop(0, '#4A90E2')
  gradient.addColorStop(1, '#1E3A8A')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  
  // 球的高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.beginPath()
  ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2)
  ctx.fill()
  
  // 球上的洞
  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(x - radius * 0.2, y, radius * 0.1, 0, Math.PI * 2)
  ctx.arc(x + radius * 0.2, y, radius * 0.1, 0, Math.PI * 2)
  ctx.arc(x, y + radius * 0.3, radius * 0.1, 0, Math.PI * 2)
  ctx.fill()
}

// 绘制UI元素
function drawUI(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // 距离标记
  const distances = [10, 20, 30, 40, 50]
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 1
  ctx.font = '12px Arial'
  ctx.fillStyle = '#666'
  
  distances.forEach(dist => {
    const y = height - (dist * 8)
    ctx.beginPath()
    ctx.moveTo(10, y)
    ctx.lineTo(30, y)
    ctx.stroke()
    ctx.fillText(`${dist}ft`, 35, y + 4)
  })
} 