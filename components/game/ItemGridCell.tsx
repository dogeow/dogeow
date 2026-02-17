'use client'

import type { GameItem, ItemQuality, ShopItem } from '@/app/game/rpg/types'
import { QUALITY_COLORS } from '@/app/game/rpg/types'
import { ItemIcon } from './ItemIcon'
import { getItemDisplayName, getShopItemIcon } from '@/app/game/rpg/utils/itemUtils'

interface BaseItemGridCellProps {
  isSelected?: boolean
  onClick?: () => void
  disabled?: boolean
}

interface GameItemGridCellProps extends BaseItemGridCellProps {
  item: GameItem
  showPrice?: boolean
}

interface ShopItemGridCellProps extends BaseItemGridCellProps {
  item: ShopItem
  showPrice?: boolean
}

type ItemGridCellProps = GameItemGridCellProps | ShopItemGridCellProps

/** 物品格子组件 */
export function ItemGridCell(props: ItemGridCellProps) {
  const { isSelected, onClick, disabled, item, showPrice = false } = props

  const isShopItem = 'buy_price' in item && !('definition' in item)

  // 获取品质颜色
  const quality = item.quality
  const borderColor = isSelected ? undefined : QUALITY_COLORS[quality as ItemQuality]

  // 获取价格
  const price = isShopItem ? (item as ShopItem).buy_price : (item as GameItem).sell_price
  const quantity = !isShopItem ? (item as GameItem).quantity : 1
  const totalPrice = (price ?? 0) * quantity

  // 获取显示名称
  const displayName = isShopItem ? (item as ShopItem).name : getItemDisplayName(item as GameItem)

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-14 w-14 shrink-0 flex-col rounded border-2 transition-all hover:scale-105 ${
        isSelected
          ? 'border-green-500 bg-green-500/20 shadow-lg shadow-green-500/50 dark:border-green-400 dark:bg-green-400/20'
          : 'bg-muted/50 hover:border-muted-foreground/30 hover:bg-muted'
      }`}
      style={borderColor ? { borderColor } : undefined}
      title={displayName}
    >
      {/* 物品图标 */}
      <span className="flex min-h-0 flex-1 items-center justify-center text-lg">
        {isShopItem ? (
          <span className="drop-shadow-sm">
            {getShopItemIcon((item as ShopItem).type, (item as ShopItem).sub_type)}
          </span>
        ) : (
          <ItemIcon item={item as GameItem} className="drop-shadow-sm" />
        )}
        {/* 数量显示 */}
        {!isShopItem && quantity > 1 && (
          <span className="absolute top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded bg-black/70 text-[10px] font-bold text-white">
            {quantity}
          </span>
        )}
      </span>
      {/* 价格显示 */}
      {showPrice && totalPrice > 0 && (
        <span className="border-border/50 bg-muted/80 flex shrink-0 items-center justify-center overflow-hidden rounded-b-[calc(0.2rem-2px)] border-t px-1.5 py-1">
          <span className="text-[9px] font-medium text-yellow-400">{totalPrice}</span>
        </span>
      )}
    </button>
  )
}

/** 空物品格子 */
export function EmptyGridCell() {
  return (
    <div
      className="border-border bg-card flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 border-dashed"
      aria-hidden
    />
  )
}

/** 装备槽位格子 */
export function EquipmentSlotCell({
  slot,
  item,
  onClick,
  label,
}: {
  slot: string
  item: GameItem | null | undefined
  onClick: () => void
  label?: string
}) {
  const borderColor = item ? QUALITY_COLORS[item.quality as ItemQuality] : undefined

  return (
    <button
      onClick={onClick}
      disabled={!item}
      className={`relative flex h-12 w-12 items-center justify-center rounded border-2 text-xl shadow-sm transition-all ${
        item
          ? 'bg-secondary cursor-pointer hover:shadow-md'
          : 'border-border bg-card cursor-default border-dashed'
      }`}
      style={borderColor ? { borderColor } : undefined}
      title={item ? getItemDisplayName(item) : label || slot}
    >
      {item ? (
        <ItemIcon item={item} className="drop-shadow-sm" />
      ) : (
        <span className="text-muted-foreground text-xs">{label || slot}</span>
      )}
    </button>
  )
}
