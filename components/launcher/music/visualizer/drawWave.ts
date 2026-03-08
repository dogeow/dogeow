import { getPrimaryColor } from './colors'

type RefLike<T> = {
  current: T
}

export function drawWave(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height)

  const step = 6
  const points: Array<{ x: number; y: number }> = []
  for (let i = 0; i < dataArray.length; i += step) {
    const v = dataArray[i] / 128.0
    points.push({
      x: (i / dataArray.length) * width,
      y: (v * height) / 2,
    })
  }
  points.push({ x: width, y: height / 2 })

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length - 1; i++) {
    const cpx = (points[i].x + points[i + 1].x) / 2
    const cpy = (points[i].y + points[i + 1].y) / 2
    ctx.quadraticCurveTo(points[i].x, points[i].y, cpx, cpy)
  }
  const last = points[points.length - 1]
  ctx.lineTo(last.x, last.y)

  const primaryColor = getPrimaryColor()
  ctx.strokeStyle = primaryColor.startsWith('hsl')
    ? `${primaryColor.replace(')', '')} / 0.9)`
    : primaryColor
  ctx.lineWidth = 2.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.lineTo(width, height)
  ctx.lineTo(0, height)
  ctx.closePath()

  ctx.fillStyle = primaryColor.startsWith('hsl')
    ? `${primaryColor.replace(')', '')} / 0.2)`
    : primaryColor
  ctx.fill()
}

export function drawWaveformHistory(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  waveformHistoryRef: RefLike<number[][]>,
  maxHistoryLength: number
) {
  const history = waveformHistoryRef.current
  history.unshift(Array.from(dataArray).map(val => val / 255))

  const maxFrames = Math.max(maxHistoryLength, Math.floor(width))
  if (history.length > maxFrames) {
    history.pop()
  }

  ctx.clearRect(0, 0, width, height)
  if (history.length === 0) return

  const frameWidth = width / maxFrames
  const primaryColor = getPrimaryColor()
  const points: Array<{ x: number; y: number }> = []

  ctx.beginPath()
  for (let frameIndex = 0; frameIndex < history.length; frameIndex++) {
    const frame = history[frameIndex]
    const avg = frame.reduce((sum, val) => sum + val, 0) / frame.length
    const x = frameIndex * frameWidth
    const y = height - avg * height * 0.9
    points.push({ x, y })

    if (frameIndex === 0) {
      ctx.moveTo(x, y)
    } else {
      const prevPoint = points[frameIndex - 1]
      const cpX = (prevPoint.x + x) / 2
      const cpY = (prevPoint.y + y) / 2
      ctx.quadraticCurveTo(cpX, cpY, x, y)
    }
  }

  if (points.length > 0) {
    ctx.lineTo(points[points.length - 1].x, height)
    ctx.lineTo(0, height)
  } else {
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
  }
  ctx.closePath()

  ctx.fillStyle = primaryColor.startsWith('hsl')
    ? `${primaryColor.replace(')', '')} / 0.8)`
    : primaryColor
  ctx.fill()
  ctx.strokeStyle = primaryColor.startsWith('hsl')
    ? `${primaryColor.replace(')', '')} / 0.9)`
    : primaryColor
  ctx.lineWidth = 2
  ctx.stroke()
}
