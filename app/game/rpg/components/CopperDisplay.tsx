'use client'

import { useId } from 'react'

/** 1金=100银=10000铜 */
function parseCopper(copper: number) {
  const g = Math.floor(copper / 10000)
  const s = Math.floor((copper % 10000) / 100)
  const c = copper % 100
  return { g, s, c }
}

const SIZE_CLASS = {
  xs: { icon: 'h-2.5 w-2.5', text: 'text-[9px]' },
  sm: { icon: 'h-3 w-3', text: 'text-xs' },
  md: { icon: 'h-3.5 w-3.5', text: 'text-sm' },
} as const

type Size = keyof typeof SIZE_CLASS
type CoinVariant = 'gold' | 'silver' | 'copper'

/** 扁平硬币造型：自上而下线性渐变 + 深色描边模拟币缘 */
function CoinIcon({
  variant,
  className,
  uid,
}: {
  variant: CoinVariant
  className?: string
  uid: string
}) {
  const gradients: Record<CoinVariant, { light: string; dark: string; edge: string }> = {
    gold: { light: '#fef08a', dark: '#ca8a04', edge: '#a16207' },
    silver: { light: '#f3f4f6', dark: '#9ca3af', edge: '#6b7280' },
    copper: { light: '#fbbf24', dark: '#92400e', edge: '#78350f' },
  }
  const { light, dark, edge } = gradients[variant]
  const id = `${uid}-coin-${variant}`
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${id})`} stroke={edge} strokeWidth="0.8" />
    </svg>
  )
}

export type CopperDisplayProps = {
  copper: number
  size?: Size
  className?: string
  /** 为 true 时强制单行不换行（如商店格子内） */
  nowrap?: boolean
  /** 最多显示几种货币（1=只显示一种：金/银/铜取最高位） */
  maxParts?: number
}

/** 用带质感的单圆图标 + 金/银/铜颜色展示货币 */
export function CopperDisplay({
  copper,
  size = 'sm',
  className = '',
  nowrap = false,
  maxParts = 2,
}: CopperDisplayProps) {
  const uid = useId()
  const { g, s, c } = parseCopper(copper)
  const parts: { value: number; color: string; variant: CoinVariant }[] = []
  if (g > 0)
    parts.push({ value: g, color: 'text-yellow-600 dark:text-yellow-400', variant: 'gold' })
  if (s > 0) parts.push({ value: s, color: 'text-gray-500 dark:text-gray-400', variant: 'silver' })
  if (c > 0 || parts.length === 0)
    parts.push({ value: c, color: 'text-amber-600 dark:text-amber-500', variant: 'copper' })
  const displayParts = parts.slice(0, maxParts)

  const { icon, text } = SIZE_CLASS[size]

  return (
    <span
      className={`inline-flex items-center gap-x-1 gap-y-0.5 ${text} ${nowrap ? 'flex-nowrap' : 'flex-wrap'} ${className}`}
    >
      {displayParts.map(({ value, color, variant }, i) => (
        <span key={i} className={`inline-flex items-center gap-0.5 ${color}`}>
          <CoinIcon variant={variant} className={icon} uid={uid} />
          <span>{value}</span>
        </span>
      ))}
    </span>
  )
}
