'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EffectBaseProps } from './types'

function generateBoltSegments() {
  const segments = []
  const startX = 0,
    startY = 0
  const endX = 0,
    endY = 1
  const segmentsCount = 8

  for (let i = 0; i <= segmentsCount; i++) {
    const t = i / segmentsCount
    let x = startX + (endX - startX) * t
    let y = startY + (endY - startY) * t

    if (i > 0 && i < segmentsCount) {
      x += (Math.random() - 0.5) * 0.15
    }

    segments.push({ x, y })
  }

  return segments
}

/** 雷击特效 */
export function LightningEffect({ active, onComplete, targetPosition }: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boltsRef = useRef<any[]>([])
  const impactsRef = useRef<any[]>([])
  const rafRef = useRef<number>(0)
  const [isActive, setIsActive] = useState(false)
  const targetRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    if (targetPosition) {
      targetRef.current = targetPosition
    }
  }, [targetPosition])

  const cast = useCallback(() => {
    const target = targetRef.current

    boltsRef.current.push({
      xPct: target.x,
      yPct: 0,
      targetXPct: target.x,
      targetYPct: target.y,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      segments: generateBoltSegments(),
      alpha: 1,
      initialized: false,
      flash: true,
    })

    setTimeout(() => {
      boltsRef.current.push({
        xPct: target.x + (Math.random() - 0.5) * 0.05,
        yPct: 0,
        targetXPct: target.x + (Math.random() - 0.5) * 0.05,
        targetYPct: target.y,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        segments: generateBoltSegments(),
        alpha: 0.7,
        initialized: false,
        flash: false,
      })
    }, 100)

    setTimeout(() => {
      impactsRef.current.push({
        xPct: target.x,
        yPct: target.y,
        x: 0,
        y: 0,
        radius: 0,
        maxRadius: 40,
        alpha: 1,
      })
    }, 150)
  }, [])

  const hasActivatedRef = useRef(false)

  useEffect(() => {
    if (active && !hasActivatedRef.current) {
      hasActivatedRef.current = true
      setIsActive(true)
      cast()
      setTimeout(() => {
        cast()
      }, 2000)
    } else if (!active) {
      hasActivatedRef.current = false
    }
  }, [active, cast])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const update = () => {
      const canvasWidth = canvas.clientWidth || 400
      const canvasHeight = canvas.clientHeight || 300

      for (let i = boltsRef.current.length - 1; i >= 0; i--) {
        const bolt = boltsRef.current[i]

        if (!bolt.initialized) {
          bolt.x = bolt.xPct * canvasWidth
          bolt.y = bolt.yPct * canvasHeight
          bolt.targetX = bolt.targetXPct * canvasWidth
          bolt.targetY = bolt.targetYPct * canvasHeight
          bolt.initialized = true
        }

        bolt.alpha -= 0.05

        if (bolt.alpha <= 0) {
          boltsRef.current.splice(i, 1)
        }
      }

      for (let i = impactsRef.current.length - 1; i >= 0; i--) {
        const imp = impactsRef.current[i]

        if (!imp.initialized) {
          imp.x = imp.xPct * canvasWidth
          imp.y = imp.yPct * canvasHeight
          imp.initialized = true
        }

        imp.radius += 4
        imp.alpha -= 0.06

        if (imp.alpha <= 0) {
          impactsRef.current.splice(i, 1)
        }
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      boltsRef.current.forEach(bolt => {
        if (bolt.flash) {
          ctx.fillStyle = `rgba(255, 255, 255, ${bolt.alpha * 0.5})`
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        }

        ctx.strokeStyle = `rgba(200, 220, 255, ${bolt.alpha})`
        ctx.lineWidth = 4
        ctx.shadowColor = '#00ffff'
        ctx.shadowBlur = 20

        ctx.beginPath()
        bolt.segments.forEach((seg: any, i: number) => {
          const sx = bolt.x + (bolt.targetX - bolt.x) * seg.y
          const sy = bolt.y + (bolt.targetY - bolt.y) * seg.y
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        })
        ctx.stroke()

        ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha * 0.8})`
        ctx.lineWidth = 2
        ctx.beginPath()
        bolt.segments.forEach((seg: any, i: number) => {
          const sx = bolt.x + (bolt.targetX - bolt.x) * seg.y
          const sy = bolt.y + (bolt.targetY - bolt.y) * seg.y
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        })
        ctx.stroke()

        ctx.shadowBlur = 0
      })

      impactsRef.current.forEach(imp => {
        const g = ctx.createRadialGradient(imp.x, imp.y, 0, imp.x, imp.y, imp.radius)
        g.addColorStop(0, `rgba(150, 220, 255, ${imp.alpha * 0.8})`)
        g.addColorStop(0.5, `rgba(100, 180, 255, ${imp.alpha * 0.4})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = `rgba(200, 240, 255, ${imp.alpha})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2)
        ctx.stroke()
      })

      if (boltsRef.current.length === 0 && impactsRef.current.length === 0) {
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
      width={400}
      height={300}
      className="pointer-events-none"
      style={{ width: '100%', height: '100%', objectFit: 'fill' }}
    />
  )
}
