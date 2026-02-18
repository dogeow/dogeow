'use client'

import type { GameItem, ItemQuality, ShopItem } from '@/app/game/rpg/types'
import { QUALITY_COLORS, QUALITY_NAMES, STAT_NAMES } from '@/app/game/rpg/types'
import { ItemTipIcon } from './ItemTipIcon'
import {
  getItemDisplayName,
  getItemTotalStats,
  getShopItemIcon,
  ITEM_TYPE_NAMES,
} from '@/app/game/rpg/utils/itemUtils'
import { CopperDisplay } from '@/app/game/rpg/components/shared/CopperDisplay'

interface ItemDetailContentProps {
  item: GameItem | ShopItem
  type: 'inventory' | 'shop' | 'equipment'
}

export function ItemDetailContent({ item, type }: ItemDetailContentProps) {
  const isShopItem = type === 'shop'
  const quality = isShopItem ? item.quality : (item as GameItem).quality

  // 获取属性
  const stats = isShopItem ? (item as ShopItem).base_stats : getItemTotalStats(item as GameItem)

  // 获取显示名称
  const displayName = isShopItem ? (item as ShopItem).name : getItemDisplayName(item as GameItem)

  // 获取类型名称
  const typeName = isShopItem
    ? ITEM_TYPE_NAMES[(item as ShopItem).type]
    : ITEM_TYPE_NAMES[(item as GameItem).definition?.type ?? '']

  // 获取子类型
  const subType = isShopItem ? (item as ShopItem).sub_type : (item as GameItem).definition?.sub_type

  // 获取需求等级
  const requiredLevel = isShopItem
    ? (item as ShopItem).required_level
    : (item as GameItem).definition?.required_level

  // 获取售价/买价
  const price = isShopItem ? (item as ShopItem).buy_price : (item as GameItem).sell_price

  // 获取买价（仅装备显示）
  const buyPrice = !isShopItem ? (item as GameItem).definition?.buy_price : undefined

  return (
    <div
      className="relative flex gap-3 p-3"
      style={{
        background: `linear-gradient(135deg, ${QUALITY_COLORS[quality as ItemQuality]}20 0%, ${QUALITY_COLORS[quality as ItemQuality]}10 100%)`,
        borderBottom: `1px solid ${QUALITY_COLORS[quality as ItemQuality]}30`,
      }}
    >
      {/* 物品图片 */}
      {isShopItem ? (
        <span
          className="relative flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-lg border-2 shadow-sm"
          style={{ borderColor: QUALITY_COLORS[quality as ItemQuality] }}
        >
          <span className="text-5xl drop-shadow-sm">
            {getShopItemIcon((item as ShopItem).type, (item as ShopItem).sub_type)}
          </span>
        </span>
      ) : (
        <ItemTipIcon item={item as GameItem} className="shrink-0 drop-shadow-lg" />
      )}

      {/* 物品名称和属性 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h5
              className="min-w-0 text-sm leading-tight font-bold break-words sm:text-base"
              style={{ color: QUALITY_COLORS[quality as ItemQuality] }}
            >
              {displayName}
            </h5>
            <span className="text-xs" style={{ color: QUALITY_COLORS[quality as ItemQuality] }}>
              {QUALITY_NAMES[quality as ItemQuality]}
            </span>
          </div>
        </div>

        {/* 属性信息 */}
        <div className="mt-1 space-y-0.5 text-xs">
          {Object.entries(stats || {}).map(([stat, value]) => {
            // 药水不显示 restore 属性
            if (isShopItem && (item as ShopItem).type === 'potion' && stat === 'restore') {
              return null
            }
            // 格式化显示数值
            const formatValue = (v: number) => {
              if (stat === 'crit_damage') {
                // 暴击伤害：显示为百分比（如 50%）
                return `${Math.round(v * 100)}%`
              }
              if (stat === 'crit_rate' && Math.abs(v) < 1) {
                // 暴击率小于1时显示为百分比
                return `${(v * 100).toFixed(0)}%`
              }
              // 处理其他浮点数精度问题
              if (typeof v === 'number' && !Number.isInteger(v)) {
                return Number(v.toFixed(2))
              }
              return v
            }
            return (
              <p key={stat} className="text-green-600 dark:text-green-400">
                +{formatValue(Number(value))} {STAT_NAMES[stat] || stat}
              </p>
            )
          })}

          {/* 词缀属性（仅背包物品） */}
          {!isShopItem &&
            (item as GameItem).affixes?.map((affix, i) => (
              <p key={i} className="text-blue-600 dark:text-blue-400">
                {Object.entries(affix)
                  .map(([k, v]) => `+${v} ${STAT_NAMES[k] || k}`)
                  .join(', ')}
              </p>
            ))}

          <p className="text-muted-foreground">需求等级: {requiredLevel ?? '—'}</p>

          {/* 买价（仅背包物品有definition时） */}
          {buyPrice != null && buyPrice > 0 && (
            <p className="text-purple-600 dark:text-purple-400">
              售价: <CopperDisplay copper={buyPrice} size="xs" nowrap />
            </p>
          )}

          {/* 卖出价 */}
          {price != null && price > 0 && (
            <p
              className={
                isShopItem
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-yellow-600 dark:text-yellow-400'
              }
            >
              {isShopItem ? '价格: ' : '卖出: '}
              <CopperDisplay copper={price} size="xs" nowrap />
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
