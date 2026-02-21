'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EffectBaseProps } from './types'

interface Bolt {
  xPct: number
  yPct: number
  targetXPct: number
  targetYPct: number
  x: number
  y: number
  targetX: number
  targetY: number
  segments: { x: number; y: number }[]
  alpha: number
  initialized: boolean
  flash: boolean
}

interface Impact {
  xPct: number
  yPct: number
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
  initialized: boolean
}

function generateBoltSegments(): { x: number; y: number }[] {
  const segments = []
  const segmentsCount = 8

  for (let i = 0; i <= segmentsCount; i++) {
    const t = i / segmentsCount
    let x = t
    let y = t

    if (i > 0 && i < segmentsCount) {
      x += (Math.random() - 0.5) * 0.15
    }

    segments.push({ x, y })
  }

  return segments
}

/** 连锁闪电特效 - 闪电在多个目标之间传递 */
export function ChainLightningEffect({
  active,
  onComplete,
  targetPositions = [],
}: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boltsRef = useRef<Bolt[]>([])
  const impactsRef = useRef<Impact[]>([])
  const rafRef = useRef<number>(0)
  const [isActive, setIsActive] = useState(false)
  const targetsRef = useRef<{ x: number; y: number }[]>([])
  const chainIndexRef = useRef(0)
  const hasCompletedRef = useRef(false)

  useEffect(() => {
    targetsRef.current = targetPositions
  }, [targetPositions])

  const castChain = useCallback(() => {
    const targets = targetsRef.current
    if (targets.length === 0) return

    const castNextBolt = (index: number) => {
      if (index >= targets.length) {
        chainIndexRef.current = 0
        return
      }

      const target = targets[index]
      let sourceX: number, sourceY: number

      if (index === 0) {
        sourceX = target.x
        sourceY = 0
      } else {
        sourceX = targets[index - 1].x
        sourceY = targets[index - 1].y
      }

      const bolt: Bolt = {
        xPct: sourceX,
        yPct: sourceY,
        targetXPct: target.x,
        targetYPct: target.y,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        segments: generateBoltSegments(),
        alpha: 1,
        initialized: false,
        flash: index === 0,
      }

      boltsRef.current.push(bolt)

      setTimeout(() => {
        impactsRef.current.push({
          xPct: target.x,
          yPct: target.y,
          x: 0,
          y: 0,
          radius: 0,
          maxRadius: 35,
          alpha: 1,
          initialized: false,
        })
      }, 150)

      chainIndexRef.current = index + 1
      setTimeout(() => castNextBolt(index + 1), 200)
    }

    castNextBolt(0)
  }, [])

  const hasActivatedRef = useRef(false)

  useEffect(() => {
    if (active && !hasActivatedRef.current) {
      hasActivatedRef.current = true
      hasCompletedRef.current = false
      setIsActive(true)
      castChain()
    } else if (!active) {
      hasActivatedRef.current = false
      chainIndexRef.current = 0
    }
  }, [active, castChain])

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

        bolt.alpha -= 0.04

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

        imp.radius += 3
        imp.alpha -= 0.05

        if (imp.alpha <= 0) {
          impactsRef.current.splice(i, 1)
        }
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      boltsRef.current.forEach(bolt => {
        if (bolt.flash && bolt.alpha > 0.5) {
          ctx.fillStyle = `rgba(255, 255, 255, ${bolt.alpha * 0.3})`
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        }

        ctx.strokeStyle = `rgba(180, 220, 255, ${bolt.alpha})`
        ctx.lineWidth = 3
        ctx.shadowColor = '#00ddff'
        ctx.shadowBlur = 15

        ctx.beginPath()
        bolt.segments.forEach((seg, i) => {
          const sx = bolt.x + (bolt.targetX - bolt.x) * seg.y
          const sy = bolt.y + (bolt.targetY - bolt.y) * seg.y
          if (i === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        })
        ctx.stroke()

        ctx.strokeStyle = `rgba(255, 255, 255, ${bolt.alpha * 0.7})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        bolt.segments.forEach((seg, i) => {
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
        g.addColorStop(0, `rgba(150, 220, 255, ${imp.alpha * 0.9})`)
        g.addColorStop(0.4, `rgba(100, 180, 255, ${imp.alpha * 0.5})`)
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

      const allDone =
        boltsRef.current.length === 0 &&
        impactsRef.current.length === 0 &&
        chainIndexRef.current >= (targetsRef.current.length || 0)

      if (allDone && !hasCompletedRef.current) {
        hasCompletedRef.current = true
        if (onComplete) onComplete()
        setIsActive(false)
      } else if (!allDone) {
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
