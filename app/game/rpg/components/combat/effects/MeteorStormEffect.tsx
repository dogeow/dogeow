'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EffectBaseProps } from './types'

/** 流星火雨特效 */
export function MeteorStormEffect({ active, onComplete, targetPosition }: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const meteorsRef = useRef<any[]>([])
  const explosionsRef = useRef<any[]>([])
  const firesRef = useRef<any[]>([])
  const rafRef = useRef<number>(0)
  const targetRef = useRef({ x: 0.5, y: 0.5 })

  useEffect(() => {
    if (targetPosition) {
      targetRef.current = targetPosition
    }
  }, [targetPosition])
  const [isActive, setIsActive] = useState(false)

  const cast = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const target = targetRef.current

    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        meteorsRef.current.push({
          startXPct: target.x + (Math.random() - 0.5) * 0.8,
          startYPct: -0.1,
          targetXPct: target.x + (Math.random() - 0.5) * 0.25,
          targetYPct: target.y + (Math.random() - 0.5) * 0.15,
          x: 0,
          y: 0,
          targetX: 0,
          targetY: 0,
          speed: 8 + Math.random() * 6,
          size: 8 + Math.random() * 12,
          angle: 0,
          trail: [],
          color: `hsl(${15 + Math.random() * 25}, 100%, ${50 + Math.random() * 20}%)`,
          alive: true,
          initialized: false,
        })
      }, i * 120)
    }

    const interval = setInterval(() => {
      if (meteorsRef.current.length > 30) return
      meteorsRef.current.push({
        startXPct: target.x + (Math.random() - 0.5) * 0.6,
        startYPct: -0.1,
        targetXPct: target.x + (Math.random() - 0.5) * 0.2,
        targetYPct: target.y + (Math.random() - 0.5) * 0.15,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        speed: 8 + Math.random() * 6,
        size: 8 + Math.random() * 8,
        angle: 0,
        trail: [],
        color: `hsl(20, 100%, 60%)`,
        alive: true,
        initialized: false,
      })
    }, 200)

    setTimeout(() => clearInterval(interval), 3000)
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
      const canvasWidth = canvas.clientWidth || 400
      const canvasHeight = canvas.clientHeight || 300

      for (let i = meteorsRef.current.length - 1; i >= 0; i--) {
        const m = meteorsRef.current[i]

        if (!m.initialized) {
          m.x = m.startXPct * canvasWidth
          m.y = m.startYPct * canvasHeight
          m.targetX = m.targetXPct * canvasWidth
          m.targetY = m.targetYPct * canvasHeight
          m.initialized = true
        }

        m.trail.push({ x: m.x, y: m.y, alpha: 1 })
        if (m.trail.length > 8) m.trail.shift()
        m.trail.forEach((t: any) => (t.alpha -= 0.1))

        const dx = m.targetX - m.x
        const dy = m.targetY - m.y
        const dist = Math.hypot(dx, dy)
        m.angle = Math.atan2(dy, dx)
        m.x += Math.cos(m.angle) * m.speed
        m.y += Math.sin(m.angle) * m.speed

        if (dist < 30 || m.y > canvasHeight) {
          m.alive = false
          explosionsRef.current.push({
            x: m.x,
            y: m.y,
            radius: 0,
            maxRadius: 40,
            alpha: 1,
          })
          firesRef.current.push({
            x: m.x + (Math.random() - 0.5) * 40,
            y: m.y,
            radius: 20,
            maxRadius: 40,
            life: 1,
          })
        }
        if (!m.alive) meteorsRef.current.splice(i, 1)
      }

      for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const e = explosionsRef.current[i]
        e.radius += 3
        e.alpha -= 0.08
        if (e.alpha <= 0) explosionsRef.current.splice(i, 1)
      }

      for (let i = firesRef.current.length - 1; i >= 0; i--) {
        const f = firesRef.current[i]
        f.life -= 0.005
        if (f.radius < f.maxRadius) f.radius += 0.3
        if (f.life <= 0) firesRef.current.splice(i, 1)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      meteorsRef.current.forEach(m => {
        m.trail.forEach((t: any, i: number) => {
          ctx.beginPath()
          ctx.arc(t.x, t.y, m.size * (i / m.trail.length) * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 150, 50, ${t.alpha * 0.6})`
          ctx.fill()
        })
        const gradient = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size)
        gradient.addColorStop(0, '#fff')
        gradient.addColorStop(0.3, m.color)
        gradient.addColorStop(1, 'transparent')
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()
      })

      explosionsRef.current.forEach(e => {
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius)
        g.addColorStop(0, `rgba(255, 200, 100, ${e.alpha * 0.8})`)
        g.addColorStop(0.5, `rgba(255, 100, 50, ${e.alpha * 0.5})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      firesRef.current.forEach(f => {
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius)
        g.addColorStop(0, `rgba(255, 80, 10, ${f.life * 0.5})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(f.x, f.y, f.radius * 1.2, f.radius * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()
        for (let i = 0; i < 3; i++) {
          const ox = (i - 1) * 10
          const h = (20 + i * 5) * f.life
          const w = (8 - i * 2) * f.life
          const grad = ctx.createLinearGradient(f.x + ox, f.y, f.x + ox, f.y - h)
          grad.addColorStop(0, `rgba(255, 100, 20, ${f.life * 0.8})`)
          grad.addColorStop(0.6, `rgba(255, 180, 50, ${f.life * 0.5})`)
          grad.addColorStop(1, 'transparent')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.moveTo(f.x + ox - w, f.y)
          ctx.lineTo(f.x + ox, f.y - h)
          ctx.lineTo(f.x + ox + w, f.y)
          ctx.fill()
        }
      })

      if (
        meteorsRef.current.length === 0 &&
        explosionsRef.current.length === 0 &&
        firesRef.current.length === 0
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
