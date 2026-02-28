'use client'

import { getItemDisplayName } from '../../utils/itemUtils'
import type { GameItem } from '../../types'

interface SellQuantityDialogProps {
  isLoading?: boolean
  isOpen: boolean
  item: GameItem | null
  quantity: number
  onClose: () => void
  onConfirm: () => void
  onQuantityChange: (quantity: number) => void
}

export function SellQuantityDialog({
  isLoading = false,
  isOpen,
  item,
  quantity,
  onClose,
  onConfirm,
  onQuantityChange,
}: SellQuantityDialogProps) {
  if (!isOpen || !item) return null

  const maxQuantity = Math.max(1, item.quantity)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
        <h4 className="text-foreground mb-2 text-base font-bold sm:text-lg">确认出售数量</h4>
        <p className="text-muted-foreground mb-4 text-sm">
          {getItemDisplayName(item)} 可出售 {maxQuantity} 个
        </p>
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={isLoading || quantity <= 1}
            className="bg-muted text-foreground hover:bg-secondary h-8 w-8 rounded disabled:opacity-50"
          >
            -
          </button>
          <input
            type="number"
            min={1}
            max={maxQuantity}
            value={quantity}
            onChange={event => {
              const nextQuantity = Number(event.target.value)
              if (Number.isNaN(nextQuantity)) return
              onQuantityChange(Math.min(maxQuantity, Math.max(1, nextQuantity)))
            }}
            className="bg-background border-border text-foreground w-20 rounded border px-3 py-2 text-center"
          />
          <button
            onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
            disabled={isLoading || quantity >= maxQuantity}
            className="bg-muted text-foreground hover:bg-secondary h-8 w-8 rounded disabled:opacity-50"
          >
            +
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="bg-muted text-foreground hover:bg-secondary rounded px-3 py-2 text-sm"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            确认出售
          </button>
        </div>
      </div>
    </div>
  )
}
