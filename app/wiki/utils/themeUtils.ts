import type { ThemeColors } from '../types'

export const LIGHT_FALLBACK: ThemeColors = {
  background: '#ffffff',
  foreground: '#111827',
  card: '#ffffff',
  cardForeground: '#111827',
  mutedForeground: '#64748b',
  border: '#e5e7eb',
  primary: '#2563eb',
  ring: '#60a5fa',
  accent: '#38bdf8',
}

export const DARK_FALLBACK: ThemeColors = {
  background: '#0b0b0b',
  foreground: '#f8fafc',
  card: '#111827',
  cardForeground: '#f8fafc',
  mutedForeground: '#94a3b8',
  border: '#1f2937',
  primary: '#60a5fa',
  ring: '#38bdf8',
  accent: '#22d3ee',
}

export const withAlpha = (color: string, alpha: number, fallback: string): string => {
  const trimmed = color.trim()
  if (!trimmed) return fallback
  const rgbMatch = trimmed.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i)
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  const hexMatch = trimmed.match(/^#([0-9a-f]{3,8})$/i)
  if (hexMatch) {
    const hex = hexMatch[1]
    const isShort = hex.length <= 4
    const normalize = (value: string) =>
      isShort ? parseInt(value + value, 16) : parseInt(value, 16)
    const r = normalize(hex.slice(0, isShort ? 1 : 2))
    const g = normalize(hex.slice(isShort ? 1 : 2, isShort ? 2 : 4))
    const b = normalize(hex.slice(isShort ? 2 : 3, isShort ? 3 : 6))
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return fallback
}

export const nodeDataToWikiNode = (node: {
  id: string | number
  title: string
  slug: string
  tags?: string[]
  summary?: string
}): {
  id: number
  title: string
  slug: string
  tags?: string[]
  summary?: string
} => ({
  id: Number(node.id),
  title: node.title,
  slug: node.slug || '',
  tags: node.tags,
  summary: node.summary,
})
