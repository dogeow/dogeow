'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import Image from 'next/image'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGameStore } from '../../stores/gameStore'
import { CopperDisplay } from '../shared/CopperDisplay'
import {
  GameItem,
  QUALITY_COLORS,
  QUALITY_NAMES,
  SLOT_NAMES,
  EquipmentSlot,
  STAT_NAMES,
  ItemQuality,
} from '../../types'
import {
  getItemIconFallback,
  getItemDisplayName,
  isEquippable,
  isPotion,
  stackItems,
  itemMatchesCategory,
  getEquipmentSlot,
  getItemTotalStats,
} from '../../utils/itemUtils'

// 背包分类 tabs：emoji + 对应物品 type（不显示「全部」按钮，再次点击当前分类即取消选择 = 显示全部）
const INVENTORY_CATEGORIES = [
  { id: 'weapon', emoji: '⚔️', label: '武器', types: ['weapon'] },
  {
    id: 'armor',
    emoji: '🛡️',
    label: '防具',
    types: ['helmet', 'armor', 'gloves', 'boots', 'belt'],
  },
  { id: 'accessory', emoji: '💍', label: '饰品', types: ['ring', 'amulet'] },
  { id: 'potion', emoji: '🧪', label: '药水', types: ['potion'] },
  { id: 'gem', emoji: '💎', label: '宝石', types: ['gem'] },
] as const

/** 物品图标：优先 /game/rpg/items/item_{definition_id}.png（按 game_item_definitions 生成），加载失败则用 emoji */
function ItemIcon({ item, className }: { item: GameItem; className?: string }) {
  const definitionId = item.definition?.id
  const fallback = getItemIconFallback(item)
  const [useImg, setUseImg] = useState(definitionId != null)
  const src = definitionId != null ? `/game/rpg/items/item_${definitionId}.png` : ''
  return (
    <span
      className={`relative inline-flex h-full w-full items-center justify-center ${className ?? ''}`}
    >
      {useImg && src ? (
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

/** 物品 tip 中的大图标 */
function ItemTipIcon({ item, className }: { item: GameItem; className?: string }) {
  const definitionId = item.definition?.id
  const fallback = getItemIconFallback(item)
  const [useImg, setUseImg] = useState(definitionId != null)
  const src = definitionId != null ? `/game/rpg/items/item_${definitionId}.png` : ''
  return (
    <span
      className={`relative inline-flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-lg border-2 shadow-sm ${className ?? ''}`}
      style={{ borderColor: QUALITY_COLORS[item.quality] }}
    >
      {useImg && src ? (
        <Image
          src={src}
          alt=""
          fill
          className="rounded-md object-contain p-1"
          sizes="100px"
          onError={() => setUseImg(false)}
        />
      ) : (
        <span className="text-5xl drop-shadow-sm">{fallback}</span>
      )}
    </span>
  )
}

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
    isLoading,
  } = useGameStore()
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
  const [showStorage, setShowStorage] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')
  const [sellQuantity, setSellQuantity] = useState<number>(1)
  const [showSellConfirm, setShowSellConfirm] = useState(false)

  // 品质回收相关状态
  const [recyclingQuality, setRecyclingQuality] = useState<string | null>(null)

  // 计算每个品质的装备数量和总价
  const qualityStats = useMemo(() => {
    const stats: Record<string, { count: number; totalPrice: number }> = {}
    inventory.forEach(item => {
      const type = item.definition?.type
      // 只计算非药水、非宝石的装备
      if (type !== 'potion' && type !== 'gem') {
        const q = item.quality
        if (!stats[q]) {
          stats[q] = { count: 0, totalPrice: 0 }
        }
        stats[q].count++
        stats[q].totalPrice += (item.sell_price ?? 0) * (item.quantity ?? 1)
      }
    })
    return stats
  }, [inventory])

  // 处理品质回收
  const handleRecycleQuality = async (quality: string) => {
    setRecyclingQuality(quality)
    try {
      await sellItemsByQuality(quality)
    } finally {
      setRecyclingQuality(null)
    }
  }

  // 背包按 slot_index 放入对应格位，与后端格位一致（格位数由后端提供）
  const inventorySlots = useMemo(() => {
    const slots: (GameItem | null)[] = Array.from({ length: inventorySize }, () => null)
    inventory.forEach(item => {
      const idx = item.slot_index
      if (typeof idx === 'number' && idx >= 0 && idx < inventorySize) slots[idx] = item
    })
    return slots
  }, [inventory, inventorySize])
  // 仓库按 slot_index 放入对应格位
  const warehouseSlots = useMemo(() => {
    const slots: (GameItem | null)[] = Array.from({ length: storageSize }, () => null)
    storage.forEach(item => {
      const idx = item.slot_index
      if (typeof idx === 'number' && idx >= 0 && idx < storageSize) slots[idx] = item
    })
    return slots
  }, [storage, storageSize])

  const category = useMemo(
    () =>
      categoryId === ''
        ? { types: null as readonly string[] | null }
        : (INVENTORY_CATEGORIES.find(c => c.id === categoryId) ?? {
            types: null as readonly string[] | null,
          }),
    [categoryId]
  )
  // 当前 Tab 对应的格位（背包或仓库），每格带 source；分类非空时只显示该分类物品（紧凑）
  type SlotCell = { item: GameItem | null; source: 'inventory' | 'storage' }
  const displaySlots = useMemo((): SlotCell[] => {
    const raw = showStorage
      ? warehouseSlots.map(item => ({ item, source: 'storage' as const }))
      : inventorySlots.map(item => ({ item, source: 'inventory' as const }))
    if (!category.types) return raw
    return raw.filter(
      (cell): cell is SlotCell & { item: GameItem } =>
        cell.item != null && itemMatchesCategory(cell.item, category.types)
    )
  }, [showStorage, inventorySlots, warehouseSlots, category])

  const handleEquip = async () => {
    if (!selectedItem) return
    await equipItem(selectedItem.id)
    setSelectedItem(null)
  }

  const handleSell = async () => {
    if (!selectedItem) return
    if (selectedItem.quantity > 1) {
      setSellQuantity(1)
      setShowSellConfirm(true)
    } else {
      await sellItem(selectedItem.id, 1)
      setSelectedItem(null)
    }
  }

  const handleSellConfirm = async () => {
    if (!selectedItem) return
    await sellItem(selectedItem.id, sellQuantity)
    setShowSellConfirm(false)
    setSelectedItem(null)
  }

  const handleMove = async (toStorage: boolean) => {
    if (!selectedItem) return
    await moveItem(selectedItem.id, toStorage)
    setSelectedItem(null)
  }

  const handleUsePotion = async () => {
    if (!selectedItem) return
    await consumePotion(selectedItem.id)
    setSelectedItem(null)
  }

  // 判断物品是否有对应的已装备物品
  const hasEquippedItem = (item: GameItem): boolean => {
    const slot = getEquipmentSlot(item)
    if (!slot) return false
    // 戒指特殊处理：检查 ring1 或 ring2
    if (slot === 'ring1') {
      return !!(equipment.ring1 || equipment.ring2)
    }
    return !!equipment[slot]
  }

  // 获取已装备的物品
  const getEquippedItem = (item: GameItem): GameItem | null => {
    const slot = getEquipmentSlot(item)
    if (!slot) return null
    // 戒指特殊处理：优先返回 ring1，否则返回 ring2
    if (slot === 'ring1') {
      return equipment.ring1 || equipment.ring2
    }
    return equipment[slot] ?? null
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
      {/* 背包/仓库 - 装备栏已移至角色面板 */}
      <div className="bg-card border-border flex min-w-0 flex-1 flex-col rounded-lg border p-3 sm:p-4">
        <div className="mb-3 flex shrink-0 flex-wrap items-center gap-1.5 sm:mb-4 sm:gap-2">
          <button
            type="button"
            onClick={() => setShowStorage(false)}
            className={`flex flex-col items-center rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
              !showStorage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <span>背包</span>
            <span className="text-[10px] opacity-90 sm:text-xs">
              {inventory.length}/{inventorySize}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowStorage(true)}
            className={`flex flex-col items-center rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
              showStorage ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            <span>仓库</span>
            <span className="text-[10px] opacity-90 sm:text-xs">
              {storage.length}/{storageSize}
            </span>
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
            {INVENTORY_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(prev => (prev === cat.id ? '' : cat.id))}
                className={`rounded px-2 py-1.5 text-sm transition-colors ${
                  categoryId === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
                title={cat.label}
              >
                <span className="mr-0.5">{cat.emoji}</span>
                <span className="hidden sm:inline">{cat.label}</span>
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1 rounded px-2 py-1.5 text-sm transition-colors"
                  title="排序"
                >
                  <span>排序</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-24 p-1" align="end">
                <button
                  type="button"
                  onClick={() => sortInventory('default')}
                  className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm"
                >
                  默认
                </button>
                <button
                  type="button"
                  onClick={() => sortInventory('quality')}
                  className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm"
                >
                  品质
                </button>
                <button
                  type="button"
                  onClick={() => sortInventory('price')}
                  className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm"
                >
                  价格
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="mx-auto min-h-0 flex-1 overflow-auto p-1">
          <div className="flex w-[20.5rem] flex-wrap gap-x-2 gap-y-2 sm:w-[26.5rem]">
            {displaySlots.map((cell, index) =>
              cell.item ? (
                <Popover
                  key={cell.item.id}
                  open={selectedItem?.id === cell.item.id}
                  onOpenChange={open => {
                    if (!open) setSelectedItem(null)
                  }}
                >
                  <PopoverTrigger asChild>
                    <div
                      className={`relative flex h-14 w-10 shrink-0 flex-col items-center rounded border-2 shadow-sm transition-all hover:shadow-md ${
                        selectedItem?.id === cell.item.id
                          ? 'border-yellow-500 ring-2 ring-yellow-500/50 dark:border-yellow-400 dark:ring-yellow-400/50'
                          : 'border-border'
                      }`}
                      style={{
                        background:
                          selectedItem?.id === cell.item.id
                            ? `${QUALITY_COLORS[cell.item.quality]}20`
                            : `linear-gradient(135deg, ${QUALITY_COLORS[cell.item.quality]}15 0%, ${QUALITY_COLORS[cell.item.quality]}08 100%)`,
                        borderColor:
                          selectedItem?.id === cell.item.id
                            ? undefined
                            : QUALITY_COLORS[cell.item.quality],
                      }}
                      title={getItemDisplayName(cell.item)}
                    >
                      <button
                        onClick={() =>
                          setSelectedItem(prev => (prev?.id === cell.item?.id ? null : cell.item))
                        }
                        className="flex h-10 w-full items-center justify-center text-lg"
                      >
                        <ItemIcon item={cell.item} className="drop-shadow-sm" />
                        {cell.item.quantity > 1 && (
                          <span className="absolute top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded bg-black/70 text-[10px] font-bold text-white">
                            {cell.item.quantity}
                          </span>
                        )}
                      </button>
                      {/* 价格显示 */}
                      <div className="absolute -bottom-0.5 flex w-full items-center justify-center">
                        <span className="rounded bg-black/70 px-1 text-[9px] font-medium text-yellow-400">
                          {(cell.item.sell_price ?? 0) * (cell.item.quantity ?? 1)}
                        </span>
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent
                    className={`${isEquippable(cell.item) && cell.source === 'inventory' && hasEquippedItem(cell.item) ? 'w-[380px]' : 'w-[280px]'} max-w-[85vw] p-0`}
                    side="bottom"
                    align="center"
                    sideOffset={8}
                    collisionPadding={12}
                  >
                    <div className="flex">
                      {/* 对比面板 - 左边 */}
                      {isEquippable(cell.item) &&
                        cell.source === 'inventory' &&
                        hasEquippedItem(cell.item) && (
                          <EquipmentComparePanel
                            newItem={cell.item}
                            equippedItem={getEquippedItem(cell.item)!}
                          />
                        )}
                      {/* 物品详情 - 右边 */}
                      <div className="flex flex-1 flex-col">
                        {/* 头部：图片在左，属性在右 */}
                        <div
                          className="relative flex gap-3 p-3"
                          style={{
                            background: `linear-gradient(135deg, ${QUALITY_COLORS[cell.item.quality]}20 0%, ${QUALITY_COLORS[cell.item.quality]}10 100%)`,
                            borderBottom: `1px solid ${QUALITY_COLORS[cell.item.quality]}30`,
                          }}
                        >
                          {/* 物品图片 */}
                          <ItemTipIcon item={cell.item} className="shrink-0 drop-shadow-lg" />
                          {/* 物品名称和属性 */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5
                                  className="min-w-0 text-sm leading-tight font-bold break-words sm:text-base"
                                  style={{ color: QUALITY_COLORS[cell.item.quality] }}
                                >
                                  {getItemDisplayName(cell.item)}
                                </h5>
                                <span
                                  className="text-xs"
                                  style={{ color: QUALITY_COLORS[cell.item.quality] }}
                                >
                                  {QUALITY_NAMES[cell.item.quality]}
                                </span>
                              </div>
                              <button
                                onClick={() => setSelectedItem(null)}
                                className="text-muted-foreground hover:text-foreground ml-1 shrink-0 p-1"
                              >
                                ✕
                              </button>
                            </div>
                            {/* 属性信息 */}
                            <div className="mt-1 space-y-0.5 text-xs">
                              {Object.entries(cell.item.stats || {}).map(([stat, value]) => (
                                <p key={stat} className="text-green-600 dark:text-green-400">
                                  +{value} {STAT_NAMES[stat] || stat}
                                </p>
                              ))}
                              {cell.item.affixes?.map((affix, i) => (
                                <p key={i} className="text-blue-600 dark:text-blue-400">
                                  {Object.entries(affix)
                                    .map(([k, v]) => `+${v} ${STAT_NAMES[k] || k}`)
                                    .join(', ')}
                                </p>
                              ))}
                              <p className="text-muted-foreground">
                                需求等级: {cell.item.definition?.required_level ?? '—'}
                              </p>
                              {cell.item.definition?.buy_price != null &&
                                cell.item.definition.buy_price > 0 && (
                                  <p className="text-purple-600 dark:text-purple-400">
                                    售价:{' '}
                                    <CopperDisplay
                                      copper={cell.item.definition.buy_price}
                                      size="xs"
                                      nowrap
                                    />
                                  </p>
                                )}
                              {cell.item.sell_price != null && cell.item.sell_price > 0 && (
                                <p className="text-yellow-600 dark:text-yellow-400">
                                  卖出:{' '}
                                  <CopperDisplay copper={cell.item.sell_price} size="xs" nowrap />
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* 操作按钮 */}
                        <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 border-t p-2.5">
                          {cell.source === 'inventory' &&
                            cell.item.definition?.type === 'potion' && (
                              <button
                                onClick={handleUsePotion}
                                disabled={isLoading}
                                className="rounded bg-violet-600 px-3 py-1.5 text-xs text-white hover:bg-violet-700 disabled:opacity-50"
                              >
                                使用
                              </button>
                            )}
                          {cell.source === 'inventory' &&
                            cell.item.definition?.type !== 'potion' &&
                            cell.item.definition?.type !== 'gem' && (
                              <button
                                onClick={handleEquip}
                                disabled={isLoading}
                                className="rounded bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                装备
                              </button>
                            )}
                          <button
                            onClick={() => handleMove(cell.source === 'inventory')}
                            disabled={isLoading}
                            className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {cell.source === 'storage' ? '取回' : '存入'}
                          </button>
                          {cell.source === 'inventory' && (
                            <button
                              onClick={handleSell}
                              disabled={isLoading}
                              className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              出售
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <EmptySlot key={`empty-${index}`} />
              )
            )}
          </div>
        </div>

        {/* 品质回收按钮 - 仅背包显示 */}
        {!showStorage && (
          <div className="border-border mt-3 border-t pt-3">
            <div className="text-muted-foreground mb-1.5 text-xs">批量回收装备</div>
            <div className="flex flex-wrap gap-1.5">
              {['common', 'magic', 'rare', 'legendary', 'mythic'].map(quality => {
                const stats = qualityStats[quality]
                if (!stats || stats.count === 0) return null

                return (
                  <button
                    key={quality}
                    onClick={() => handleRecycleQuality(quality)}
                    disabled={isLoading || recyclingQuality === quality}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{
                      backgroundColor: `${QUALITY_COLORS[quality as ItemQuality]}20`,
                      color: QUALITY_COLORS[quality as ItemQuality],
                      border: `1px solid ${QUALITY_COLORS[quality as ItemQuality]}40`,
                    }}
                  >
                    <span>{QUALITY_NAMES[quality as ItemQuality]}</span>
                    <span className="opacity-70">({stats.count})</span>
                    <span className="text-yellow-400">{stats.totalPrice}</span>
                    {recyclingQuality === quality && <span className="ml-1 animate-spin">⏳</span>}
                  </button>
                )
              })}
              {Object.values(qualityStats).every(s => s.count === 0) && (
                <span className="text-muted-foreground text-xs">无可回收装备</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** 装备栏网格，供角色面板使用 */
export function EquipmentGrid({
  equipment,
  onUnequip,
}: {
  equipment: Record<string, GameItem | null>
  onUnequip: (slot: EquipmentSlot) => void
}) {
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null)

  // 获取当前选中的装备
  const selectedItem = selectedSlot ? equipment[selectedSlot] : null

  const handleUnequip = () => {
    if (selectedSlot) {
      onUnequip(selectedSlot)
      setSelectedSlot(null)
    }
  }

  return (
    <>
      <div className="mx-auto grid w-[280px] max-w-full grid-cols-3 gap-x-4 gap-y-3 sm:w-[320px] sm:gap-x-5 sm:gap-y-4">
        <div className="h-12 w-12 shrink-0" aria-hidden />
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="helmet"
            item={equipment.helmet}
            onClick={() => equipment.helmet && setSelectedSlot('helmet')}
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="amulet"
            item={equipment.amulet}
            onClick={() => equipment.amulet && setSelectedSlot('amulet')}
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="weapon"
            item={equipment.weapon}
            onClick={() => equipment.weapon && setSelectedSlot('weapon')}
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="armor"
            item={equipment.armor}
            onClick={() => equipment.armor && setSelectedSlot('armor')}
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="gloves"
            item={equipment.gloves}
            onClick={() => equipment.gloves && setSelectedSlot('gloves')}
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="ring1"
            item={equipment.ring1}
            onClick={() => equipment.ring1 && setSelectedSlot('ring1')}
            label="戒指1"
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="belt"
            item={equipment.belt}
            onClick={() => equipment.belt && setSelectedSlot('belt')}
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="ring2"
            item={equipment.ring2}
            onClick={() => equipment.ring2 && setSelectedSlot('ring2')}
            label="戒指2"
          />
        </div>
        <div className="h-12 w-12 shrink-0" aria-hidden />
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="boots"
            item={equipment.boots}
            onClick={() => equipment.boots && setSelectedSlot('boots')}
          />
        </div>
        <div className="h-12 w-12 shrink-0" aria-hidden />
      </div>

      {/* 装备详情弹出框 - 使用固定定位 */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="bg-card border-border max-w-[85vw] rounded-lg border shadow-xl"
            onClick={e => e.stopPropagation()}
            style={{ width: '320px' }}
          >
            <div className="flex flex-col">
              {/* 头部：图片在左，属性在右 */}
              <div
                className="relative flex gap-3 p-3"
                style={{
                  background: `linear-gradient(135deg, ${QUALITY_COLORS[selectedItem.quality]}20 0%, ${QUALITY_COLORS[selectedItem.quality]}10 100%)`,
                  borderBottom: `1px solid ${QUALITY_COLORS[selectedItem.quality]}30`,
                }}
              >
                {/* 物品图片 */}
                <ItemTipIcon item={selectedItem} className="shrink-0 drop-shadow-lg" />
                {/* 物品名称和属性 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5
                        className="min-w-0 text-sm leading-tight font-bold break-words sm:text-base"
                        style={{ color: QUALITY_COLORS[selectedItem.quality] }}
                      >
                        {getItemDisplayName(selectedItem)}
                      </h5>
                      <span
                        className="text-xs"
                        style={{ color: QUALITY_COLORS[selectedItem.quality] }}
                      >
                        {QUALITY_NAMES[selectedItem.quality]}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedSlot(null)}
                      className="text-muted-foreground hover:text-foreground ml-1 shrink-0 p-1"
                    >
                      ✕
                    </button>
                  </div>
                  {/* 属性信息 */}
                  <div className="mt-1 space-y-0.5 text-xs">
                    {Object.entries(selectedItem.stats || {}).map(([stat, value]) => (
                      <p key={stat} className="text-green-600 dark:text-green-400">
                        +{value} {STAT_NAMES[stat] || stat}
                      </p>
                    ))}
                    {selectedItem.affixes?.map((affix, i) => (
                      <p key={i} className="text-blue-600 dark:text-blue-400">
                        {Object.entries(affix)
                          .map(([k, v]) => `+${v} ${STAT_NAMES[k] || k}`)
                          .join(', ')}
                      </p>
                    ))}
                    <p className="text-muted-foreground">
                      需求等级: {selectedItem.definition?.required_level ?? '—'}
                    </p>
                    {selectedItem.sell_price != null && selectedItem.sell_price > 0 && (
                      <p className="text-yellow-600 dark:text-yellow-400">
                        卖出: <CopperDisplay copper={selectedItem.sell_price} size="xs" nowrap />
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* 操作按钮 */}
              <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 border-t p-2.5">
                <button
                  onClick={handleUnequip}
                  className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                >
                  卸下
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function EquipmentSlotComponent({
  slot,
  item,
  onClick,
  label,
}: {
  slot: EquipmentSlot
  item: GameItem | null | undefined
  onClick: () => void
  label?: string
}) {
  const borderColor = item ? QUALITY_COLORS[item.quality] : undefined

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
      title={item ? getItemDisplayName(item) : label || SLOT_NAMES[slot]}
    >
      {item ? (
        <ItemIcon item={item} className="drop-shadow-sm" />
      ) : (
        <span className="text-muted-foreground text-xs">{label || SLOT_NAMES[slot]}</span>
      )}
    </button>
  )
}

function EmptySlot() {
  return (
    <div
      className="border-border bg-card flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 border-dashed"
      aria-hidden
    />
  )
}

/** 装备对比面板 - 显示在tip的左边 */
function EquipmentComparePanel({
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

  return (
    <div className="border-border bg-muted/20 flex w-[100px] shrink-0 flex-col border-r">
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
        {/* 已装备物品图标 */}
        <div className="mb-1 flex justify-center">
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded border-2"
            style={{ borderColor: QUALITY_COLORS[equippedItem.quality] }}
          >
            <ItemIcon item={equippedItem} className="drop-shadow-sm" />
          </div>
        </div>
        {/* 已装备物品名称 */}
        <div className="mb-1 text-center">
          <span
            className="text-sm font-bold"
            style={{ color: QUALITY_COLORS[equippedItem.quality] }}
          >
            {getItemDisplayName(equippedItem)}
          </span>
        </div>
        {/* 对比属性 - 只显示不同的属性 */}
        <div className="space-y-1 text-xs">
          {allStatKeys
            .filter(stat => {
              const newValue = newStats[stat] || 0
              const equippedValue = equippedStats[stat] || 0
              return newValue !== equippedValue
            })
            .map(stat => {
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
        {/* 当前装备价格 */}
        {equippedItem.sell_price != null && equippedItem.sell_price > 0 && (
          <div className="mt-1 text-center text-xs text-yellow-600 dark:text-yellow-400">
            卖出: <CopperDisplay copper={equippedItem.sell_price} size="xs" nowrap />
          </div>
        )}
      </div>
    </div>
  )
}
