'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EffectBaseProps } from './types'

interface IcePuddle {
  x: number
  y: number
  radiusX: number
  radiusY: number
  maxRadiusX: number
  maxRadiusY: number
  life: number
  shimmer: number
}

/** 冰河世纪特效：每个目标脚下出现一层冰面 */
export function IceAgeEffect({
  active,
  onComplete,
  targetPosition,
  targetPositions = [],
}: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const puddlesRef = useRef<IcePuddle[]>([])
  const rafRef = useRef<number>(0)
  const [isActive, setIsActive] = useState(false)
  const positionsRef = useRef<{ x: number; y: number }[]>([])

  useEffect(() => {
    if (targetPositions.length > 0) {
      positionsRef.current = targetPositions
    } else if (targetPosition) {
      positionsRef.current = [targetPosition]
    } else {
      positionsRef.current = [{ x: 0.5, y: 0.25 }]
    }
  }, [targetPosition, targetPositions])

  const cast = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const positions = positionsRef.current
    if (positions.length === 0) return

    const w = canvas.width
    const h = canvas.height
    const baseRadiusX = Math.min(w, h) * 0.12
    const baseRadiusY = Math.min(w, h) * 0.04

    positions.forEach((pos, i) => {
      setTimeout(() => {
        puddlesRef.current.push({
          x: pos.x * w,
          y: pos.y * h + baseRadiusY * 2,
          radiusX: 0,
          radiusY: 0,
          maxRadiusX: baseRadiusX * (0.9 + Math.random() * 0.2),
          maxRadiusY: baseRadiusY * (0.9 + Math.random() * 0.2),
          life: 1,
          shimmer: Math.random() * Math.PI * 2,
        })
      }, i * 80)
    })
  }, [])

  const hasActivatedRef = useRef(false)

  useEffect(() => {
    if (active && !hasActivatedRef.current) {
      hasActivatedRef.current = true
      puddlesRef.current = []
      setIsActive(true)
      cast()
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
      for (let i = puddlesRef.current.length - 1; i >= 0; i--) {
        const p = puddlesRef.current[i]
        if (p.radiusX < p.maxRadiusX) {
          p.radiusX += p.maxRadiusX * 0.08
          p.radiusY += p.maxRadiusY * 0.08
        }
        p.radiusX = Math.min(p.radiusX, p.maxRadiusX)
        p.radiusY = Math.min(p.radiusY, p.maxRadiusY)
        p.life -= 0.012
        p.shimmer += 0.08
        if (p.life <= 0) puddlesRef.current.splice(i, 1)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      puddlesRef.current.forEach(p => {
        const alpha = Math.max(0, p.life)
        const shimmerAlpha = 0.15 + Math.sin(p.shimmer) * 0.08

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(p.radiusX, p.radiusY))
        g.addColorStop(0, `rgba(200, 240, 255, ${alpha * 0.7})`)
        g.addColorStop(0.4, `rgba(150, 220, 255, ${alpha * 0.4})`)
        g.addColorStop(0.7, `rgba(100, 180, 230, ${alpha * 0.2})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.radiusX, p.radiusY, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * (0.5 + shimmerAlpha)})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.ellipse(p.x, p.y, p.radiusX, p.radiusY, 0, 0, Math.PI * 2)
        ctx.stroke()
      })

      if (puddlesRef.current.length === 0) {
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
