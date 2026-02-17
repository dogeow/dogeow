'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { CopperDisplay } from '../shared/CopperDisplay'
import { ShopItem, QUALITY_COLORS, formatCopper, GameItem } from '../../types'
import { getShopItemIcon, getEquipmentSlot } from '../../utils/itemUtils'
import { ItemDetailModal } from '@/components/game'

/** 强制刷新费用：1 银 = 100 铜 */
const SHOP_REFRESH_COST_COPPER = 100

export function ShopPanel() {
  const {
    shopItems,
    character,
    buyItem,
    fetchShopItems,
    refreshShopItems,
    isLoading,
    shopNextRefreshAt,
    equipment,
  } = useGameStore()
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null)
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [countdown, setCountdown] = useState<number | null>(null)

  const canAffordRefresh = character != null && character.copper >= SHOP_REFRESH_COST_COPPER

  // 倒计时更新
  useEffect(() => {
    if (shopNextRefreshAt == null) {
      return
    }

    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = shopNextRefreshAt - now
      if (remaining > 0) {
        setCountdown(remaining)
      } else {
        setCountdown(0)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [shopNextRefreshAt])

  useEffect(() => {
    fetchShopItems()
  }, [fetchShopItems])

  const totalBuyPrice = useMemo(
    () => (selectedShopItem ? selectedShopItem.buy_price * buyQuantity : 0),
    [selectedShopItem, buyQuantity]
  )

  const canAfford = character && selectedShopItem && character.copper >= totalBuyPrice
  const levelEnough =
    character && selectedShopItem ? character.level >= selectedShopItem.required_level : false

  const handleBuy = useCallback(async () => {
    if (!selectedShopItem) return
    if (!canAfford || !levelEnough) return
    await buyItem(selectedShopItem.id, buyQuantity)
    setSelectedShopItem(null)
    setBuyQuantity(1)
  }, [selectedShopItem, canAfford, levelEnough, buyItem, buyQuantity])

  const handleSelectShopItem = (item: ShopItem) => {
    setSelectedShopItem(item)
    setBuyQuantity(1)
  }

  // 获取商店物品对应的已装备物品
  const getEquippedItem = (shopItem: ShopItem): GameItem | null => {
    const slot = getEquipmentSlot({ definition: { type: shopItem.type } } as GameItem)
    if (!slot) return null
    // 戒指特殊处理：优先返回 ring1，否则返回 ring2
    if (slot === 'ring1') {
      return equipment.ring1 || equipment.ring2
    }
    return equipment[slot] ?? null
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* 商店物品网格 - 紧凑布局 */}
      <div className="bg-card border-border rounded-lg border p-2 sm:p-3">
        <div className="text-foreground mb-2 flex flex-wrap items-baseline justify-between gap-1.5 sm:mb-3">
          <h4 className="text-sm font-medium">
            商店物品
            <span className="text-muted-foreground ml-1.5 text-xs">({shopItems.length})</span>
          </h4>
          {countdown != null && (
            <span className="text-muted-foreground text-[10px] sm:text-xs">
              {countdown > 0
                ? `刷新倒计时: ${Math.floor(countdown / 60)}分${countdown % 60}秒`
                : '刷新中...'}
            </span>
          )}
        </div>
        <div className="flex min-h-0 justify-center overflow-auto p-0.5">
          <div className="grid w-max max-w-full grid-cols-[repeat(5,3.25rem)] gap-2.5 sm:grid-cols-[repeat(6,3.25rem)] sm:gap-3">
            {shopItems.map(item => {
              const isSelected = selectedShopItem?.id === item.id
              const borderColor = isSelected
                ? undefined
                : item.quality
                  ? QUALITY_COLORS[item.quality]
                  : undefined

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectShopItem(item)}
                  className={`flex h-14 w-14 shrink-0 flex-col rounded border-2 transition-all hover:scale-105 ${
                    isSelected
                      ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/50 dark:border-green-400 dark:bg-green-400/20'
                      : 'bg-muted/50 hover:border-muted-foreground/30 hover:bg-muted'
                  }`}
                  style={borderColor ? { borderColor } : undefined}
                  disabled={isLoading}
                  title={`${item.name} - ${formatCopper(item.buy_price, 1)}`}
                >
                  <span className="flex min-h-0 flex-1 items-center justify-center text-lg">
                    {getShopItemIcon(item.type, item.sub_type)}
                  </span>
                  <span className="border-border/50 bg-muted/80 flex shrink-0 items-center justify-center overflow-hidden rounded-b-[calc(0.2rem-2px)] border-t px-1.5 py-1">
                    <CopperDisplay copper={item.buy_price} size="xs" nowrap maxParts={1} />
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 刷新按钮和价格 */}
        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            onClick={() => refreshShopItems()}
            disabled={isLoading || !canAffordRefresh}
            className="text-muted-foreground hover:text-foreground border-border flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors disabled:opacity-50"
            title={canAffordRefresh ? '强制刷新' : '货币不足，需要1银币'}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs">刷新商店</span>
            <CopperDisplay copper={SHOP_REFRESH_COST_COPPER} size="xs" nowrap maxParts={1} />
          </button>
        </div>
      </div>

      <ItemDetailModal
        isOpen={selectedShopItem !== null}
        item={selectedShopItem}
        onClose={() => setSelectedShopItem(null)}
        type="shop"
        buyQuantity={buyQuantity}
        setBuyQuantity={setBuyQuantity}
        totalBuyPrice={totalBuyPrice}
        onBuy={handleBuy}
        disabledBuy={isLoading || !character || !canAfford || !levelEnough}
        canAfford={!!canAfford}
        levelEnough={!!levelEnough}
        equippedItem={selectedShopItem ? getEquippedItem(selectedShopItem) : null}
      />
    </div>
  )
}
