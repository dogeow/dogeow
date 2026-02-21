'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { EffectBaseProps } from './types'

/** 陨石术特效 */
export function MeteorEffect({ active, onComplete, targetPosition }: EffectBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const meteorsRef = useRef<any[]>([])
  const explosionsRef = useRef<any[]>([])
  const smokeRef = useRef<any[]>([])
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
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // 从右上角斜着下落
    const startX = canvasWidth * 1.2
    const startY = -canvasHeight * 0.3
    const targetX = target.x * canvasWidth
    const targetY = target.y * canvasHeight

    // 计算角度和速度
    const dx = targetX - startX
    const dy = targetY - startY
    const dist = Math.hypot(dx, dy)
    const speed = 8

    meteorsRef.current.push({
      x: startX,
      y: startY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      size: 25,
      rotation: 0,
      rotationSpeed: 0.15,
      trail: [],
      alive: true,
      smoke: [],
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
      // 更新陨石
      for (let i = meteorsRef.current.length - 1; i >= 0; i--) {
        const m = meteorsRef.current[i]

        // 添加尾迹
        m.trail.push({ x: m.x, y: m.y, alpha: 1 })
        if (m.trail.length > 15) m.trail.shift()
        m.trail.forEach((t: any) => (t.alpha -= 0.07))

        // 添加烟雾
        if (Math.random() > 0.5) {
          m.smoke.push({
            x: m.x + (Math.random() - 0.5) * 10,
            y: m.y + (Math.random() - 0.5) * 10,
            size: Math.random() * 8 + 4,
            alpha: 0.6,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2 - 1,
          })
        }

        // 更新烟雾
        m.smoke.forEach((s: any) => {
          s.x += s.vx
          s.y += s.vy
          s.alpha -= 0.03
          s.size += 0.3
        })
        m.smoke = m.smoke.filter((s: any) => s.alpha > 0)

        // 移动陨石
        m.x += m.vx
        m.y += m.vy
        m.rotation += m.rotationSpeed

        // 检查是否击中目标
        const dx = m.x - targetRef.current.x * canvas.width
        const dy = m.y - targetRef.current.y * canvas.height
        const distToTarget = Math.hypot(dx, dy)

        if (distToTarget < 30) {
          m.alive = false
          // 创建爆炸
          explosionsRef.current.push({
            x: m.x,
            y: m.y,
            radius: 0,
            maxRadius: 42,
            alpha: 1,
            ringRadius: 0,
          })
          // 创建大量烟雾
          for (let j = 0; j < 20; j++) {
            smokeRef.current.push({
              x: m.x + (Math.random() - 0.5) * 20,
              y: m.y + (Math.random() - 0.5) * 20,
              size: Math.random() * 15 + 8,
              alpha: 0.8,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
            })
          }
        }

        if (!m.alive) meteorsRef.current.splice(i, 1)
      }

      // 更新爆炸
      for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const e = explosionsRef.current[i]
        e.radius += 5
        e.ringRadius += 4
        e.alpha -= 0.04
        if (e.alpha <= 0) explosionsRef.current.splice(i, 1)
      }

      // 更新烟雾
      for (let i = smokeRef.current.length - 1; i >= 0; i--) {
        const s = smokeRef.current[i]
        s.x += s.vx
        s.y += s.vy
        s.alpha -= 0.02
        s.size += 0.5
        if (s.alpha <= 0) smokeRef.current.splice(i, 1)
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制烟雾
      smokeRef.current.forEach(s => {
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size)
        g.addColorStop(0, `rgba(100, 80, 60, ${s.alpha * 0.6})`)
        g.addColorStop(0.5, `rgba(80, 60, 40, ${s.alpha * 0.3})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // 绘制陨石
      meteorsRef.current.forEach(m => {
        // 绘制尾迹
        m.trail.forEach((t: any, i: number) => {
          const gradient = ctx.createRadialGradient(
            t.x,
            t.y,
            0,
            t.x,
            t.y,
            m.size * (i / m.trail.length) * 0.8
          )
          gradient.addColorStop(0, `rgba(255, 100, 30, ${t.alpha * 0.8})`)
          gradient.addColorStop(0.5, `rgba(200, 50, 10, ${t.alpha * 0.4})`)
          gradient.addColorStop(1, 'transparent')
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(t.x, t.y, m.size * (i / m.trail.length) * 0.8, 0, Math.PI * 2)
          ctx.fill()
        })

        // 绘制陨石主体
        ctx.save()
        ctx.translate(m.x, m.y)
        ctx.rotate(m.rotation)

        // 陨石主体
        const bodyGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, m.size)
        bodyGradient.addColorStop(0, '#ffaa55')
        bodyGradient.addColorStop(0.3, '#dd6622')
        bodyGradient.addColorStop(0.7, '#884411')
        bodyGradient.addColorStop(1, '#442200')
        ctx.fillStyle = bodyGradient
        ctx.beginPath()
        ctx.arc(0, 0, m.size, 0, Math.PI * 2)
        ctx.fill()

        // 陨石坑细节
        ctx.fillStyle = 'rgba(60, 30, 10, 0.4)'
        ctx.beginPath()
        ctx.arc(-m.size * 0.3, -m.size * 0.2, m.size * 0.25, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(m.size * 0.2, m.size * 0.3, m.size * 0.15, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        // 绘制烟雾
        m.smoke.forEach((s: any) => {
          const gs = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size)
          gs.addColorStop(0, `rgba(120, 80, 50, ${s.alpha * 0.5})`)
          gs.addColorStop(1, 'transparent')
          ctx.fillStyle = gs
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
          ctx.fill()
        })
      })

      // 绘制爆炸
      explosionsRef.current.forEach(e => {
        // 爆炸火球
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.radius)
        g.addColorStop(0, `rgba(255, 255, 200, ${e.alpha})`)
        g.addColorStop(0.2, `rgba(255, 180, 50, ${e.alpha * 0.9})`)
        g.addColorStop(0.5, `rgba(255, 100, 20, ${e.alpha * 0.6})`)
        g.addColorStop(0.8, `rgba(200, 50, 10, ${e.alpha * 0.3})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
        ctx.fill()

        // 冲击波
        ctx.strokeStyle = `rgba(255, 200, 100, ${e.alpha * 0.8})`
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.ringRadius, 0, Math.PI * 2)
        ctx.stroke()

        // 外部光环（缩小光晕范围）
        ctx.strokeStyle = `rgba(255, 150, 50, ${e.alpha * 0.35})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.ringRadius * 1.15, 0, Math.PI * 2)
        ctx.stroke()
      })

      if (
        meteorsRef.current.length === 0 &&
        explosionsRef.current.length === 0 &&
        smokeRef.current.length === 0
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
