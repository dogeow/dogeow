import type { ItemActionType } from '@/components/game'
import type { GameItem } from '../../types'
import { getEquipmentSlot } from '../../utils/itemUtils'

type EquippedItems = Record<string, GameItem | null | undefined>

interface InventoryCompareActionHandlers {
  onEquip: (item: GameItem) => void | Promise<unknown>
  onMoveToStorage: (item: GameItem) => void | Promise<unknown>
  onSell: (item: GameItem) => void | Promise<unknown>
  onSocket: (item: GameItem) => void
  onUnsocket: (item: GameItem) => void | Promise<unknown>
}

export const getEquippedItemFor = (equipment: EquippedItems, item: GameItem): GameItem | null => {
  const slot = getEquipmentSlot(item)
  if (!slot) return null

  return equipment[slot] ?? null
}

export const hasEquippedItemFor = (equipment: EquippedItems, item: GameItem): boolean =>
  getEquippedItemFor(equipment, item) != null

export const getEquippedRingItems = (equipment: EquippedItems): GameItem[] =>
  equipment.ring ? [equipment.ring] : []

export const getInventoryCompareActions = (
  item: GameItem,
  options: {
    canSocket: (item: GameItem) => boolean
    canUnsocket: (item: GameItem) => boolean
  }
): ItemActionType[] => {
  const actions: ItemActionType[] = ['equip', 'store', 'sell']

  if (options.canSocket(item)) actions.push('socket')
  if (options.canUnsocket(item)) actions.push('unsocket')

  return actions
}

export const handleInventoryCompareAction = (
  action: ItemActionType,
  item: GameItem,
  handlers: InventoryCompareActionHandlers
) => {
  switch (action) {
    case 'equip':
      void handlers.onEquip(item)
      break
    case 'store':
      void handlers.onMoveToStorage(item)
      break
    case 'sell':
      void handlers.onSell(item)
      break
    case 'socket':
      handlers.onSocket(item)
      break
    case 'unsocket':
      void handlers.onUnsocket(item)
      break
    default:
      break
  }
}
