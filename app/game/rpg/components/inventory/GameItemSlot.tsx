'use client'

import type { ReactNode } from 'react'
import { ItemIcon } from '@/components/game'
import type { GameItem } from '../../types'
import { QUALITY_COLORS } from '../../types'
import { ItemSocketIndicators } from './ItemSocketIndicators'

type SlotVariant = 'inventory' | 'equipment'

interface GameItemSlotProps {
  emptyLabel?: string
  footer?: ReactNode
  isSelected?: boolean
  item: GameItem | null | undefined
  onClick: () => void
  title: string
  variant: SlotVariant
}

export function GameItemSlot({
  emptyLabel,
  footer,
  isSelected = false,
  item,
  onClick,
  title,
  variant,
}: GameItemSlotProps) {
  if (variant === 'inventory' && item) {
    return (
      <div
        className={`relative flex h-14 w-12 shrink-0 flex-col items-center rounded border-2 shadow-sm transition-all hover:shadow-md ${
          isSelected ? '' : 'border-border'
        }`}
        style={{
          background: isSelected
            ? undefined
            : `linear-gradient(135deg, ${QUALITY_COLORS[item.quality]}15 0%, ${QUALITY_COLORS[item.quality]}08 100%)`,
          borderColor: QUALITY_COLORS[item.quality],
        }}
        title={title}
      >
        <button
          onClick={onClick}
          className="relative flex h-10 w-full items-center justify-center text-lg"
        >
          <FilledSlotContent item={item} showQuantityBadge />
        </button>
        {footer}
      </div>
    )
  }

  const borderColor = item ? QUALITY_COLORS[item.quality] : undefined

  return (
    <button
      onClick={onClick}
      disabled={!item}
      className={`relative flex h-12 w-12 items-center justify-center rounded border-2 text-xl shadow-sm transition-all ${
        item
          ? 'bg-secondary cursor-pointer hover:shadow-md'
          : 'border-border bg-card cursor-default border-dashed'
      }`}
      style={borderColor ? { borderColor } : undefined}
      title={title}
    >
      {item ? <FilledSlotContent item={item} /> : <EmptySlotLabel label={emptyLabel} />}
    </button>
  )
}

function FilledSlotContent({
  item,
  showQuantityBadge = false,
}: {
  item: GameItem
  showQuantityBadge?: boolean
}) {
  return (
    <>
      <ItemIcon item={item} className="drop-shadow-sm" />
      {showQuantityBadge && item.quantity > 1 && (
        <span className="absolute top-0 -right-1 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/70 text-[9px] font-bold text-white">
          {item.quantity}
        </span>
      )}
      <ItemSocketIndicators item={item} className="absolute -top-1 -right-1 z-10" />
    </>
  )
}

function EmptySlotLabel({ label }: { label?: string }) {
  return <span className="text-muted-foreground text-xs">{label}</span>
}
