'use client'

/**
 * 圆形进度条组件（用于 HP/MP 显示）
 */
export function CircularProgress({
  percent,
  color,
  size = 'sm',
}: {
  percent: number
  color: 'red' | 'blue'
  size?: 'sm'
}) {
  const pct = Math.max(0, Math.min(100, percent))
  const r = size === 'sm' ? 8 : 10
  const cx = r
  const cy = r
  const fillClass =
    color === 'red' ? 'fill-red-500 dark:fill-red-400' : 'fill-blue-500 dark:fill-blue-400'
  const clipId = `rpg-hpmp-clip-${color}-${size}-${r}`

  const level = cy + r - (2 * r * pct) / 100
  const dy = level - cy
  const dx2 = r * r - dy * dy
  const dx = dx2 > 0 ? Math.sqrt(dx2) : 0

  let clipPathD = ''
  if (pct > 0 && pct < 100) {
    const largeArc = level <= cy ? 1 : 0
    clipPathD = `M ${cx + dx} ${level} A ${r} ${r} 0 ${largeArc} 1 ${cx - dx} ${level} L ${cx + dx} ${level} Z`
  } else if (pct >= 100) {
    clipPathD = `M ${cx} ${cy} m -${r} 0 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 -${r * 2} 0`
  }

  return (
    <svg width={r * 2} height={r * 2} className="shrink-0" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          {clipPathD ? <path d={clipPathD} /> : <path d="M0 0L0 0Z" />}
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} className="fill-muted" />
      {pct > 0 && (
        <g clipPath={`url(#${clipId})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            className={`${fillClass} transition-[clip-path] duration-300`}
          />
        </g>
      )}
    </svg>
  )
}
