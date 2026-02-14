'use client'

import { Coins } from 'lucide-react'

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

export type CopperDisplayProps = {
  copper: number
  size?: Size
  className?: string
  /** 为 true 时强制单行不换行（如商店格子内） */
  nowrap?: boolean
}

/** 用 Lucide Coins 图标 + 金/银/铜颜色展示货币 */
export function CopperDisplay({
  copper,
  size = 'sm',
  className = '',
  nowrap = false,
}: CopperDisplayProps) {
  const { g, s, c } = parseCopper(copper)
  const parts: { value: number; color: string }[] = []
  if (g > 0) parts.push({ value: g, color: 'text-yellow-600 dark:text-yellow-400' })
  if (s > 0) parts.push({ value: s, color: 'text-gray-500 dark:text-gray-400' })
  if (c > 0 || parts.length === 0)
    parts.push({ value: c, color: 'text-amber-600 dark:text-amber-500' })

  const { icon, text } = SIZE_CLASS[size]

  return (
    <span
      className={`inline-flex items-center gap-x-1 gap-y-0.5 ${text} ${nowrap ? 'flex-nowrap' : 'flex-wrap'} ${className}`}
    >
      {parts.map(({ value, color }, i) => (
        <span key={i} className={`inline-flex items-center gap-0.5 ${color}`}>
          <Coins className={icon} aria-hidden />
          <span>{value}</span>
        </span>
      ))}
    </span>
  )
}
