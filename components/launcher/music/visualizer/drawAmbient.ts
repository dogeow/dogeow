import { getBackgroundInfo, getPrimaryColor } from './colors'

type RefLike<T> = {
  current: T
}

type ParticleStar = {
  x: number
  y: number
  z: number
  prevX: number
  prevY: number
}

type SilkDrop = {
  x: number
  y: number
  len: number
  speed: number
  alpha: number
  hue: number
  vx?: number
  seed?: number
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  particlesRef: RefLike<ParticleStar[]>
) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
  ctx.fillRect(0, 0, width, height)

  const stars = particlesRef.current
  const primaryColor = getPrimaryColor()
  const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255
  const bass = dataArray.slice(0, 4).reduce((sum, val) => sum + val, 0) / 4 / 255
  const targetCount = Math.floor(20 + avg * 180)

  while (stars.length > targetCount) stars.pop()
  while (stars.length < targetCount) {
    stars.push({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * 1000 + 200,
      prevX: 0,
      prevY: 0,
    })
  }

  let baseHue = 35
  if (primaryColor.startsWith('hsl')) {
    const parts = primaryColor.replace(')', '').replace('hsl(', '').split(/\s+/)
    baseHue = parseFloat(parts[0]) || 35
  }

  const cx = width / 2
  const cy = height / 2
  const speed = 1.5 + avg * 10 + bass * 5

  for (const star of stars) {
    star.prevX = (star.x / star.z) * 400 + cx
    star.prevY = (star.y / star.z) * 400 + cy
    star.z -= speed

    if (star.z <= 1) {
      star.x = (Math.random() - 0.5) * width * 2
      star.y = (Math.random() - 0.5) * height * 2
      star.z = 800 + Math.random() * 200
      star.prevX = (star.x / star.z) * 400 + cx
      star.prevY = (star.y / star.z) * 400 + cy
    }

    const sx = (star.x / star.z) * 400 + cx
    const sy = (star.y / star.z) * 400 + cy
    const depth = 1 - star.z / 1000
    const alpha = depth * (0.4 + avg * 0.6)
    const lineW = depth * (1 + bass * 1.5)

    ctx.beginPath()
    ctx.moveTo(star.prevX, star.prevY)
    ctx.lineTo(sx, sy)
    ctx.strokeStyle = `hsla(${baseHue + depth * 30}, 65%, ${75 + depth * 20}%, ${alpha})`
    ctx.lineWidth = lineW
    ctx.lineCap = 'round'
    ctx.stroke()
  }
}

export function drawSilk(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  silkPointsRef: RefLike<SilkDrop[]>,
  canvasEl?: HTMLCanvasElement | null
) {
  const bg = getBackgroundInfo(canvasEl)
  ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.98)`
  ctx.fillRect(0, 0, width, height)

  const drops = silkPointsRef.current
  const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length / 255
  const bass = dataArray.slice(0, 4).reduce((sum, val) => sum + val, 0) / 4 / 255
  const baseHue = 210
  const baseSpawn = Math.floor(1 + avg * 3)
  const spawnCount = Math.random() < 0.3 + avg * 0.7 ? Math.max(0, Math.floor(baseSpawn / 2)) : 0

  for (let i = 0; i < spawnCount && drops.length < 100; i++) {
    drops.push({
      x: (Math.random() - 0.05) * width,
      y: -Math.random() * 20,
      len: 5,
      speed: 4 + Math.random() * 6 + avg * 8,
      alpha: 0.4 + Math.random() * 0.3 + avg * 0.3,
      hue: baseHue + Math.random() * 20 - 10,
      vx: (Math.random() - 0.5) * 0.3,
      seed: Math.random() * 1000,
    })
  }

  const t = performance.now() / 1000
  const windMain = avg * 4 + bass * 2

  for (let i = drops.length - 1; i >= 0; i--) {
    const drop = drops[i]
    const localGust = Math.sin((drop.seed ?? 0) + t * 0.18 + drop.y * 0.003) * (avg * 0.6)
    const localWind = windMain * 0.6 + localGust
    const vxPrev = drop.vx ?? 0
    drop.vx = vxPrev + (localWind - vxPrev) * 0.03 + (Math.random() - 0.5) * 0.01
    drop.vx *= 0.995

    if (Math.random() < 0.005 * (avg + 0.2)) {
      drop.vx += (Math.random() < 0.5 ? -1 : 1) * (0.2 + Math.random() * 0.4)
    }

    drop.y += drop.speed
    drop.x += drop.vx

    if (drop.y > height + drop.len || drop.x > width + 40 || drop.x < -40) {
      drops.splice(i, 1)
      continue
    }

    const dx = (drop.vx ?? 0) * (drop.len / drop.speed)
    ctx.beginPath()
    ctx.setLineDash([])
    ctx.moveTo(drop.x, drop.y)
    ctx.lineTo(drop.x - dx, drop.y - drop.len)
    ctx.strokeStyle = bg.isLight
      ? `hsla(${drop.hue}, 30%, 25%, ${Math.min(0.9, drop.alpha + 0.1)})`
      : `hsla(${drop.hue}, 55%, 80%, ${drop.alpha})`
    ctx.lineWidth = 1
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  if (avg > 0.15) {
    const gradient = ctx.createLinearGradient(0, height - 30, 0, height)
    gradient.addColorStop(0, `hsla(${baseHue}, 40%, 70%, 0)`)
    gradient.addColorStop(1, `hsla(${baseHue}, 40%, 70%, ${avg * 0.15})`)
    ctx.fillStyle = gradient
    ctx.fillRect(0, height - 30, width, 30)
  }
}
