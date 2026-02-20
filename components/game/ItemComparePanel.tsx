'use client'

import type { GameItem, ShopItem, ItemQuality } from '@/app/game/rpg/types'
import { QUALITY_COLORS, STAT_NAMES } from '@/app/game/rpg/types'
import { ItemIcon } from './ItemIcon'
import { ItemActions, type ItemActionType } from './ItemActions'
import {
  getItemDisplayName,
  getItemTotalStats,
  getShopItemIcon,
  getEquipmentSlot,
} from '@/app/game/rpg/utils/itemUtils'
import { CopperDisplay } from '@/app/game/rpg/components/shared/CopperDisplay'

interface ItemComparePanelProps {
  newItem: GameItem | ShopItem
  equippedItem: GameItem
  isShop?: boolean
}

/** 装备对比面板 */
export function ItemComparePanel({ newItem, equippedItem, isShop = false }: ItemComparePanelProps) {
  const isShopItem = isShop

  // 计算新物品属性
  const newStats = isShopItem
    ? (newItem as ShopItem).base_stats || {}
    : getItemTotalStats(newItem as GameItem)

  // 计算已装备物品属性
  const equippedStats = getItemTotalStats(equippedItem)

  // 合并所有属性键
  const allStatKeys = Array.from(
    new Set([...Object.keys(newStats || {}), ...Object.keys(equippedStats)])
  )

  // 过滤出有差异的属性
  const diffStats = allStatKeys.filter(stat => {
    const newValue = newStats[stat] || 0
    const equippedValue = equippedStats[stat] || 0
    return newValue !== equippedValue
  })

  const hasComparison = diffStats.length > 0

  if (!hasComparison) return null

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* 左边：当前装备 */}
      <div className="border-border rounded-lg border">
        <div
          className="p-2 text-center font-medium"
          style={{
            background: `linear-gradient(135deg, ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}20 0%, ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}10 100%)`,
            borderBottom: `1px solid ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}30`,
          }}
        >
          当前装备
        </div>
        <div className="p-2">
          {/* 已装备物品图标 */}
          <div className="mb-2 flex justify-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded border-2"
              style={{ borderColor: QUALITY_COLORS[equippedItem.quality as ItemQuality] }}
            >
              <ItemIcon item={equippedItem} className="drop-shadow-sm" />
            </div>
          </div>
          {/* 已装备物品名称 */}
          <div className="mb-2 text-center">
            <span
              className="text-sm font-bold"
              style={{ color: QUALITY_COLORS[equippedItem.quality as ItemQuality] }}
            >
              {getItemDisplayName(equippedItem)}
            </span>
          </div>
          {/* 对比属性 */}
          <div className="space-y-1">
            {diffStats.map(stat => {
              const newValue = newStats[stat] || 0
              const equippedValue = equippedStats[stat] || 0
              return (
                <div key={stat} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                  <span className="font-medium">{equippedValue}</span>
                </div>
              )
            })}
          </div>
          {/* 当前装备价格 */}
          {equippedItem.sell_price != null && equippedItem.sell_price > 0 && (
            <div className="mt-1 text-center text-yellow-600 dark:text-yellow-400">
              卖出: <CopperDisplay copper={equippedItem.sell_price} size="xs" nowrap />
            </div>
          )}
        </div>
      </div>

      {/* 右边：新物品 */}
      <div className="border-border flex-1 rounded-lg border">
        <div
          className="bg-green-500/10 p-2 text-center font-medium text-green-600 dark:text-green-400"
          style={{ borderBottom: '1px solid rgba(34,197,94,0.3)' }}
        >
          {isShopItem ? '商店物品' : '背包物品'}
        </div>
        <div className="p-2">
          {/* 新物品图标 */}
          <div className="mb-2 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-green-500">
              {isShopItem ? (
                <span className="text-2xl">
                  {getShopItemIcon((newItem as ShopItem).type, (newItem as ShopItem).sub_type)}
                </span>
              ) : (
                <ItemIcon item={newItem as GameItem} className="drop-shadow-sm" />
              )}
            </div>
          </div>
          {/* 新物品名称 */}
          <div className="mb-2 text-center">
            <span className="text-sm font-bold text-green-600 dark:text-green-400">
              {isShopItem ? (newItem as ShopItem).name : getItemDisplayName(newItem as GameItem)}
            </span>
          </div>
          {/* 对比属性 */}
          <div className="space-y-1">
            {diffStats.map(stat => {
              const newValue = newStats[stat] || 0
              const equippedValue = equippedStats[stat] || 0
              const diff = newValue - equippedValue
              return (
                <div key={stat} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                  <span
                    className={diff > 0 ? 'font-medium text-green-500' : 'font-medium text-red-500'}
                  >
                    {newValue} ({diff > 0 ? '+' : ''}
                    {diff})
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/** 对比版本 - 用于Modal弹窗：只显示当前装备 */
export function EquipmentComparePanel({
  newItem,
  equippedItem,
}: {
  newItem: GameItem
  equippedItem: GameItem
}) {
  const newStats = getItemTotalStats(newItem)
  const equippedStats = getItemTotalStats(equippedItem)

  // 合并所有属性键
  const allStatKeys = Array.from(new Set([...Object.keys(newStats), ...Object.keys(equippedStats)]))

  // 过滤出有差异的属性
  const diffStats = allStatKeys.filter(stat => {
    const newValue = newStats[stat] || 0
    const equippedValue = equippedStats[stat] || 0
    return newValue !== equippedValue
  })

  return (
    <div className="border-border bg-muted/20 flex w-[100px] shrink-0 flex-col border-r">
      {/* 顶部标题 */}
      <div
        className="p-2 text-center font-medium"
        style={{
          background: `linear-gradient(135deg, ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}20 0%, ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}10 100%)`,
          borderBottom: `1px solid ${QUALITY_COLORS[equippedItem.quality as ItemQuality]}30`,
        }}
      >
        当前装备
      </div>
      <div className="p-2">
        {/* 已装备物品图标 */}
        <div className="mb-1 flex justify-center">
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded border-2"
            style={{ borderColor: QUALITY_COLORS[equippedItem.quality as ItemQuality] }}
          >
            <ItemIcon item={equippedItem} className="drop-shadow-sm" />
          </div>
        </div>
        {/* 已装备物品名称 */}
        <div className="mb-1 text-center">
          <span
            className="text-sm font-bold"
            style={{ color: QUALITY_COLORS[equippedItem.quality as ItemQuality] }}
          >
            {getItemDisplayName(equippedItem)}
          </span>
        </div>
      </div>
      {/* 下方显示属性差异 */}
      <div className="border-border/50 bg-muted/10 flex-1 space-y-1 border-t px-2 py-2">
        {diffStats.length === 0 ? (
          <div className="text-muted-foreground text-center">属性相同</div>
        ) : (
          diffStats.map(stat => {
            const newValue = newStats[stat] || 0
            const equippedValue = equippedStats[stat] || 0
            const diff = newValue - equippedValue
            return (
              <div key={stat} className="flex items-center justify-between">
                <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                <span className="font-medium">
                  {diff > 0 ? (
                    <span className="text-green-500">+{diff}</span>
                  ) : (
                    <span className="text-red-500">{diff}</span>
                  )}
                </span>
              </div>
            )
          })
        )}
      </div>
      {/* 当前装备价格 */}
      {equippedItem.sell_price != null && equippedItem.sell_price > 0 && (
        <div className="border-border/50 bg-muted/10 border-t px-2 py-1.5 text-center text-yellow-600 dark:text-yellow-400">
          卖出: <CopperDisplay copper={equippedItem.sell_price} size="xs" nowrap />
        </div>
      )}
    </div>
  )
}

/** 完整对比面板 - 用于Modal弹窗：左右装备+各自属性，下方差异 */
export function FullComparePanel({
  newItem,
  equippedItem,
  isShop = false,
  actions,
  onAction,
}: {
  newItem: GameItem
  equippedItem: GameItem
  isShop?: boolean
  actions?: ItemActionType[]
  onAction?: (action: ItemActionType) => void
}) {
  const newStats = getItemTotalStats(newItem)
  const equippedStats = getItemTotalStats(equippedItem)

  // 合并所有属性键
  const allStatKeys = Array.from(new Set([...Object.keys(newStats), ...Object.keys(equippedStats)]))

  // 过滤出有差异的属性
  const diffStats = allStatKeys.filter(stat => {
    const newValue = newStats[stat] || 0
    const equippedValue = equippedStats[stat] || 0
    return newValue !== equippedValue
  })

  // 获取新物品的卖出价（与背包槽位一致：优先 sell_price，否则按 buy_price 一半）
  const newItemSellPrice =
    newItem.sell_price ?? Math.floor((newItem.definition?.buy_price ?? 0) / 2)
  const newItemRequiredLevel = newItem.definition?.required_level ?? 0

  // 获取已装备物品的价格信息
  const equippedItemBuyPrice = equippedItem.definition?.buy_price ?? 0
  const equippedItemSellPrice =
    equippedItem.sell_price ?? Math.floor((equippedItem.definition?.buy_price ?? 0) / 2)

  return (
    <div className="border-border flex flex-col border-r">
      {/* 第一个div：左右装备+各自属性 */}
      <div className="grid grid-cols-[2fr_3fr]">
        {/* 左边：已装备物品 */}
        <div className="border-border flex flex-col border-r p-2">
          <div className="mb-1 flex justify-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded border-2"
              style={{ borderColor: QUALITY_COLORS[equippedItem.quality as ItemQuality] }}
            >
              <ItemIcon item={equippedItem} className="drop-shadow-sm" />
            </div>
          </div>
          <div className="mb-2 text-center">
            <span
              className="font-bold"
              style={{ color: QUALITY_COLORS[equippedItem.quality as ItemQuality] }}
            >
              {getItemDisplayName(equippedItem)}
            </span>
          </div>
          {/* 当前装备属性 */}
          <div className="flex-1 space-y-0.5">
            {Object.entries(equippedStats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between">
                <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
          {/* 等级需求+价格信息 - 底部 */}
          <div className="border-border/50 mt-2 space-y-0.5 border-t pt-1">
            {equippedItem.definition?.required_level != null &&
              equippedItem.definition.required_level > 0 && (
                <div className="text-muted-foreground flex justify-between">
                  <span>需求等级</span>
                  <span>{equippedItem.definition.required_level}</span>
                </div>
              )}
            <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
              <span>卖出</span>
              <CopperDisplay copper={equippedItemSellPrice} size="xs" nowrap />
            </div>
            {equippedItemBuyPrice > 0 && (
              <div className="flex justify-between text-purple-600 dark:text-purple-400">
                <span>买价</span>
                <span>{equippedItemBuyPrice}</span>
              </div>
            )}
          </div>
        </div>
        {/* 右边：背包物品 */}
        <div className="flex flex-col p-2">
          <div className="mb-1 flex justify-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded border-2"
              style={{ borderColor: QUALITY_COLORS[newItem.quality as ItemQuality] }}
            >
              <ItemIcon item={newItem} className="drop-shadow-sm" />
            </div>
          </div>
          <div className="mb-2 text-center">
            <span
              className="font-bold"
              style={{ color: QUALITY_COLORS[newItem.quality as ItemQuality] }}
            >
              {getItemDisplayName(newItem)}
            </span>
          </div>
          {/* 新物品属性 */}
          <div className="flex-1 space-y-0.5">
            {Object.entries(newStats).map(([stat, value]) => (
              <div key={stat} className="flex justify-between">
                <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
          {/* 等级需求+价格 - 底部 */}
          <div className="border-border/50 mt-2 space-y-0.5 border-t pt-1">
            {newItemRequiredLevel > 0 && (
              <div className="text-muted-foreground flex justify-between">
                <span>需求等级</span>
                <span>{newItemRequiredLevel}</span>
              </div>
            )}
            <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
              <span>{isShop ? '价格' : '卖出'}</span>
              <CopperDisplay copper={newItemSellPrice} size="xs" nowrap />
            </div>
          </div>
        </div>
      </div>
      {/* 第二个div：操作按钮 - 只靠右对齐 */}
      {actions && actions.length > 0 && onAction && (
        <div className="flex justify-end p-2">
          <div className="flex flex-wrap gap-1.5">
            {actions.map(action => (
              <button
                key={action}
                onClick={() => onAction(action)}
                className={`rounded px-3 py-1.5 text-xs text-white transition-colors disabled:opacity-50 ${
                  action === 'equip' || action === 'buy'
                    ? 'bg-green-600 hover:bg-green-700'
                    : action === 'use'
                      ? 'bg-violet-600 hover:bg-violet-700'
                      : action === 'unequip'
                        ? 'bg-red-600 hover:bg-red-700'
                        : action === 'store' || action === 'retrieve'
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : action === 'socket'
                            ? 'bg-cyan-600 hover:bg-cyan-700'
                            : action === 'unsocket'
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {action === 'equip'
                  ? '装备'
                  : action === 'use'
                    ? '使用'
                    : action === 'unequip'
                      ? '卸下'
                      : action === 'store'
                        ? '存入'
                        : action === 'retrieve'
                          ? '取回'
                          : action === 'sell'
                            ? '出售'
                            : action === 'socket'
                              ? '镶嵌'
                              : action === 'unsocket'
                                ? '取下'
                                : '购买'}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* 第三个div：属性差异 - 只在有差异时显示 */}
      {diffStats.length > 0 && (
        <div className="border-border bg-muted/10 flex-1 space-y-1 border-t p-2">
          {diffStats.map(stat => {
            const newValue = newStats[stat] || 0
            const equippedValue = equippedStats[stat] || 0
            const diff = newValue - equippedValue
            return (
              <div key={stat} className="flex items-center justify-between">
                <span className="text-muted-foreground">{STAT_NAMES[stat] || stat}</span>
                <span className="font-medium">
                  {diff > 0 ? (
                    <span className="text-green-500">+{diff}</span>
                  ) : (
                    <span className="text-red-500">{diff}</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
