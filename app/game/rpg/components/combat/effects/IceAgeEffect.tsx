'use client'

import { useEffect, useRef, useState } from 'react'
import type { EffectBaseProps } from './types'

/** 冰河世纪特效：怪物脚下出现一片扁平的湖面冰块 */
export function IceAgeEffect({
  active,
  onComplete,
  targetPosition,
  targetPositions = [],
}: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const [isActive, setIsActive] = useState(false)

  const iceCenterY = 0.26
  const iceCenterX = 0.5

  const progressRef = useRef(0)
  const lifeRef = useRef(1)
  const waveRef = useRef(0)

  const hasActivatedRef = useRef(false)

  useEffect(() => {
    if (active && !hasActivatedRef.current) {
      hasActivatedRef.current = true
      progressRef.current = 0
      lifeRef.current = 1
      waveRef.current = 0
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true)
    } else if (!active) {
      hasActivatedRef.current = false
    }
  }, [active])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const cx = iceCenterX * w
    const cy = iceCenterY * h
    const maxRx = w * 0.55
    const maxRy = h * 0.18

    // 确定性“随机”裂纹端点（用索引生成，避免每帧变化）
    const crackSegments = [
      [0.15, 0.5],
      [0.32, 0.35],
      [0.5, 0.55],
      [0.68, 0.4],
      [0.85, 0.5],
      [0.2, 0.6],
      [0.45, 0.3],
      [0.75, 0.45],
      [0.55, 0.65],
      [0.35, 0.5],
    ]

    const update = () => {
      progressRef.current = Math.min(1, progressRef.current + 0.025)
      waveRef.current += 0.035
      lifeRef.current -= 0.004

      const progress = progressRef.current
      const life = Math.max(0, lifeRef.current)
      const wave = waveRef.current
      const easeOut = 1 - (1 - progress) ** 1.4
      const rx = maxRx * easeOut
      const ry = maxRy * easeOut

      ctx.clearRect(0, 0, w, h)

      const alpha = life

      // 外圈：半透明冰蓝，边缘更淡
      const outerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry) * 1.1)
      outerGrad.addColorStop(0, `rgba(190, 225, 255, ${alpha * 0.5})`)
      outerGrad.addColorStop(0.5, `rgba(160, 210, 245, ${alpha * 0.35})`)
      outerGrad.addColorStop(0.85, `rgba(130, 190, 235, ${alpha * 0.2})`)
      outerGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = outerGrad
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx * 1.05, ry * 1.05, 0, 0, Math.PI * 2)
      ctx.fill()

      // 主体冰层：更实一点的冰色
      const mainGrad = ctx.createRadialGradient(cx, cy - ry * 0.2, 0, cx, cy, Math.max(rx, ry))
      mainGrad.addColorStop(0, `rgba(220, 245, 255, ${alpha * 0.9})`)
      mainGrad.addColorStop(0.25, `rgba(200, 235, 252, ${alpha * 0.8})`)
      mainGrad.addColorStop(0.5, `rgba(175, 220, 248, ${alpha * 0.65})`)
      mainGrad.addColorStop(0.8, `rgba(150, 205, 240, ${alpha * 0.4})`)
      mainGrad.addColorStop(1, `rgba(130, 190, 235, ${alpha * 0.15})`)
      ctx.fillStyle = mainGrad
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()

      // 霜边：高光前沿（展开时更明显）
      const rimAlpha = alpha * (0.5 + 0.3 * Math.sin(wave * 0.8))
      ctx.strokeStyle = `rgba(255, 255, 255, ${rimAlpha})`
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx * 0.97, ry * 0.97, 0, 0, Math.PI * 2)
      ctx.stroke()

      // 内层细边
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2)
      ctx.stroke()

      // 冰裂纹：从中心向外多段线
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`
      ctx.lineWidth = 1.2
      for (let i = 0; i < 8; i++) {
        const angle = ((Math.PI * 2) / 8) * i + wave * 0.05
        const len = Math.min(rx, ry * 5) * (0.7 + (i % 3) * 0.1)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        let x = cx
        let y = cy
        const steps = 4
        for (let s = 1; s <= steps; s++) {
          const t = s / steps
          const jitter = Math.sin(angle * 7 + wave + s) * 0.03 * len
          x = cx + Math.cos(angle + jitter) * len * t
          y = cy + Math.sin(angle + jitter) * len * t * 0.35
          ctx.lineTo(x, y)
        }
        ctx.stroke()
      }

      // 次要裂纹（短、在椭圆内）
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.2})`
      ctx.lineWidth = 0.8
      crackSegments.forEach(([ax, ay], i) => {
        const px = cx + (ax - 0.5) * rx * 2
        const py = cy + (ay - 0.5) * ry * 2
        const a = (Math.PI * 2 * i) / crackSegments.length + wave * 0.1
        const len = 12 + (i % 5) * 4
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len * 0.4)
        ctx.stroke()
      })

      // 冰面闪光点（数量增多、带轻微呼吸）
      const sparkleCount = 16
      for (let i = 0; i < sparkleCount; i++) {
        const angle = ((Math.PI * 2) / sparkleCount) * i + wave * 0.3
        const r = Math.min(rx, ry * 3) * (0.25 + (i % 5) / 15)
        const px = cx + Math.cos(angle) * r * 1.1
        const py = cy + Math.sin(angle) * r * 0.5
        const breath = 0.5 + Math.sin(wave + i * 0.8) * 0.25
        const sparkleAlpha = alpha * breath

        ctx.beginPath()
        ctx.arc(px, py, 2.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(px - 5, py)
        ctx.lineTo(px + 5, py)
        ctx.moveTo(px, py - 5)
        ctx.lineTo(px, py + 5)
        ctx.strokeStyle = `rgba(255, 255, 255, ${sparkleAlpha * 0.5})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      if (life <= 0) {
        if (onComplete) onComplete()
        setIsActive(false)
      } else {
        rafRef.current = requestAnimationFrame(update)
      }
    }

    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isActive, onComplete])

  if (!isActive && !active) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ display: 'block' }}
      width={400}
      height={300}
    />
  )
}
