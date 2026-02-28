'use client'

import type { ItemQuality } from '../../types'

export const INVENTORY_CATEGORIES = [
  { id: 'weapon', emoji: '⚔️', label: '武器', types: ['weapon'] },
  { id: 'armor', emoji: '🛡️', label: '防具', types: ['helmet', 'armor', 'belt'] },
  { id: 'gloves', emoji: '🧤', label: '手套', types: ['gloves'] },
  { id: 'boots', emoji: '👢', label: '靴子', types: ['boots'] },
  { id: 'accessory', emoji: '💍', label: '饰品', types: ['ring', 'amulet'] },
  { id: 'potion', emoji: '🧪', label: '药水', types: ['potion'] },
  { id: 'gem', emoji: '💎', label: '宝石', types: ['gem'] },
] as const

export const RECYCLE_QUALITIES: ItemQuality[] = ['common', 'magic', 'rare', 'legendary', 'mythic']
