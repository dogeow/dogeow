type RgbColor = {
  r: number
  g: number
  b: number
}

export type BackgroundInfo = RgbColor & {
  isLight: boolean
}

export const getPrimaryColor = (): string => {
  if (typeof window !== 'undefined') {
    const style = getComputedStyle(document.documentElement)
    return style.getPropertyValue('--primary').trim() || 'hsl(35 97% 55%)'
  }
  return 'hsl(35 97% 55%)'
}

export const parseCssColor = (css: string): RgbColor | null => {
  if (!css) return null
  css = css.trim()

  if (css.startsWith('#')) {
    const hex = css.slice(1)
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map(h => h + h)
            .join('')
        : hex
    const bigint = parseInt(full, 16)
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    }
  }

  const nums = css.match(/-?[\d.]+%?/g)
  if (nums && (css.startsWith('rgb') || css.startsWith('rgba'))) {
    return {
      r: parseInt(nums[0].replace('%', ''), 10) || 0,
      g: parseInt(nums[1].replace('%', ''), 10) || 0,
      b: parseInt(nums[2].replace('%', ''), 10) || 0,
    }
  }

  if (nums && (css.startsWith('hsl') || css.startsWith('hsla'))) {
    const h = parseFloat(nums[0])
    const s = parseFloat(nums[1].replace('%', '')) / 100
    const l = parseFloat(nums[2].replace('%', '')) / 100
    const c = (1 - Math.abs(2 * l - 1)) * s
    const hh = (h / 60) % 6
    const x = c * (1 - Math.abs((hh % 2) - 1))
    let r1 = 0
    let g1 = 0
    let b1 = 0

    if (0 <= hh && hh < 1) {
      r1 = c
      g1 = x
    } else if (1 <= hh && hh < 2) {
      r1 = x
      g1 = c
    } else if (2 <= hh && hh < 3) {
      g1 = c
      b1 = x
    } else if (3 <= hh && hh < 4) {
      g1 = x
      b1 = c
    } else if (4 <= hh && hh < 5) {
      r1 = x
      b1 = c
    } else {
      r1 = c
      b1 = x
    }

    const m = l - c / 2
    return {
      r: Math.round((r1 + m) * 255),
      g: Math.round((g1 + m) * 255),
      b: Math.round((b1 + m) * 255),
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const el = document.createElement('div')
      el.style.color = css
      el.style.display = 'none'
      document.documentElement.appendChild(el)
      const resolved = getComputedStyle(el).color
      document.documentElement.removeChild(el)
      const match = resolved.match(/rgba?\(([^)]+)\)/)
      if (match) {
        const parts = match[1].split(',').map(part => part.trim())
        return {
          r: parseInt(parts[0], 10) || 0,
          g: parseInt(parts[1], 10) || 0,
          b: parseInt(parts[2], 10) || 0,
        }
      }
    } catch {
      return null
    }
  }

  return null
}

export const findNearestBackgroundColor = (el?: HTMLElement | null): string => {
  if (typeof window === 'undefined') return ''
  let node: HTMLElement | null = el || document.body

  while (node) {
    try {
      const style = getComputedStyle(node)
      const bg = style.backgroundColor || style.getPropertyValue('--background') || ''
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return bg
    } catch {
      return ''
    }
    node = node.parentElement
  }

  return ''
}

export const getBackgroundInfo = (el?: HTMLElement | null): BackgroundInfo => {
  if (typeof window === 'undefined') return { r: 0, g: 0, b: 0, isLight: false }

  let cssBg = ''
  try {
    cssBg = findNearestBackgroundColor(el) || ''
  } catch {
    cssBg = ''
  }

  const rgb = parseCssColor(cssBg)
  if (!rgb) {
    const isLight = Boolean(
      window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    )
    return isLight
      ? { r: 255, g: 255, b: 255, isLight: true }
      : { r: 0, g: 0, b: 0, isLight: false }
  }

  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  return { ...rgb, isLight: luminance > 0.6 }
}
