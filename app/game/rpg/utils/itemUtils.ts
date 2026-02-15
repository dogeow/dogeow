// 物品相关的通用工具函数

import type { GameItem, ItemType } from '../types'

// 物品类型图标映射
export const ITEM_TYPE_ICONS: Record<string, string> = {
  weapon: '⚔️',
  helmet: '🪖',
  armor: '👕',
  gloves: '🧤',
  boots: '👢',
  belt: '🥋',
  ring: '💍',
  amulet: '📿',
  potion: '🧪',
  gem: '💎',
}

// 物品类型中文名
export const ITEM_TYPE_NAMES: Record<string, string> = {
  weapon: '武器',
  helmet: '头盔',
  armor: '盔甲',
  gloves: '手套',
  boots: '靴子',
  belt: '腰带',
  ring: '戒指',
  amulet: '护身符',
  potion: '药水',
  gem: '宝石',
}

/**
 * 获取物品图标回退：药水按 sub_type 区分 HP❤️/MP💙，其余按 type 或 definition.icon，最后 📦
 */
export function getItemIconFallback(item: GameItem): string {
  const def = item.definition
  if (!def) return '📦'
  if (def.type === 'potion') {
    if (def.sub_type === 'hp') return '❤️'
    if (def.sub_type === 'mp') return '💙'
  }
  const typeIcon = ITEM_TYPE_ICONS[def.type]
  if (typeIcon) return typeIcon
  if (def.icon && !def.icon.includes('.')) return def.icon
  return '📦'
}

/**
 * 获取物品图标：药水按 sub_type 区分 HP❤️/MP💙
 */
export function getShopItemIcon(type: ItemType, subType?: string): string {
  if (type === 'potion') {
    if (subType === 'hp') return '❤️'
    if (subType === 'mp') return '💙'
  }
  return ITEM_TYPE_ICONS[type] ?? '📦'
}

/**
 * 获取物品显示名称：优先 definition.name，否则用品质+类型
 */
export function getItemDisplayName(item: GameItem): string {
  const name = item.definition?.name?.trim()
  if (name) return name
  const typeName = ITEM_TYPE_NAMES[item.definition?.type ?? ''] ?? item.definition?.type ?? '物品'
  return `${item.quality} ${typeName}`
}

/**
 * 检查物品是否属于指定分类
 */
export function itemMatchesCategory(item: GameItem, types: readonly string[] | null): boolean {
  if (!types) return true
  const t = item.definition?.type ?? ''
  return types.includes(t)
}

/**
 * 物品堆叠 - 相同属性的物品可以堆叠
 */
export interface StackedItem extends GameItem {
  quantity: number
}

export function stackItems(items: GameItem[]): StackedItem[] {
  const stacks = new Map<string, StackedItem>()

  items.forEach(item => {
    const defId = item.definition?.id ?? item.definition_id ?? 'unknown'
    const statsKey = item.stats
      ? JSON.stringify(Object.entries(item.stats).sort(([a], [b]) => a.localeCompare(b)))
      : ''
    const affixesKey = item.affixes
      ? JSON.stringify(item.affixes.map(a => JSON.stringify(a)).sort())
      : ''
    const key = `${defId}-${statsKey}-${affixesKey}`

    const existing = stacks.get(key)
    if (existing) {
      existing.quantity++
    } else {
      stacks.set(key, { ...item, quantity: 1 })
    }
  })

  return Array.from(stacks.values())
}

/**
 * 检查物品是否可装备
 */
export function isEquippable(item: GameItem): boolean {
  const type = item.definition?.type
  return type !== undefined && type !== 'potion' && type !== 'gem'
}

/**
 * 检查物品是否是药水
 */
export function isPotion(item: GameItem): boolean {
  return item.definition?.type === 'potion'
}
