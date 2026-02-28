'use client'

import type { GameItem } from '../../types'
import { canSocketItem } from './useGemManagement'
import { EquipmentDetailActions } from './EquipmentDetailActions'
import { InventoryItemDetailCard } from './InventoryItemDetailCard'

interface EquipmentDetailOverlayProps {
  gemsInInventoryCount: number
  isLoading: boolean
  item: GameItem | null
  onClose: () => void
  onOpenGemSelector: (item: GameItem) => void
  onUnequip: () => void
  onUnsocketGem: (item: GameItem, socketIndex: number) => void
}

export function EquipmentDetailOverlay({
  gemsInInventoryCount,
  isLoading,
  item,
  onClose,
  onOpenGemSelector,
  onUnequip,
  onUnsocketGem,
}: EquipmentDetailOverlayProps) {
  if (!item) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card border-border max-w-[85vw] rounded-lg border shadow-xl"
        onClick={event => event.stopPropagation()}
        style={{ width: '320px' }}
      >
        <InventoryItemDetailCard
          item={item}
          onClose={onClose}
          onUnsocketGem={socketIndex => onUnsocketGem(item, socketIndex)}
          isLoading={isLoading}
          footer={
            <EquipmentDetailActions
              canSocket={canSocketItem(item)}
              gemsInInventoryCount={gemsInInventoryCount}
              isLoading={isLoading}
              item={item}
              onOpenGemSelector={onOpenGemSelector}
              onUnequip={onUnequip}
              onUnsocketGem={onUnsocketGem}
            />
          }
        />
      </div>
    </div>
  )
}
