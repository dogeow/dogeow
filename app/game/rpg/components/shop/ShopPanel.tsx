'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { RefreshCw } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { CopperDisplay } from '../shared/CopperDisplay'
import { ShopItem, QUALITY_COLORS, formatCopper, GameItem, ItemType } from '../../types'
import { getShopItemIcon, getEquipmentSlot } from '../../utils/itemUtils'
import { ItemDetailModal } from '@/components/game'

/** 商店物品图标：优先使用图片，加载失败则用 emoji */
function ShopItemIcon({ item, className }: { item: ShopItem; className?: string }) {
  const definitionId = item.id
  const fallback = getShopItemIcon(item.type, item.sub_type)
  const [useImg, setUseImg] = useState(true)
  const src = `/game/rpg/items/item_${definitionId}.png`

  return (
    <span
      className={`relative inline-flex h-full w-full items-center justify-center ${className ?? ''}`}
    >
      {useImg ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-contain"
          sizes="48px"
          onError={() => setUseImg(false)}
        />
      ) : (
        <span className="drop-shadow-sm">{fallback}</span>
      )}
    </span>
  )
}

/** 强制刷新费用：1 银 = 100 铜 */
const SHOP_REFRESH_COST_COPPER = 100

/** 商店物品类型筛选选项 */
const SHOP_TYPE_FILTERS: { id: string; label: string; types: ItemType[] }[] = [
  { id: 'weapon', label: '⚔️', types: ['weapon'] },
  { id: 'helmet', label: '🪖', types: ['helmet'] },
  { id: 'armor', label: '🛡️', types: ['armor'] },
  { id: 'gloves', label: '🧤', types: ['gloves'] },
  { id: 'boots', label: '👢', types: ['boots'] },
  { id: 'belt', label: '🥋', types: ['belt'] },
  { id: 'ring', label: '💍', types: ['ring'] },
  { id: 'potion', label: '🧪', types: ['potion'] },
  { id: 'gem', label: '💎', types: ['gem'] },
]

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
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

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

  const totalBuyPrice = selectedShopItem ? selectedShopItem.buy_price * buyQuantity : 0
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

  // 根据类型筛选物品，并按价格倒序排列
  const filteredItems = useMemo(() => {
    if (!typeFilter) {
      return [...shopItems].sort((a, b) => b.buy_price - a.buy_price)
    }
    const filter = SHOP_TYPE_FILTERS.find(f => f.id === typeFilter)
    const items = filter ? shopItems.filter(item => filter.types.includes(item.type)) : shopItems
    return [...items].sort((a, b) => b.buy_price - a.buy_price)
  }, [shopItems, typeFilter])

  // 获取商店物品对应的已装备物品
  const getEquippedItem = (shopItem: ShopItem): GameItem | null => {
    const slot = getEquipmentSlot({ definition: { type: shopItem.type } } as GameItem)
    if (!slot) return null
    // 戒指特殊处理：返回 ring
    if (slot === 'ring') {
      return equipment.ring
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
            <span className="text-muted-foreground ml-1.5 text-xs">
              ({filteredItems.length}/{shopItems.length})
            </span>
          </h4>
          {countdown != null && (
            <span className="text-muted-foreground text-[10px] sm:text-xs">
              {countdown > 0
                ? `刷新倒计时: ${Math.floor(countdown / 60)}分${countdown % 60}秒`
                : '刷新中...'}
            </span>
          )}
        </div>

        {/* 类型筛选标签 - 两行布局 */}
        <div className="mb-2 flex flex-wrap gap-1.5 sm:mb-3">
          <div className="flex flex-wrap gap-1.5">
            {SHOP_TYPE_FILTERS.slice(0, 5).map(filter => (
              <button
                key={filter.id}
                onClick={() => setTypeFilter(typeFilter === filter.id ? null : filter.id)}
                className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
                  typeFilter === filter.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SHOP_TYPE_FILTERS.slice(5).map(filter => (
              <button
                key={filter.id}
                onClick={() => setTypeFilter(typeFilter === filter.id ? null : filter.id)}
                className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
                  typeFilter === filter.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 justify-center overflow-auto p-0.5">
          <div className="grid w-max max-w-full grid-cols-[repeat(5,3.25rem)] gap-2.5 sm:grid-cols-[repeat(6,3.25rem)] sm:gap-3">
            {filteredItems.map(item => {
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
                    <ShopItemIcon item={item} />
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
