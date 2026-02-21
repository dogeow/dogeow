'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EffectBaseProps } from './types'

/** 冰箭特效 */
export function IceArrowEffect({ active, onComplete, targetPosition }: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const arrowsRef = useRef<any[]>([])
  const impactsRef = useRef<any[]>([])
  const frostRef = useRef<any[]>([])
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

    arrowsRef.current.push({
      x: target.x * canvas.width,
      y: -60,
      targetX: target.x * canvas.width,
      targetY: target.y * canvas.height,
      speed: 15,
      size: 50,
      angle: 0,
      trail: [],
      alive: true,
    })
  }, [])

  const hasActivatedRef = useRef(false)

  useEffect(() => {
    if (active && !hasActivatedRef.current) {
      hasActivatedRef.current = true
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
      for (let i = arrowsRef.current.length - 1; i >= 0; i--) {
        const a = arrowsRef.current[i]
        a.trail.push({ x: a.x, y: a.y, alpha: 1 })
        if (a.trail.length > 10) a.trail.shift()
        a.trail.forEach((t: any) => (t.alpha -= 0.1))

        const dx = a.targetX - a.x
        const dy = a.targetY - a.y
        const dist = Math.hypot(dx, dy)
        a.angle = Math.atan2(dy, dx) + Math.PI / 2
        a.x += (dx / dist) * a.speed
        a.y += (dy / dist) * a.speed

        if (dist < 20) {
          a.alive = false
          impactsRef.current.push({ x: a.x, y: a.y, radius: 0, maxRadius: 50, alpha: 1 })
          frostRef.current.push({ x: a.x, y: a.y, radius: 0, maxRadius: 50, life: 1 })
        }
        if (!a.alive) arrowsRef.current.splice(i, 1)
      }

      for (let i = impactsRef.current.length - 1; i >= 0; i--) {
        const imp = impactsRef.current[i]
        imp.radius += 5
        imp.alpha -= 0.05
        if (imp.alpha <= 0) impactsRef.current.splice(i, 1)
      }

      for (let i = frostRef.current.length - 1; i >= 0; i--) {
        const f = frostRef.current[i]
        f.life -= 0.008
        if (f.radius < f.maxRadius) f.radius += 1
        if (f.life <= 0) frostRef.current.splice(i, 1)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      arrowsRef.current.forEach(a => {
        a.trail.forEach((t: any, i: number) => {
          ctx.fillStyle = `rgba(150, 220, 255, ${t.alpha * 0.6})`
          ctx.beginPath()
          ctx.arc(t.x, t.y, 3 * (i / a.trail.length), 0, Math.PI * 2)
          ctx.fill()
        })

        ctx.save()
        ctx.translate(a.x, a.y)
        ctx.rotate(a.angle)

        const gradient = ctx.createLinearGradient(0, -a.size / 2, 0, a.size / 2)
        gradient.addColorStop(0, 'rgba(200, 240, 255, 0.9)')
        gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.8)')
        gradient.addColorStop(1, 'rgba(150, 220, 255, 0.6)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(0, -a.size / 2)
        ctx.lineTo(-4, a.size / 4)
        ctx.lineTo(4, a.size / 4)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.beginPath()
        ctx.arc(0, -a.size / 2 + 5, 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      })

      impactsRef.current.forEach(imp => {
        ctx.strokeStyle = `rgba(150, 220, 255, ${imp.alpha * 0.8})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2)
        ctx.stroke()

        const g = ctx.createRadialGradient(imp.x, imp.y, 0, imp.x, imp.y, imp.radius)
        g.addColorStop(0, `rgba(200, 240, 255, ${imp.alpha * 0.5})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(imp.x, imp.y, imp.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      frostRef.current.forEach(f => {
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius)
        g.addColorStop(0, `rgba(180, 220, 255, ${f.life * 0.6})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(f.x, f.y, f.radius * 1.2, f.radius * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()
      })

      if (
        arrowsRef.current.length === 0 &&
        impactsRef.current.length === 0 &&
        frostRef.current.length === 0
      ) {
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
