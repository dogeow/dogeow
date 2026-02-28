'use client'

import type { GameItem } from '../../types'
import type { InventorySlotCell } from './inventoryUtils'
import { ItemActionButton } from './ItemActionButton'

interface InventoryDetailActionsProps {
  canSocket: (item: GameItem) => boolean
  canUnsocket: (item: GameItem) => boolean
  gemsInInventoryCount: number
  isLoading: boolean
  item: GameItem
  onEquip: () => void
  onMove: (toStorage: boolean) => void
  onOpenGemSelector: (item: GameItem) => void
  onSell: () => void
  onUnsocketGem: (socketIndex: number) => void
  onUsePotion: () => void
  source: InventorySlotCell['source']
}

export function InventoryDetailActions({
  canSocket,
  canUnsocket,
  gemsInInventoryCount,
  isLoading,
  item,
  onEquip,
  onMove,
  onOpenGemSelector,
  onSell,
  onUnsocketGem,
  onUsePotion,
  source,
}: InventoryDetailActionsProps) {
  const isInventoryItem = source === 'inventory'
  const itemType = item.definition?.type

  return (
    <>
      {isInventoryItem && itemType === 'potion' && (
        <ItemActionButton onClick={onUsePotion} disabled={isLoading} variant="use">
          使用
        </ItemActionButton>
      )}
      {isInventoryItem && itemType !== 'potion' && itemType !== 'gem' && (
        <ItemActionButton onClick={onEquip} disabled={isLoading} variant="equip">
          装备
        </ItemActionButton>
      )}
      {isInventoryItem && canSocket(item) && (
        <ItemActionButton
          onClick={() => onOpenGemSelector(item)}
          disabled={isLoading || gemsInInventoryCount === 0}
          variant="socket"
        >
          镶嵌
        </ItemActionButton>
      )}
      {isInventoryItem && canUnsocket(item) && (
        <ItemActionButton onClick={() => onUnsocketGem(0)} disabled={isLoading} variant="unsocket">
          取下
        </ItemActionButton>
      )}
      <ItemActionButton onClick={() => onMove(isInventoryItem)} disabled={isLoading} variant="move">
        {source === 'storage' ? '取回' : '存入'}
      </ItemActionButton>
      {isInventoryItem && (
        <ItemActionButton onClick={onSell} disabled={isLoading} variant="sell">
          出售
        </ItemActionButton>
      )}
    </>
  )
}
