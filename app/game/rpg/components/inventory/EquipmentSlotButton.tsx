'use client'

import type { EquipmentSlot, GameItem } from '../../types'
import { SLOT_NAMES } from '../../types'
import { getItemDisplayName } from '../../utils/itemUtils'
import { GameItemSlot } from './GameItemSlot'

interface EquipmentSlotButtonProps {
  item: GameItem | null | undefined
  label?: string
  onClick: () => void
  slot: EquipmentSlot
}

export function EquipmentSlotButton({ item, label, onClick, slot }: EquipmentSlotButtonProps) {
  return (
    <GameItemSlot
      item={item}
      onClick={onClick}
      title={item ? getItemDisplayName(item) : label || SLOT_NAMES[slot]}
      variant="equipment"
      emptyLabel={label || SLOT_NAMES[slot]}
    />
  )
}
