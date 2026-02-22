'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EffectBaseProps } from './types'

/** 火球特效 */
export function FireballEffect({ active, onComplete, targetPosition }: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fireballsRef = useRef<any[]>([])
  const explosionsRef = useRef<any[]>([])
  const rafRef = useRef<number>(0)
  const [isActive, setIsActive] = useState(false)
  const targetRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    if (targetPosition) {
      targetRef.current = targetPosition
    }
  }, [targetPosition])

  const cast = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const target = targetRef.current
    const startX = canvas.width * 0.5
    const startY = canvas.height

    fireballsRef.current.push({
      x: startX,
      y: startY,
      targetX: target.x * canvas.width,
      targetY: target.y * canvas.height,
      speed: 12,
      size: 20,
      trail: [],
      alive: true,
    })
  }, [])

  const hasActivatedRef = useRef(false)

  useEffect(() => {
    if (active && !hasActivatedRef.current) {
      hasActivatedRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      for (let i = fireballsRef.current.length - 1; i >= 0; i--) {
        const f = fireballsRef.current[i]
        f.trail.push({ x: f.x, y: f.y, alpha: 1 })
        if (f.trail.length > 12) f.trail.shift()
        f.trail.forEach((t: any) => (t.alpha -= 0.08))

        const dx = f.targetX - f.x
        const dy = f.targetY - f.y
        const dist = Math.hypot(dx, dy)
        f.x += (dx / dist) * f.speed
        f.y += (dy / dist) * f.speed

        if (dist < 20) {
          f.alive = false
          explosionsRef.current.push({ x: f.x, y: f.y, radius: 0, maxRadius: 60, alpha: 1 })
        }
        if (!f.alive) fireballsRef.current.splice(i, 1)
      }

      for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const e = explosionsRef.current[i]
        e.radius += 4
        e.alpha -= 0.06
        if (e.alpha <= 0) explosionsRef.current.splice(i, 1)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      fireballsRef.current.forEach(f => {
        f.trail.forEach((t: any, i: number) => {
          ctx.beginPath()
          ctx.arc(t.x, t.y, f.size * (i / f.trail.length) * 0.6, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 150, 50, ${t.alpha * 0.7})`
          ctx.fill()
        })
        const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.size)
        gradient.addColorStop(0, '#fff')
        gradient.addColorStop(0.2, '#ffcc00')
        gradient.addColorStop(0.5, '#ff6600')
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2)
        ctx.fill()
      })

      explosionsRef.current.forEach(e => {
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius)
        g.addColorStop(0, `rgba(255, 200, 100, ${e.alpha * 0.8})`)
        g.addColorStop(0.5, `rgba(255, 100, 30, ${e.alpha * 0.5})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      if (fireballsRef.current.length === 0 && explosionsRef.current.length === 0) {
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
