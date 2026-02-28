'use client'

import { useMemo, useState } from 'react'
import type { GameItem } from '../../types'
import {
  type InventorySlotCell,
  buildSlotArray,
  computeQualityStats,
  filterSlotsByCategory,
  getCategoryById,
  toSlotCells,
} from './inventoryUtils'

interface UseInventoryPanelViewParams {
  inventory: GameItem[]
  inventorySize: number
  sellItemsByQuality: (quality: string) => Promise<unknown>
  storage: GameItem[]
  storageSize: number
}

export function useInventoryPanelView({
  inventory,
  inventorySize,
  sellItemsByQuality,
  storage,
  storageSize,
}: UseInventoryPanelViewParams) {
  const [showStorage, setShowStorage] = useState(false)
  const [categoryId, setCategoryId] = useState('')
  const [recyclingQuality, setRecyclingQuality] = useState<string | null>(null)

  const qualityStats = useMemo(() => computeQualityStats(inventory), [inventory])
  const inventorySlots = useMemo(
    () => buildSlotArray(inventory, inventorySize),
    [inventory, inventorySize]
  )
  const warehouseSlots = useMemo(() => buildSlotArray(storage, storageSize), [storage, storageSize])
  const category = useMemo(() => getCategoryById(categoryId), [categoryId])

  const displaySlots = useMemo((): InventorySlotCell[] => {
    const raw = showStorage
      ? toSlotCells(warehouseSlots, 'storage')
      : toSlotCells(inventorySlots, 'inventory')

    return filterSlotsByCategory(raw, category.types)
  }, [showStorage, warehouseSlots, inventorySlots, category.types])

  const handleRecycleQuality = async (quality: string) => {
    setRecyclingQuality(quality)
    try {
      await sellItemsByQuality(quality)
    } finally {
      setRecyclingQuality(null)
    }
  }

  return {
    categoryId,
    displaySlots,
    handleRecycleQuality,
    qualityStats,
    recyclingQuality,
    setCategoryId,
    setShowStorage,
    showStorage,
  }
}
