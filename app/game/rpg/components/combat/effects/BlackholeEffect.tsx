'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EffectBaseProps } from './types'

/** 黑洞特效 */
export function BlackholeEffect({ active, onComplete, targetPosition }: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const blackholeRef = useRef<any>(null)
  const particlesRef = useRef<any[]>([])
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
    const target = targetRef.current

    blackholeRef.current = {
      x: target.x * (canvas?.width || 400),
      y: target.y * (canvas?.height || 300),
      radius: 0,
      maxRadius: 60,
      active: true,
      angle: 0,
    }
  }, [])

  const hasActivatedRef = useRef(false)

  useEffect(() => {
    if (active && !hasActivatedRef.current) {
      hasActivatedRef.current = true
      setIsActive(true)
      cast()
      setTimeout(() => {
        if (blackholeRef.current) blackholeRef.current.active = false
      }, 3000)
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
      const bh = blackholeRef.current
      if (!bh) return

      bh.angle += 0.05

      if (bh.active && bh.radius < bh.maxRadius) {
        bh.radius += 2
      } else if (!bh.active && bh.radius > 0) {
        bh.radius -= 3
      }

      if (bh.active && Math.random() < 0.3) {
        const angle = Math.random() * Math.PI * 2
        const dist = 100 + Math.random() * 50
        particlesRef.current.push({
          x: bh.x + Math.cos(angle) * dist,
          y: bh.y + Math.sin(angle) * dist,
          dist: dist,
          angle: angle,
          size: 2 + Math.random() * 3,
          alpha: 1,
        })
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.dist -= 3
        p.angle += 0.1
        p.x = bh.x + Math.cos(p.angle) * p.dist
        p.y = bh.y + Math.sin(p.angle) * p.dist
        p.alpha -= 0.02
        if (p.alpha <= 0 || p.dist < 10) particlesRef.current.splice(i, 1)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (bh.radius > 0) {
        const a = bh.active ? 1 : bh.radius / bh.maxRadius

        for (let i = 0; i < 3; i++) {
          const r = bh.radius * (1.2 + i * 0.3)
          ctx.beginPath()
          ctx.arc(bh.x, bh.y, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(168, 85, 247, ${a * (0.3 - i * 0.1)})`
          ctx.lineWidth = 2
          ctx.stroke()
        }

        particlesRef.current.forEach(p => {
          ctx.fillStyle = `rgba(180, 120, 255, ${p.alpha})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        })

        const gradient = ctx.createRadialGradient(bh.x, bh.y, 0, bh.x, bh.y, bh.radius)
        gradient.addColorStop(0, '#000')
        gradient.addColorStop(0.5, '#1a0a2e')
        gradient.addColorStop(0.8, 'rgba(88, 28, 135, 0.8)')
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(bh.x, bh.y, bh.radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = `rgba(168, 85, 247, ${a})`
        ctx.lineWidth = 2
        ctx.stroke()
      }

      if (bh.radius <= 0 && particlesRef.current.length === 0) {
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
