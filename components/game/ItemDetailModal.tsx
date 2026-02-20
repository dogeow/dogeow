'use client'

import type { GameItem, ShopItem } from '@/app/game/rpg/types'
import { ItemDetailContent } from './ItemDetailContent'
import { FullComparePanel } from './ItemComparePanel'
import { ItemActions, type ItemActionType } from './ItemActions'
import { isEquippable, isPotion } from '@/app/game/rpg/utils/itemUtils'
import { CopperDisplay } from '@/app/game/rpg/components/shared/CopperDisplay'

interface BaseItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: GameItem | ShopItem | null
}

interface InventoryItemDetailModalProps extends BaseItemDetailModalProps {
  type: 'inventory'
  source: 'inventory' | 'storage'
  equippedItem?: GameItem | null
  onEquip?: () => void
  onUse?: () => void
  onMove?: (toStorage: boolean) => void
  onSell?: () => void
}

interface ShopItemDetailModalProps extends BaseItemDetailModalProps {
  type: 'shop'
  buyQuantity?: number
  setBuyQuantity?: (quantity: number) => void
  totalBuyPrice?: number
  onBuy?: () => void
  disabledBuy?: boolean
  canAfford?: boolean
  levelEnough?: boolean
  equippedItem?: GameItem | null
}

interface EquipmentItemDetailModalProps extends BaseItemDetailModalProps {
  type: 'equipment'
  onUnequip?: () => void
}

export type ItemDetailModalProps =
  | InventoryItemDetailModalProps
  | ShopItemDetailModalProps
  | EquipmentItemDetailModalProps

export function ItemDetailModal(props: ItemDetailModalProps) {
  const { isOpen, onClose, item } = props

  if (!isOpen || !item) return null

  // 商店始终使用更宽的布局
  const isShop = props.type === 'shop'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={`border-border bg-card w-[260px] rounded-xl border text-sm shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <div className="absolute top-2 right-2">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {props.type === 'inventory' && <InventoryItemDetail {...props} />}
        {props.type === 'shop' && <ShopItemDetail {...props} />}
        {props.type === 'equipment' && <EquipmentItemDetail {...props} />}
      </div>
    </div>
  )
}

function InventoryItemDetail(props: InventoryItemDetailModalProps) {
  const { item, source, equippedItem, onEquip, onUse, onMove, onSell, onClose } = props

  if (!item) return null

  const gameItem = item as GameItem

  // 判断是否有可对比的装备
  const hasEquippedItem = (): boolean => {
    if (!isEquippable(gameItem)) return false
    return equippedItem !== null && equippedItem !== undefined
  }

  // 获取操作按钮
  const getActions = (): ItemActionType[] => {
    const actions: ItemActionType[] = []

    // 来自背包时
    if (source === 'inventory') {
      // 药水 - 使用按钮
      if (isPotion(gameItem)) {
        actions.push('use')
      }
      // 可装备物品（除了药水和宝石）
      if (isEquippable(gameItem)) {
        actions.push('equip')
      }
      // 存入按钮
      actions.push('store')
      // 卖出按钮
      actions.push('sell')
    } else {
      // 来自仓库 - 取回按钮
      actions.push('retrieve')
    }

    return actions
  }

  const handleAction = (action: ItemActionType) => {
    switch (action) {
      case 'equip':
        onEquip?.()
        break
      case 'use':
        onUse?.()
        break
      case 'store':
        onMove?.(true)
        break
      case 'retrieve':
        onMove?.(false)
        break
      case 'sell':
        onSell?.()
        break
    }
  }

  const hasEquipped = hasEquippedItem() && source === 'inventory' && equippedItem != null
  const actions = getActions()

  // 有对比时的布局 - 操作按钮在右边底部
  if (hasEquipped && equippedItem) {
    return (
      <FullComparePanel
        newItem={gameItem}
        equippedItem={equippedItem}
        actions={actions}
        onAction={handleAction}
      />
    )
  }

  // 无对比时的布局
  return (
    <div className="flex flex-col">
      <ItemDetailContent item={item} type="inventory" />
      <ItemActions actions={actions} onAction={handleAction} />
    </div>
  )
}

function ShopItemDetail(props: ShopItemDetailModalProps) {
  const {
    item,
    buyQuantity = 1,
    setBuyQuantity,
    totalBuyPrice,
    onBuy,
    disabledBuy,
    canAfford = true,
    levelEnough = true,
    equippedItem,
  } = props

  if (!item) return null

  const shopItem = item as ShopItem

  // 计算是否有可对比的装备
  // 商店物品中，只有装备类型（不是药水和宝石）才能对比
  const isEquippableType = shopItem.type !== 'potion' && shopItem.type !== 'gem'
  // 药水类型只显示快捷数量按钮，不显示输入框
  const isPotion = shopItem.type === 'potion'
  const hasEquipped = isEquippableType && equippedItem != null

  // 转换为 GameItem 用于对比计算
  // 使用 shopItem.id 作为 definition_id，用于显示物品图片
  const shopItemAsGameItem: GameItem = {
    id: 0,
    character_id: 0,
    definition_id: shopItem.id,
    definition: {
      id: shopItem.id,
      name: shopItem.name,
      type: shopItem.type,
      sub_type: shopItem.sub_type,
      base_stats: shopItem.base_stats,
      required_level: shopItem.required_level,
      buy_price: shopItem.buy_price,
      icon: shopItem.icon,
    },
    quality: shopItem.quality,
    stats: shopItem.base_stats,
    affixes: [],
    is_in_storage: false,
    quantity: 1,
    slot_index: null,
    sell_price: shopItem.sell_price,
  }

  return (
    <div className="flex flex-col">
      {/* 有对比时：使用完整对比面板 */}
      {hasEquipped && equippedItem && (
        <FullComparePanel newItem={shopItemAsGameItem} equippedItem={equippedItem} isShop />
      )}

      {/* 无对比时：显示物品详情 */}
      {!hasEquipped && <ItemDetailContent item={item} type="shop" />}

      {/* 物品详情 - 右边（无对比时）或者购买按钮区域（有对比时） */}
      <div className="flex flex-1 flex-col">
        {/* 数量选择 - 仅药水显示 */}
        {setBuyQuantity && isPotion && (
          <div className="flex items-center justify-between px-3 pt-2">
            <span className="text-muted-foreground text-sm">数量:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                className="bg-muted text-foreground hover:bg-secondary h-7 w-7 rounded text-sm transition-colors"
                disabled={buyQuantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={9999}
                value={buyQuantity}
                onChange={e => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val) && val >= 1 && val <= 9999) {
                    setBuyQuantity(val)
                  } else if (e.target.value === '') {
                    setBuyQuantity(1)
                  }
                }}
                className="bg-muted text-foreground hover:bg-secondary border-input h-7 w-12 rounded border px-2 text-center text-sm transition-colors"
              />
              <button
                onClick={() => setBuyQuantity(Math.min(9999, buyQuantity + 1))}
                className="bg-muted text-foreground hover:bg-secondary h-7 w-7 rounded text-sm transition-colors"
                disabled={buyQuantity >= 9999}
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* 快捷数量按钮 - 仅药水显示 */}
        {setBuyQuantity && isPotion && (
          <div className="flex items-center justify-center gap-1 px-3 pt-1">
            {[1, 10, 100].map(qty => (
              <button
                key={qty}
                onClick={() => setBuyQuantity(qty)}
                className={`rounded px-3 py-1 text-xs transition-colors ${
                  buyQuantity === qty
                    ? 'bg-green-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        )}

        {/* 总价 */}
        {totalBuyPrice != null && totalBuyPrice > 0 && (
          <div className="flex items-center justify-between px-3 pt-1">
            <span className="text-foreground text-sm font-medium">总价:</span>
            <span className={canAfford ? '' : 'text-red-500'}>
              <CopperDisplay copper={totalBuyPrice} size="sm" />
            </span>
          </div>
        )}

        {/* 购买按钮 */}
        <div className="p-3">
          <button
            onClick={onBuy}
            disabled={disabledBuy}
            className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {!canAfford ? '货币不足' : !levelEnough ? '等级不足' : '确认购买'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EquipmentItemDetail(props: EquipmentItemDetailModalProps) {
  const { item, onUnequip } = props

  if (!item) return null

  const handleAction = (action: ItemActionType) => {
    if (action === 'unequip') {
      onUnequip?.()
    }
  }

  return (
    <div className="flex flex-col">
      <ItemDetailContent item={item} type="equipment" />
      <ItemActions actions={['unequip']} onAction={handleAction} />
    </div>
  )
}
