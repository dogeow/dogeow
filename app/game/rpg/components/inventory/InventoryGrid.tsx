'use client'

import { type ItemActionType } from '@/components/game'
import { type GameItem } from '../../types'
import { InventoryGridItem } from './InventoryGridItem'
import { type InventorySlotCell } from './inventoryUtils'

interface InventoryGridProps {
  canSocket: (item: GameItem) => boolean
  canUnsocket: (item: GameItem) => boolean
  displaySlots: InventorySlotCell[]
  gemsInInventoryCount: number
  getCompareActions: (item: GameItem) => ItemActionType[]
  getEquippedItem: (item: GameItem) => GameItem | null
  getEquippedRings: () => GameItem[]
  handleCompareAction: (action: ItemActionType, item: GameItem) => void
  hasEquippedItem: (item: GameItem) => boolean
  isLoading: boolean
  onEquip: () => void
  onMove: (toStorage: boolean) => void
  onOpenGemSelector: (item: GameItem) => void
  onSelectedItemChange: (item: GameItem | null) => void
  onSell: () => void
  onUnsocketGem: (socketIndex: number) => void
  onUsePotion: () => void
  selectedItemId: number | null
}

export function InventoryGrid({
  canSocket,
  canUnsocket,
  displaySlots,
  gemsInInventoryCount,
  getCompareActions,
  getEquippedItem,
  getEquippedRings,
  handleCompareAction,
  hasEquippedItem,
  isLoading,
  onEquip,
  onMove,
  onOpenGemSelector,
  onSelectedItemChange,
  onSell,
  onUnsocketGem,
  onUsePotion,
  selectedItemId,
}: InventoryGridProps) {
  return (
    <div className="mx-auto min-h-0 flex-1 overflow-auto p-1">
      <div className="flex w-[20.5rem] flex-wrap gap-x-2 gap-y-2 sm:w-[26.5rem]">
        {displaySlots.map((cell, index) => {
          if (!cell.item) return <EmptySlot key={`empty-${index}`} />

          const item = cell.item

          return (
            <InventoryGridItem
              key={item.id}
              canSocket={canSocket}
              canUnsocket={canUnsocket}
              cell={{ ...cell, item }}
              gemsInInventoryCount={gemsInInventoryCount}
              getCompareActions={getCompareActions}
              getEquippedItem={getEquippedItem}
              getEquippedRings={getEquippedRings}
              handleCompareAction={handleCompareAction}
              hasEquippedItem={hasEquippedItem}
              isLoading={isLoading}
              onEquip={onEquip}
              onMove={onMove}
              onOpenGemSelector={onOpenGemSelector}
              onSelectedItemChange={onSelectedItemChange}
              onSell={onSell}
              onUnsocketGem={onUnsocketGem}
              onUsePotion={onUsePotion}
              selectedItemId={selectedItemId}
            />
          )
        })}
      </div>
    </div>
  )
}

function EmptySlot() {
  return (
    <div
      className="border-border bg-card flex h-14 w-12 shrink-0 items-center justify-center rounded border-2 border-dashed"
      aria-hidden
    />
  )
}
