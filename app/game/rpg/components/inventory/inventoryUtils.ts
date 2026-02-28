import type { GameItem } from '../../types'
import { itemMatchesCategory } from '../../utils/itemUtils'
import { INVENTORY_CATEGORIES } from './inventoryConfig'

export type InventorySlotCell = { item: GameItem | null; source: 'inventory' | 'storage' }

const EMPTY_CATEGORY: { types: readonly string[] | null } = { types: null }

export const getCategoryById = (categoryId: string) =>
  categoryId === ''
    ? EMPTY_CATEGORY
    : (INVENTORY_CATEGORIES.find(category => category.id === categoryId) ?? EMPTY_CATEGORY)

export const buildSlotArray = (items: GameItem[], size: number) => {
  const slots: (GameItem | null)[] = Array.from({ length: size }, () => null)
  items.forEach(item => {
    const idx = item.slot_index
    if (typeof idx === 'number' && idx >= 0 && idx < size) slots[idx] = item
  })
  return slots
}

export const toSlotCells = (slots: (GameItem | null)[], source: InventorySlotCell['source']) =>
  slots.map(item => ({ item, source }))

export const filterSlotsByCategory = (
  slots: InventorySlotCell[],
  types: readonly string[] | null
) => {
  if (!types) return slots

  return slots.filter(
    (cell): cell is InventorySlotCell & { item: GameItem } =>
      cell.item != null && itemMatchesCategory(cell.item, types)
  )
}

export const computeQualityStats = (items: GameItem[]) => {
  const stats: Record<string, { count: number; totalPrice: number }> = {}

  items.forEach(item => {
    const type = item.definition?.type
    if (type === 'potion' || type === 'gem') return

    const quality = item.quality
    if (!stats[quality]) {
      stats[quality] = { count: 0, totalPrice: 0 }
    }

    stats[quality].count += 1
    stats[quality].totalPrice += (item.sell_price ?? 0) * (item.quantity ?? 1)
  })

  return stats
}

export const canUnsocketItem = (item: GameItem): boolean => {
  if (item.quality !== 'common') return false
  return !!(item.gems && item.gems.length > 0)
}
