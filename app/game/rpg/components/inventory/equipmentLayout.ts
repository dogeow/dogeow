import type { EquipmentSlot } from '../../types'

export const EQUIPMENT_LAYOUT: Array<{ label?: string; slot?: EquipmentSlot }> = [
  {},
  { slot: 'helmet' },
  { slot: 'weapon' },
  { slot: 'armor' },
  { slot: 'gloves' },
  {},
  { slot: 'belt' },
  { slot: 'ring', label: '戒指' },
  { slot: 'amulet', label: '护符' },
  {},
  { slot: 'boots' },
]
