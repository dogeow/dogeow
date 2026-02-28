'use client'

import type { GameItem } from '../../types'

type SocketVariant = 'compact' | 'detail'
type SocketSize = 'sm' | 'md'

interface ItemSocketIndicatorsProps {
  item: Pick<GameItem, 'sockets' | 'gems'>
  className?: string
  size?: SocketSize
  variant?: SocketVariant
}

const SIZE_CLASSES: Record<SocketSize, string> = {
  sm: 'h-3.5 w-3.5 text-[6px]',
  md: 'h-4 w-4 text-[6px]',
}

const EMPTY_SOCKET_CLASSES: Record<SocketVariant, string> = {
  compact: 'border-black/50 bg-gray-600 text-gray-300',
  detail: 'border-gray-500 bg-gray-700 text-gray-400',
}

export function ItemSocketIndicators({
  item,
  className,
  size = 'sm',
  variant = 'compact',
}: ItemSocketIndicatorsProps) {
  if (!item.sockets || item.sockets <= 0) return null

  const gemCount = item.gems?.length ?? 0
  const classes = ['flex -space-x-1', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {Array.from({ length: item.sockets }).map((_, idx) => {
        const isFilled = idx < gemCount

        return (
          <span
            key={idx}
            className={`flex items-center justify-center rounded-full border font-medium ${
              SIZE_CLASSES[size]
            } ${
              isFilled ? 'border-cyan-400 bg-cyan-500 text-white' : EMPTY_SOCKET_CLASSES[variant]
            }`}
          >
            {isFilled ? '💎' : ''}
          </span>
        )
      })}
    </div>
  )
}
