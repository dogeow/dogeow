'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { CopperDisplay } from './CopperDisplay'
import { ShopItem, STAT_NAMES, ItemType, formatCopper } from '../types'

/** 商店固定格位数（与仓库相同的表格形式展示） */
const SHOP_SLOTS = 60

// 物品类型图标映射
const ITEM_ICONS: Record<ItemType, string> = {
  weapon: '⚔️',
  helmet: '🪖',
  armor: '👕',
  gloves: '🧤',
  boots: '👢',
  belt: '🥋',
  ring: '💍',
  amulet: '📿',
  potion: '🧪',
  gem: '💎',
}

// 物品类型名称
const ITEM_TYPE_NAMES: Record<ItemType, string> = {
  weapon: '武器',
  helmet: '头盔',
  armor: '盔甲',
  gloves: '手套',
  boots: '靴子',
  belt: '腰带',
  ring: '戒指',
  amulet: '护身符',
  potion: '药品',
  gem: '宝石',
}

/** 获取物品图标：药水按 sub_type 区分 HP❤️/MP💙 */
const getItemIcon = (type: ItemType, subType?: string): string => {
  if (type === 'potion') {
    if (subType === 'hp') return '❤️'
    if (subType === 'mp') return '💙'
  }
  return ITEM_ICONS[type] ?? '📦'
}

export function ShopPanel() {
  const { shopItems, character, buyItem, fetchShopItems, isLoading } = useGameStore()
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null)
  const [buyQuantity, setBuyQuantity] = useState(1)

  useEffect(() => {
    fetchShopItems()
  }, [fetchShopItems])

  const shopSlots = useMemo(
    () => Array.from({ length: SHOP_SLOTS }, (_, i) => shopItems[i] ?? null),
    [shopItems]
  )

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

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 商店物品网格 - 边距与角色面板一致 */}
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <h4 className="text-foreground mb-3 text-base font-medium sm:mb-4">
          商店物品
          <span className="text-muted-foreground ml-2 text-sm">
            ({shopItems.length}/{SHOP_SLOTS})
          </span>
        </h4>
        <div className="flex min-h-0 justify-center overflow-auto p-1">
          {/* 网格宽度由列数+间距决定，w-max 无右侧留白 */}
          <div className="grid w-max max-w-full grid-cols-[repeat(4,5rem)] gap-2 sm:grid-cols-[repeat(5,5rem)]">
            {shopSlots.map((item, index) =>
              item ? (
                <button
                  key={item.id}
                  onClick={() => handleSelectShopItem(item)}
                  className={`flex h-20 w-20 shrink-0 flex-col rounded border-2 transition-all hover:scale-105 ${
                    selectedShopItem?.id === item.id
                      ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/50 dark:border-green-400 dark:bg-green-400/20'
                      : 'border-border bg-muted/50 hover:border-muted-foreground/30 hover:bg-muted'
                  } ${item.required_level > (character?.level || 0) ? 'opacity-40' : ''}`}
                  disabled={isLoading}
                  title={`${item.name} - ${formatCopper(item.buy_price)}`}
                >
                  <span className="flex min-h-0 flex-1 items-center justify-center text-2xl">
                    {getItemIcon(item.type, item.sub_type)}
                  </span>
                  <span className="border-border/50 bg-muted/80 flex shrink-0 items-center justify-center overflow-hidden rounded-b-[calc(0.25rem-2px)] border-t py-0.5">
                    <CopperDisplay copper={item.buy_price} size="xs" nowrap />
                  </span>
                </button>
              ) : (
                <EmptySlot key={`empty-${index}`} />
              )
            )}
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
}: ItemDetailModalProps) {
  if (!item) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="border-border bg-card max-w-md rounded-xl border p-6 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getItemIcon(item.type, item.sub_type)}</span>
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

          {/* 属性 */}
          <div className="space-y-1">
            {Object.entries(item.base_stats || {}).map(([stat, value]) => (
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
              <CopperDisplay copper={item.buy_price} size="sm" />
            </span>
          </div>

          {/* 数量选择和购买 */}
          <div className="border-border space-y-3 border-t pt-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">数量:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                  className="bg-muted text-foreground hover:bg-secondary h-8 w-8 rounded transition-colors"
                  disabled={isLoading || buyQuantity <= 1}
                >
                  -
                </button>
                <input
                  type="number"
                  value={buyQuantity}
                  onChange={e =>
                    setBuyQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))
                  }
                  className="border-input bg-muted text-foreground w-16 rounded border px-2 py-1 text-center text-sm disabled:opacity-50"
                  min="1"
                  max="99"
                  disabled={isLoading}
                />
                <button
                  onClick={() => setBuyQuantity(Math.min(99, buyQuantity + 1))}
                  className="bg-muted text-foreground hover:bg-secondary h-8 w-8 rounded transition-colors"
                  disabled={isLoading || buyQuantity >= 99}
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground font-medium">总价:</span>
              <span
                className={`font-bold ${
                  canAfford
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                <CopperDisplay copper={totalBuyPrice} size="sm" />
              </span>
            </div>

            <button
              onClick={onBuy}
              disabled={disabledBuy}
              className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {!canAfford ? '货币不足' : !levelEnough ? '等级不足' : '确认购买'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptySlot() {
  return (
    <div
      className="border-border bg-muted/50 flex h-20 w-20 shrink-0 items-center justify-center rounded border-2 border-dashed"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '8px 8px',
      }}
      aria-hidden
    />
  )
}
