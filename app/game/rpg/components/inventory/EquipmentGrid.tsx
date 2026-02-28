'use client'

import { useState } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { EquipmentSlot, GameItem } from '../../types'
import { EquipmentDetailOverlay } from './EquipmentDetailOverlay'
import { GemSelectorDialog } from './GemSelectorDialog'
import { EquipmentSlotButton } from './EquipmentSlotButton'
import { EQUIPMENT_LAYOUT } from './equipmentLayout'
import { useGemManagement } from './useGemManagement'

interface EquipmentGridProps {
  equipment: Record<string, GameItem | null>
  onUnequip: (slot: EquipmentSlot) => void
}

export function EquipmentGrid({ equipment, onUnequip }: EquipmentGridProps) {
  const { socketGem, unsocketGem, inventory, isLoading } = useGameStore()
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null)

  const selectedItem = selectedSlot ? equipment[selectedSlot] : null

  const {
    closeGemSelector,
    gemsInInventory,
    handleSocketGem,
    handleUnsocketGem,
    openGemSelector,
    selectedSocketItem,
    showGemSelector,
  } = useGemManagement({
    inventory,
    onSocketComplete: () => setSelectedSlot(null),
    onUnsocketComplete: () => setSelectedSlot(null),
    socketGem,
    unsocketGem,
  })

  const handleUnequip = () => {
    if (!selectedSlot) return
    onUnequip(selectedSlot)
    setSelectedSlot(null)
  }

  return (
    <>
      <GemSelectorDialog
        isOpen={showGemSelector}
        socketItem={selectedSocketItem}
        gems={gemsInInventory}
        onClose={closeGemSelector}
        onSelect={handleSocketGem}
      />
      <div className="mx-auto grid w-[280px] max-w-full grid-cols-3 gap-x-4 gap-y-3 sm:w-[320px] sm:gap-x-5 sm:gap-y-4">
        {EQUIPMENT_LAYOUT.map((cell, index) => {
          if (!cell.slot) {
            return <div key={`empty-${index}`} className="h-12 w-12 shrink-0" aria-hidden />
          }

          const item = equipment[cell.slot]

          return (
            <div key={cell.slot} className="flex justify-center">
              <EquipmentSlotButton
                slot={cell.slot}
                item={item}
                label={cell.label}
                onClick={() => item && setSelectedSlot(cell.slot!)}
              />
            </div>
          )
        })}
      </div>

      <EquipmentDetailOverlay
        gemsInInventoryCount={gemsInInventory.length}
        isLoading={isLoading}
        item={selectedItem}
        onClose={() => setSelectedSlot(null)}
        onOpenGemSelector={openGemSelector}
        onUnequip={handleUnequip}
        onUnsocketGem={handleUnsocketGem}
      />
    </>
  )
}
