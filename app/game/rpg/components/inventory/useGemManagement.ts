'use client'

import { useCallback, useMemo, useState } from 'react'
import type { GameItem } from '../../types'

interface UseGemManagementParams {
  inventory: GameItem[]
  onSocketComplete?: () => void
  onUnsocketComplete?: () => void
  socketGem: (itemId: number, gemItemId: number, socketIndex: number) => Promise<unknown>
  unsocketGem: (itemId: number, socketIndex: number) => Promise<unknown>
}

export const getGemsInInventory = (items: GameItem[]) =>
  items.filter(item => item.definition?.type === 'gem')

export const canSocketItem = (item: GameItem): boolean => {
  if (!item.sockets || item.sockets <= 0) return false
  const gemCount = item.gems?.length ?? 0
  return gemCount < item.sockets
}

export function useGemManagement({
  inventory,
  onSocketComplete,
  onUnsocketComplete,
  socketGem,
  unsocketGem,
}: UseGemManagementParams) {
  const [showGemSelector, setShowGemSelector] = useState(false)
  const [selectedSocketItem, setSelectedSocketItem] = useState<GameItem | null>(null)

  const gemsInInventory = useMemo(() => getGemsInInventory(inventory), [inventory])

  const closeGemSelector = useCallback(() => {
    setShowGemSelector(false)
    setSelectedSocketItem(null)
  }, [])

  const openGemSelector = useCallback((item: GameItem) => {
    setSelectedSocketItem(item)
    setShowGemSelector(true)
  }, [])

  const handleSocketGem = useCallback(
    async (gemItem: GameItem, socketIndex: number) => {
      if (!selectedSocketItem) return

      await socketGem(selectedSocketItem.id, gemItem.id, socketIndex)
      closeGemSelector()
      onSocketComplete?.()
    },
    [closeGemSelector, onSocketComplete, selectedSocketItem, socketGem]
  )

  const handleUnsocketGem = useCallback(
    async (item: GameItem | null, socketIndex: number) => {
      if (!item) return

      await unsocketGem(item.id, socketIndex)
      onUnsocketComplete?.()
    },
    [onUnsocketComplete, unsocketGem]
  )

  return {
    closeGemSelector,
    gemsInInventory,
    handleSocketGem,
    handleUnsocketGem,
    openGemSelector,
    selectedSocketItem,
    showGemSelector,
  }
}
