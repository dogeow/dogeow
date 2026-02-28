'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { GameItem } from '../../types'
import { ItemActionButton } from './ItemActionButton'

interface EquipmentDetailActionsProps {
  canSocket: boolean
  gemsInInventoryCount: number
  isLoading: boolean
  item: GameItem
  onOpenGemSelector: (item: GameItem) => void
  onUnequip: () => void
  onUnsocketGem: (item: GameItem, socketIndex: number) => void
}

export function EquipmentDetailActions({
  canSocket,
  gemsInInventoryCount,
  isLoading,
  item,
  onOpenGemSelector,
  onUnequip,
  onUnsocketGem,
}: EquipmentDetailActionsProps) {
  const canUnsocket = !!(item.gems && item.gems.length > 0)

  return (
    <>
      <ItemActionButton onClick={onUnequip} disabled={isLoading} variant="unequip">
        卸下
      </ItemActionButton>
      {canSocket && (
        <ItemActionButton
          onClick={() => onOpenGemSelector(item)}
          disabled={isLoading || gemsInInventoryCount === 0}
          variant="socket"
        >
          镶嵌
        </ItemActionButton>
      )}
      {canUnsocket && (
        <Popover>
          <PopoverTrigger asChild>
            <ItemActionButton disabled={isLoading} variant="unsocket">
              取下 ▾
            </ItemActionButton>
          </PopoverTrigger>
          <PopoverContent className="w-32 p-1" align="start">
            {item.gems?.map(gem => (
              <button
                key={gem.id}
                onClick={() => onUnsocketGem(item, gem.socket_index)}
                disabled={isLoading}
                className="hover:bg-muted flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm disabled:opacity-50"
              >
                <span>💎</span>
                <span>{gem.gemDefinition?.name || '宝石'}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </>
  )
}
