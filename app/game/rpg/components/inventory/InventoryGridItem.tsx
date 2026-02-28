'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { FullComparePanel, type ItemActionType } from '@/components/game'
import type { GameItem } from '../../types'
import { getItemDisplayName, isEquippable } from '../../utils/itemUtils'
import { GameItemSlot } from './GameItemSlot'
import { InventoryDetailActions } from './InventoryDetailActions'
import { InventoryItemDetailCard } from './InventoryItemDetailCard'
import type { InventorySlotCell } from './inventoryUtils'

interface InventoryGridItemProps {
  canSocket: (item: GameItem) => boolean
  canUnsocket: (item: GameItem) => boolean
  cell: InventorySlotCell & { item: GameItem }
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

export function InventoryGridItem({
  canSocket,
  canUnsocket,
  cell,
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
}: InventoryGridItemProps) {
  const item = cell.item
  const isSelected = selectedItemId === item.id
  const showCompare = isEquippable(item) && cell.source === 'inventory' && hasEquippedItem(item)
  const equippedRings = item.definition?.type === 'ring' ? getEquippedRings() : []
  const compareActions = showCompare ? getCompareActions(item) : []

  return (
    <Popover
      open={isSelected}
      onOpenChange={open => {
        if (!open) onSelectedItemChange(null)
      }}
    >
      <PopoverTrigger asChild>
        <GameItemSlot
          item={item}
          onClick={() => onSelectedItemChange(isSelected ? null : item)}
          title={getItemDisplayName(item)}
          variant="inventory"
          isSelected={isSelected}
          footer={
            <div className="absolute -bottom-0.5 flex w-full items-center justify-center">
              <span className="rounded bg-black/70 px-1 text-[9px] font-medium text-yellow-400">
                {(item.sell_price ?? Math.floor((item.definition?.buy_price ?? 0) / 2)) *
                  (item.quantity ?? 1)}
              </span>
            </div>
          }
        />
      </PopoverTrigger>
      <PopoverContent
        className={`${showCompare ? (item.definition?.type === 'ring' && equippedRings.length === 2 ? 'w-[840px]' : 'w-[420px]') : 'w-[280px]'} max-w-[95vw] p-0`}
        side="bottom"
        align="center"
        sideOffset={8}
        collisionPadding={12}
      >
        <div className="flex flex-col">
          {showCompare && (
            <>
              {item.definition?.type === 'ring' &&
                equippedRings.length === 2 &&
                equippedRings.map(equippedRing => (
                  <FullComparePanel
                    key={equippedRing.id}
                    newItem={item}
                    equippedItem={equippedRing}
                    actions={compareActions}
                    onAction={action => handleCompareAction(action, item)}
                  />
                ))}
              {(item.definition?.type !== 'ring' || equippedRings.length !== 2) && (
                <FullComparePanel
                  newItem={item}
                  equippedItem={getEquippedItem(item)!}
                  actions={compareActions}
                  onAction={action => handleCompareAction(action, item)}
                />
              )}
            </>
          )}
          {!showCompare && (
            <InventoryItemDetailCard
              item={item}
              onClose={() => onSelectedItemChange(null)}
              onUnsocketGem={onUnsocketGem}
              isLoading={isLoading}
              showBuyPrice
              footer={
                <InventoryDetailActions
                  canSocket={canSocket}
                  canUnsocket={canUnsocket}
                  gemsInInventoryCount={gemsInInventoryCount}
                  isLoading={isLoading}
                  item={item}
                  onEquip={onEquip}
                  onMove={onMove}
                  onOpenGemSelector={onOpenGemSelector}
                  onSell={onSell}
                  onUnsocketGem={onUnsocketGem}
                  onUsePotion={onUsePotion}
                  source={cell.source}
                />
              }
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
