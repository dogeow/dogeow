'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

/** 技能特效类型 */
export type SkillEffectType =
  | 'meteor-storm'
  | 'fireball'
  | 'ice-arrow'
  | 'blackhole'
  | 'heal'
  | 'lightning'

/** 技能特效组件属性 */
export interface SkillEffectProps {
  /** 技能类型 */
  type: SkillEffectType
  /** 是否激活特效 */
  active: boolean
  /** 持续时间（毫秒） */
  duration?: number
  /** 目标位置（0-1 之间的相对坐标） */
  targetPosition?: { x: number; y: number }
  /** 回调：特效结束 */
  onComplete?: () => void
  /** 自定义样式类 */
  className?: string
}

/** 流星火雨特效 */
function MeteorStormEffect({
  active,
  onComplete,
  targetPosition,
}: {
  active: boolean
  onComplete?: () => void
  targetPosition?: { x: number; y: number }
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const meteorsRef = useRef<any[]>([])
  const explosionsRef = useRef<any[]>([])
  const firesRef = useRef<any[]>([])
  const rafRef = useRef<number>(0)
  const targetRef = useRef({ x: 0.5, y: 0.5 })

  // 更新目标位置
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

    // 初始一批流星 - 落向目标位置（使用百分比坐标）
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

    // 持续产生流星 - 落向目标位置
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

  useEffect(() => {
    if (active && !isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true)
      cast()
    }
  }, [active, isActive, cast])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const update = () => {
      // 获取 canvas 实际渲染尺寸用于绘制
      const canvasWidth = canvas.clientWidth || 400
      const canvasHeight = canvas.clientHeight || 300

      // 更新流星 - 使用百分比坐标转换为绝对坐标
      for (let i = meteorsRef.current.length - 1; i >= 0; i--) {
        const m = meteorsRef.current[i]

        // 初始化或更新绝对坐标
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
          // 爆炸
          explosionsRef.current.push({
            x: m.x,
            y: m.y,
            radius: 0,
            maxRadius: 40,
            alpha: 1,
          })
          // 火焰
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

      // 更新爆炸
      for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const e = explosionsRef.current[i]
        e.radius += 3
        e.alpha -= 0.08
        if (e.alpha <= 0) explosionsRef.current.splice(i, 1)
      }

      // 更新火焰
      for (let i = firesRef.current.length - 1; i >= 0; i--) {
        const f = firesRef.current[i]
        f.life -= 0.005
        if (f.radius < f.maxRadius) f.radius += 0.3
        if (f.life <= 0) firesRef.current.splice(i, 1)
      }

      // 绘制
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 流星
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

      // 爆炸
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

      // 火焰
      firesRef.current.forEach(f => {
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius)
        g.addColorStop(0, `rgba(255, 80, 10, ${f.life * 0.5})`)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.ellipse(f.x, f.y, f.radius * 1.2, f.radius * 0.3, 0, 0, Math.PI * 2)
        ctx.fill()
        // 火焰苗
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

      // 检查是否结束
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

/** 火球特效 */
function FireballEffect({
  active,
  onComplete,
  targetPosition,
}: {
  active: boolean
  onComplete?: () => void
  targetPosition?: { x: number; y: number }
}) {
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

  useEffect(() => {
    if (active && !isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true)
      cast()
    }
  }, [active, isActive, cast])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const update = () => {
      // 更新火球
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

      // 更新爆炸
      for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
        const e = explosionsRef.current[i]
        e.radius += 4
        e.alpha -= 0.06
        if (e.alpha <= 0) explosionsRef.current.splice(i, 1)
      }

      // 绘制
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

/** 冰箭特效 */
function IceArrowEffect({
  active,
  onComplete,
  targetPosition,
}: {
  active: boolean
  onComplete?: () => void
  targetPosition?: { x: number; y: number }
}) {
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

  useEffect(() => {
    if (active && !isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true)
      cast()
    }
  }, [active, isActive, cast])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const update = () => {
      // 更新冰箭
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

      // 更新冲击
      for (let i = impactsRef.current.length - 1; i >= 0; i--) {
        const imp = impactsRef.current[i]
        imp.radius += 5
        imp.alpha -= 0.05
        if (imp.alpha <= 0) impactsRef.current.splice(i, 1)
      }

      // 更新冰霜
      for (let i = frostRef.current.length - 1; i >= 0; i--) {
        const f = frostRef.current[i]
        f.life -= 0.008
        if (f.radius < f.maxRadius) f.radius += 1
        if (f.life <= 0) frostRef.current.splice(i, 1)
      }

      // 绘制
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

/** 黑洞特效 */
function BlackholeEffect({
  active,
  onComplete,
  targetPosition,
}: {
  active: boolean
  onComplete?: () => void
  targetPosition?: { x: number; y: number }
}) {
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

  useEffect(() => {
    if (active && !isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true)
      cast()
      setTimeout(() => {
        if (blackholeRef.current) blackholeRef.current.active = false
      }, 3000)
    }
  }, [active, isActive, cast])

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

      // 粒子
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

      // 绘制
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (bh.radius > 0) {
        const a = bh.active ? 1 : bh.radius / bh.maxRadius

        // 外环
        for (let i = 0; i < 3; i++) {
          const r = bh.radius * (1.2 + i * 0.3)
          ctx.beginPath()
          ctx.arc(bh.x, bh.y, r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(168, 85, 247, ${a * (0.3 - i * 0.1)})`
          ctx.lineWidth = 2
          ctx.stroke()
        }

        // 粒子
        particlesRef.current.forEach(p => {
          ctx.fillStyle = `rgba(180, 120, 255, ${p.alpha})`
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        })

        // 黑洞本体
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

/** 雷击特效 */
function LightningEffect({
  active,
  onComplete,
  targetPosition,
}: {
  active: boolean
  onComplete?: () => void
  targetPosition?: { x: number; y: number }
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boltsRef = useRef<any[]>([])
  const impactsRef = useRef<any[]>([])
  const rafRef = useRef<number>(0)
  const [isActive, setIsActive] = useState(false)
  const targetRef = useRef({ x: 0.5, y: 0.5 })

  // 生成闪电片段
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

  useEffect(() => {
    if (targetPosition) {
      targetRef.current = targetPosition
    }
  }, [targetPosition])

  const cast = useCallback(() => {
    const target = targetRef.current

    // 产生雷击
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

    // 延迟产生第二道雷击
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

    // 落地冲击
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

  useEffect(() => {
    if (active && !isActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true)
      cast()
      // 2秒后再释放一次
      setTimeout(() => {
        cast()
      }, 2000)
    }
  }, [active, isActive, cast])

  useEffect(() => {
    if (!isActive) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const update = () => {
      const canvasWidth = canvas.clientWidth || 400
      const canvasHeight = canvas.clientHeight || 300

      // 更新闪电
      for (let i = boltsRef.current.length - 1; i >= 0; i--) {
        const bolt = boltsRef.current[i]

        if (!bolt.initialized) {
          bolt.x = bolt.xPct * canvasWidth
          bolt.y = bolt.yPct * canvasHeight
          bolt.targetX = bolt.targetXPct * canvasWidth
          bolt.targetY = bolt.targetYPct * canvasHeight
          bolt.initialized = true
        }

        // 闪电逐渐消失
        bolt.alpha -= 0.05

        if (bolt.alpha <= 0) {
          boltsRef.current.splice(i, 1)
        }
      }

      // 更新冲击波
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

      // 绘制
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // 绘制闪电
      boltsRef.current.forEach(bolt => {
        // 闪光效果
        if (bolt.flash) {
          ctx.fillStyle = `rgba(255, 255, 255, ${bolt.alpha * 0.5})`
          ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        }

        // 绘制闪电主干
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

        // 内部亮线
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

      // 绘制冲击波
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

/** 技能特效组件 */
export function SkillEffect({
  type,
  active,
  duration = 3000,
  targetPosition,
  onComplete,
  className = '',
}: SkillEffectProps) {
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    if (active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true)
    }
  }, [active])

  const handleComplete = useCallback(() => {
    setIsActive(false)
    if (onComplete) onComplete()
  }, [onComplete])

  return (
    <div className={`${className}`}>
      {type === 'meteor-storm' && (
        <MeteorStormEffect
          active={isActive}
          onComplete={handleComplete}
          targetPosition={targetPosition}
        />
      )}
      {type === 'fireball' && (
        <FireballEffect
          active={isActive}
          onComplete={handleComplete}
          targetPosition={targetPosition}
        />
      )}
      {type === 'ice-arrow' && (
        <IceArrowEffect
          active={isActive}
          onComplete={handleComplete}
          targetPosition={targetPosition}
        />
      )}
      {type === 'blackhole' && (
        <BlackholeEffect
          active={isActive}
          onComplete={handleComplete}
          targetPosition={targetPosition}
        />
      )}
      {type === 'lightning' && (
        <LightningEffect
          active={isActive}
          onComplete={handleComplete}
          targetPosition={targetPosition}
        />
      )}
    </div>
  )
}
