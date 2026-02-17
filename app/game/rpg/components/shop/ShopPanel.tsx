'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { RefreshCw } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'
import { CopperDisplay } from '../shared/CopperDisplay'
import { ShopItem, QUALITY_COLORS, STAT_NAMES, formatCopper, GameItem } from '../../types'
import {
  getShopItemIcon,
  ITEM_TYPE_NAMES,
  getEquipmentSlot,
  getItemTotalStats,
} from '../../utils/itemUtils'

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

  const canAffordRefresh = character != null && character.copper >= SHOP_REFRESH_COST_COPPER

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

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(99, parseInt(e.target.value) || 1))
    setBuyQuantity(value)
  }

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
          <div className="flex items-center gap-2">
            {shopNextRefreshAt != null && (
              <span className="text-muted-foreground text-[10px] sm:text-xs">
                下次刷新：{format(shopNextRefreshAt * 1000, 'HH:mm', { locale: zhCN })}
              </span>
            )}
            <button
              type="button"
              onClick={() => refreshShopItems()}
              disabled={isLoading || !canAffordRefresh}
              className="text-muted-foreground hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50"
              title={canAffordRefresh ? '强制刷新 (1银)' : '货币不足，需要1银币'}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
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
      </div>

      <ItemDetailModal
        item={selectedShopItem}
        onClose={() => setSelectedShopItem(null)}
        buyQuantity={buyQuantity}
        setBuyQuantity={setBuyQuantity}
        totalBuyPrice={totalBuyPrice}
        onBuy={handleBuy}
        disabledBuy={isLoading || !character || !canAfford || !levelEnough}
        isLoading={isLoading}
        character={character}
        canAfford={!!canAfford}
        levelEnough={!!levelEnough}
        equippedItem={selectedShopItem ? getEquippedItem(selectedShopItem) : null}
      />
    </div>
  )
}

type ItemDetailModalProps = {
  item: ShopItem | null
  buyQuantity: number
  setBuyQuantity: (quantity: number) => void
  totalBuyPrice: number
  onBuy: () => void
  disabledBuy: boolean
  onClose: () => void
  isLoading: boolean
  character: any
  canAfford: boolean
  levelEnough: boolean
  equippedItem: GameItem | null
}

function ItemDetailModal({
  item,
  buyQuantity,
  setBuyQuantity,
  totalBuyPrice,
  onBuy,
  disabledBuy,
  onClose,
  isLoading,
  character,
  canAfford,
  levelEnough,
  equippedItem,
}: ItemDetailModalProps) {
  if (!item) return null

  // 将 ShopItem 转换为用于对比计算的属性
  const shopItemStats: Record<string, number> = { ...item.base_stats }

  // 计算属性差异
  const equippedStats = equippedItem ? getItemTotalStats(equippedItem) : {}
  const allStatKeys = Array.from(
    new Set([...Object.keys(shopItemStats), ...Object.keys(equippedStats)])
  )

  // 过滤出有差异的属性
  const diffStats = allStatKeys.filter(stat => {
    const shopValue = shopItemStats[stat] || 0
    const equippedValue = equippedStats[stat] || 0
    return shopValue !== equippedValue
  })

  const hasComparison = equippedItem && diffStats.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="border-border bg-card max-w-md rounded-xl border p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getShopItemIcon(item.type, item.sub_type)}</span>
            <div>
              <h5 className="text-foreground text-lg font-bold">{item.name}</h5>
              <p className="text-muted-foreground text-sm">
                {ITEM_TYPE_NAMES[item.type]}
                {item.sub_type && ` - ${item.sub_type}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 装备对比面板 - 左右两个card */}
        {hasComparison && (
          <div className="grid grid-cols-2 gap-2">
            {/* 左边：当前装备 */}
            <div className="border-border rounded-lg border">
              <div
                className="p-2 text-center text-xs font-medium"
                style={{
                  background: `linear-gradient(135deg, ${QUALITY_COLORS[equippedItem.quality]}20 0%, ${QUALITY_COLORS[equippedItem.quality]}10 100%)`,
                  borderBottom: `1px solid ${QUALITY_COLORS[equippedItem.quality]}30`,
                }}
              >
                当前装备
              </div>
              <div className="p-2">
                <div className="mb-2 flex justify-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded border-2"
                    style={{ borderColor: QUALITY_COLORS[equippedItem.quality] }}
                  >
                    <span className="text-2xl">
                      {getShopItemIcon(equippedItem.definition?.type, '')}
                    </span>
                  </div>
                </div>
                <div className="mb-2 text-center">
                  <span
                    className="text-sm font-bold"
                    style={{ color: QUALITY_COLORS[equippedItem.quality] }}
                  >
                    {equippedItem.definition?.name}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  {diffStats.map(stat => {
                    const shopValue = shopItemStats[stat] || 0
                    const equippedValue = equippedStats[stat] || 0
                    const diff = shopValue - equippedValue
                    return (
                      <div key={stat} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                        <span className="font-medium">{equippedValue}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            {/* 右边：新物品 */}
            <div className="border-border flex-1 rounded-lg border">
              <div
                className="bg-green-500/10 p-2 text-center text-xs font-medium text-green-600 dark:text-green-400"
                style={{ borderBottom: '1px solid rgba(34,197,94,0.3)' }}
              >
                商店物品
              </div>
              <div className="p-2">
                <div className="mb-2 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-green-500">
                    <span className="text-2xl">{getShopItemIcon(item.type, item.sub_type)}</span>
                  </div>
                </div>
                <div className="mb-2 text-center">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {item.name}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  {diffStats.map(stat => {
                    const shopValue = shopItemStats[stat] || 0
                    const equippedValue = equippedStats[stat] || 0
                    const diff = shopValue - equippedValue
                    return (
                      <div key={stat} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                        <span
                          className={
                            diff > 0 ? 'font-medium text-green-500' : 'font-medium text-red-500'
                          }
                        >
                          {shopValue} ({diff > 0 ? '+' : ''}
                          {diff})
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* 数量选择（药水） */}
                {item.type === 'potion' && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">数量:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                        className="bg-muted text-foreground hover:bg-secondary h-7 w-7 rounded text-sm transition-colors"
                        disabled={isLoading || buyQuantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{buyQuantity}</span>
                      <button
                        onClick={() => setBuyQuantity(Math.min(99, buyQuantity + 1))}
                        className="bg-muted text-foreground hover:bg-secondary h-7 w-7 rounded text-sm transition-colors"
                        disabled={isLoading || buyQuantity >= 99}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* 需要等级 */}
                <div className="text-muted-foreground mt-2 text-xs">
                  需要等级: {item.required_level}
                </div>

                {/* 价格 */}
                <div className="text-sm text-yellow-600 dark:text-yellow-400">
                  <CopperDisplay copper={item.buy_price} size="sm" maxParts={1} />
                </div>

                {/* 总价 - 仅多买时显示 */}
                {totalBuyPrice > item.buy_price && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-medium">总价:</span>
                    <span
                      className={`font-bold ${canAfford ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500'}`}
                    >
                      <CopperDisplay copper={totalBuyPrice} size="sm" maxParts={1} />
                    </span>
                  </div>
                )}

                {/* 购买按钮 */}
                <button
                  onClick={onBuy}
                  disabled={disabledBuy}
                  className="mt-2 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {!canAfford ? '货币不足' : !levelEnough ? '等级不足' : '确认购买'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 无对比时显示属性 */}
        {!hasComparison && (
          <>
            <div className="space-y-1">
              {Object.entries(item.base_stats || {})
                .filter(([stat]) => item.type !== 'potion' || stat !== 'restore')
                .map(([stat, value]) => (
                  <p key={stat} className="text-sm text-green-600 dark:text-green-400">
                    +
                    {typeof value === 'number' && value < 1 && stat.includes('crit')
                      ? `${(value * 100).toFixed(0)}%`
                      : value}{' '}
                    {STAT_NAMES[stat] || stat}
                  </p>
                ))}
            </div>

            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>需要等级: {item.required_level}</span>
              <span className="text-yellow-600 dark:text-yellow-400">
                <CopperDisplay copper={item.buy_price} size="sm" maxParts={1} />
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
