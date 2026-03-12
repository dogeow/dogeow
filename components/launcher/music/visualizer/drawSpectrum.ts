type RefLike<T> = {
  current: T
}

const RAINBOW_STOPS = [
  [255, 0, 0],
  [255, 127, 0],
  [255, 255, 0],
  [0, 255, 0],
  [0, 0, 255],
  [75, 0, 130],
  [148, 0, 211],
] as const

function getSpectrumRainbowColor(index: number, total: number) {
  if (total <= 1) {
    const [r, g, b] = RAINBOW_STOPS[0]
    return { r, g, b }
  }

  const scaled = (index / (total - 1)) * (RAINBOW_STOPS.length - 1)
  const baseIndex = Math.floor(scaled)
  const nextIndex = Math.min(RAINBOW_STOPS.length - 1, baseIndex + 1)
  const ratio = scaled - baseIndex
  const [r1, g1, b1] = RAINBOW_STOPS[baseIndex]
  const [r2, g2, b2] = RAINBOW_STOPS[nextIndex]

  return {
    r: Math.round(r1 + (r2 - r1) * ratio),
    g: Math.round(g1 + (g2 - g1) * ratio),
    b: Math.round(b1 + (b2 - b1) * ratio),
  }
}

export function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number,
  spectrumSmoothedRef: RefLike<Float32Array | null>
) {
  ctx.clearRect(0, 0, width, height)
  const barCountSpectrum = 64
  const gap = 2
  const totalGap = gap * (barCountSpectrum - 1)
  const availableWidth = Math.max(0, width - totalGap)
  const baseW = Math.floor(availableWidth / barCountSpectrum)
  let remainder = availableWidth - baseW * barCountSpectrum
  const widths = new Array(barCountSpectrum)
    .fill(baseW)
    .map(() => (remainder-- > 0 ? baseW + 1 : baseW))

  if (!spectrumSmoothedRef.current || spectrumSmoothedRef.current.length !== barCountSpectrum) {
    spectrumSmoothedRef.current = new Float32Array(barCountSpectrum)
  }

  const smoothed = spectrumSmoothedRef.current
  const smoothUp = 0.35
  const smoothDown = 0.12

  let x = 0
  for (let i = 0; i < barCountSpectrum; i++) {
    const dataIndex = Math.floor((i / barCountSpectrum) * dataArray.length)
    const rawValue = Math.max(0, Math.min(1, dataArray[dataIndex] / 255))
    const prev = smoothed[i]
    smoothed[i] =
      rawValue > prev ? prev + (rawValue - prev) * smoothUp : prev + (rawValue - prev) * smoothDown

    const value = smoothed[i]
    const w = Math.max(1, widths[i])
    const h = Math.max(1, Math.round(value * height * 0.92))
    const y = height - h
    const radius = Math.min(3, w / 2)
    const { r, g, b } = getSpectrumRainbowColor(i, barCountSpectrum)

    const gradient = ctx.createLinearGradient(x, y, x, height)
    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.7 + value * 0.3})`)
    gradient.addColorStop(
      0.5,
      `rgba(${Math.round(r * 0.88)}, ${Math.round(g * 0.88)}, ${Math.round(b * 0.88)}, ${0.6 + value * 0.4})`
    )
    gradient.addColorStop(
      1,
      `rgba(${Math.round(r * 0.62)}, ${Math.round(g * 0.62)}, ${Math.round(b * 0.62)}, ${0.5 + value * 0.3})`
    )
    ctx.fillStyle = gradient

    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, [radius, radius, 0, 0])
    } else {
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + w - radius, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
      ctx.lineTo(x + w, y + h)
      ctx.lineTo(x, y + h)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
    }
    ctx.fill()

    if (h > 4) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + value * 0.18})`
      ctx.fillRect(x + 1, y, w - 2, Math.min(3, h * 0.15))
    }

    const reflectH = Math.min(h * 0.25, 30)
    if (reflectH > 2) {
      const reflectGrad = ctx.createLinearGradient(x, height, x, height + reflectH)
      reflectGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.15 * value})`)
      reflectGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      ctx.fillStyle = reflectGrad
      ctx.fillRect(x, height, w, reflectH)
    }

    x += w + gap
  }
}
