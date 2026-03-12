import { getPrimaryColor } from './colors'

const RAINBOW_STOPS = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3']

function getRainbowBarColor(index: number, total: number) {
  if (total <= 1) {
    return RAINBOW_STOPS[0]
  }

  const paletteIndex = Math.round((index / (total - 1)) * (RAINBOW_STOPS.length - 1))
  return RAINBOW_STOPS[Math.max(0, Math.min(RAINBOW_STOPS.length - 1, paletteIndex))]
}

type BasicBarConfig = {
  barCount: number
  barWidth: number
  barGap: number
  barColor: string
  showGradient: boolean
  fitWidth: boolean
  barFillRatio: number
}

export function drawBars(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  config: BasicBarConfig
) {
  const { barCount, barWidth, barGap, barColor, showGradient, fitWidth, barFillRatio } = config
  const barCountActual = Math.min(barCount, dataArray.length)
  const fillRatio = Math.max(0.1, Math.min(1, barFillRatio))

  ctx.clearRect(0, 0, width, height)

  const widths = fitWidth
    ? (() => {
        const totalGap = Math.max(0, (barCountActual - 1) * barGap)
        const availableWidth = Math.max(0, width - totalGap)
        const effectiveWidth = Math.max(0, Math.floor(availableWidth * fillRatio))
        const baseWidth = Math.floor(effectiveWidth / Math.max(1, barCountActual))
        let remainder = effectiveWidth - baseWidth * barCountActual

        return new Array(barCountActual)
          .fill(baseWidth)
          .map(() => (remainder-- > 0 ? baseWidth + 1 : baseWidth))
      })()
    : new Array(barCountActual).fill(Math.max(1, Math.round(barWidth * fillRatio)))

  const totalBarWidth =
    widths.reduce((sum, currentWidth) => sum + currentWidth, 0) + (barCountActual - 1) * barGap
  const startX = (width - totalBarWidth) / 2

  let currentX = startX
  for (let i = 0; i < barCountActual; i++) {
    const value = dataArray[i] / 255
    const h = value * height * 0.9
    const slotWidth = Math.max(1, Math.round(widths[i] ?? barWidth))
    const w = slotWidth
    const x = Math.round(currentX)
    const hRounded = Math.max(1, Math.round(h))
    const y = Math.round(height - hRounded)

    if (showGradient) {
      const gradient = ctx.createLinearGradient(x, y, x, height)
      const hue = (i / barCountActual) * 360
      gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`)
      gradient.addColorStop(1, `hsl(${hue + 30}, 70%, 40%)`)
      ctx.fillStyle = gradient
    } else if (barColor === 'rainbow') {
      ctx.fillStyle = getRainbowBarColor(i, barCountActual)
    } else {
      ctx.fillStyle = barColor
    }

    if (ctx.roundRect) {
      ctx.beginPath()
      ctx.roundRect(x, y, w, hRounded, 2)
      ctx.fill()
    } else {
      ctx.fillRect(x, y, w, hRounded)
    }

    currentX += slotWidth + barGap
  }
}

export function drawBars6(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height)

  const barCount6 = 7
  const gap = 10
  const totalGap = gap * (barCount6 - 1)
  const availableWidth = Math.max(0, width - totalGap)
  const baseW = Math.floor(availableWidth / barCount6)
  let remainder = availableWidth - baseW * barCount6
  const widths = new Array(barCount6).fill(baseW).map(() => (remainder-- > 0 ? baseW + 1 : baseW))
  let x = 0
  for (let i = 0; i < barCount6; i++) {
    const dataIndex = Math.floor((i / barCount6) * dataArray.length)
    const value = dataArray[dataIndex] / 255
    const h = Math.round(value * height * 0.95)
    const w = Math.max(1, widths[i])
    const y = Math.max(0, height - h)
    const baseColor = getRainbowBarColor(i, barCount6)
    ctx.fillStyle = baseColor

    if (ctx.roundRect) {
      ctx.beginPath()
      ctx.roundRect(x, y, w, h, 8)
      ctx.fill()
    } else {
      ctx.fillRect(x, y, w, h)
    }

    x += w + gap
  }
}

export function drawBarSingle(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height)

  const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length
  const h = (avg / 255) * height * 0.95
  const barW = width * 0.8
  const x = (width - barW) / 2
  const y = height - h
  const primaryColor = getPrimaryColor()

  ctx.fillStyle = primaryColor.startsWith('hsl')
    ? `${primaryColor.replace(')', '')} / ${0.7 + (avg / 255) * 0.3})`
    : primaryColor

  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(x, y, barW, h, 12)
  } else {
    const radius = 12
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + barW - radius, y)
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius)
    ctx.lineTo(x + barW, y + h - radius)
    ctx.quadraticCurveTo(x + barW, y + h, x + barW - radius, y + h)
    ctx.lineTo(x + radius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }
  ctx.fill()
}
