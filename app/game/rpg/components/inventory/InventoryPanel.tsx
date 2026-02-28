'use client'

import { useGameStore } from '../../stores/gameStore'
import { GemSelectorDialog } from './GemSelectorDialog'
import { InventoryGrid } from './InventoryGrid'
import { InventoryToolbar } from './InventoryToolbar'
import { SellQuantityDialog } from './SellQuantityDialog'
import {
  getEquippedItemFor,
  getEquippedRingItems,
  hasEquippedItemFor,
} from './inventoryEquipmentUtils'
import { useInventoryPanelActions } from './useInventoryPanelActions'
import { useInventoryPanelView } from './useInventoryPanelView'

export function InventoryPanel() {
  const {
    inventory,
    storage,
    inventorySize,
    storageSize,
    equipment,
    equipItem,
    sellItem,
    sellItemsByQuality,
    moveItem,
    sortInventory,
    consumePotion,
    socketGem,
    unsocketGem,
    isLoading,
  } = useGameStore()

  const {
    canSocket,
    canUnsocket,
    closeGemSelector,
    closeSellConfirm,
    gemsInInventory,
    getCompareActions,
    handleCompareAction,
    handleEquip,
    handleMove,
    handleSell,
    handleSellConfirm,
    handleSocketGem,
    handleUnsocketGem,
    handleUsePotion,
    openGemSelector,
    selectedItem,
    selectedItemId,
    selectedSocketItem,
    sellQuantity,
    setSelectedItem,
    setSellQuantity,
    showGemSelector,
    showSellConfirm,
  } = useInventoryPanelActions({
    consumePotion,
    equipItem,
    inventory,
    moveItem,
    sellItem,
    socketGem,
    unsocketGem,
  })

  const {
    categoryId,
    displaySlots,
    handleRecycleQuality,
    qualityStats,
    recyclingQuality,
    setCategoryId,
    setShowStorage,
    showStorage,
  } = useInventoryPanelView({
    inventory,
    inventorySize,
    sellItemsByQuality,
    storage,
    storageSize,
  })

  return (
    <>
      <GemSelectorDialog
        isOpen={showGemSelector}
        socketItem={selectedSocketItem}
        gems={gemsInInventory}
        onClose={closeGemSelector}
        onSelect={handleSocketGem}
      />
      <SellQuantityDialog
        isOpen={showSellConfirm}
        item={selectedItem}
        quantity={sellQuantity}
        isLoading={isLoading}
        onQuantityChange={setSellQuantity}
        onClose={closeSellConfirm}
        onConfirm={handleSellConfirm}
      />
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
        {/* 背包/仓库 - 装备栏已移至角色面板 */}
        <div className="bg-card border-border flex min-w-0 flex-1 flex-col rounded-lg border p-3 sm:p-4">
          <InventoryToolbar
            categoryId={categoryId}
            inventoryCount={inventory.length}
            inventorySize={inventorySize}
            isLoading={isLoading}
            onCategoryChange={setCategoryId}
            onRecycleQuality={handleRecycleQuality}
            onShowStorageChange={setShowStorage}
            onSort={sortInventory}
            qualityStats={qualityStats}
            recyclingQuality={recyclingQuality}
            showStorage={showStorage}
            storageCount={storage.length}
            storageSize={storageSize}
          />

          <InventoryGrid
            canSocket={canSocket}
            canUnsocket={canUnsocket}
            displaySlots={displaySlots}
            gemsInInventoryCount={gemsInInventory.length}
            getCompareActions={getCompareActions}
            getEquippedItem={item => getEquippedItemFor(equipment, item)}
            getEquippedRings={() => getEquippedRingItems(equipment)}
            handleCompareAction={handleCompareAction}
            hasEquippedItem={item => hasEquippedItemFor(equipment, item)}
            isLoading={isLoading}
            onEquip={() => void handleEquip()}
            onMove={toStorage => void handleMove(toStorage)}
            onOpenGemSelector={openGemSelector}
            onSelectedItemChange={setSelectedItem}
            onSell={() => void handleSell()}
            onUnsocketGem={socketIndex => void handleUnsocketGem(socketIndex)}
            onUsePotion={() => void handleUsePotion()}
            selectedItemId={selectedItemId}
          />
        </div>
      </div>
    </>
  )
}
