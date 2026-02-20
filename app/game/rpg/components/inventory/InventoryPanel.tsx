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
import { ItemIcon, ItemTipIcon, ItemDetailContent, FullComparePanel } from '@/components/game'

// 背包分类 tabs：emoji + 对应物品 type（不显示「全部」按钮，再次点击当前分类即取消选择 = 显示全部）
const INVENTORY_CATEGORIES = [
  { id: 'weapon', emoji: '⚔️', label: '武器', types: ['weapon'] },
  { id: 'armor', emoji: '🛡️', label: '防具', types: ['helmet', 'armor', 'belt'] },
  { id: 'gloves', emoji: '🧤', label: '手套', types: ['gloves'] },
  { id: 'boots', emoji: '👢', label: '靴子', types: ['boots'] },
  { id: 'accessory', emoji: '💍', label: '饰品', types: ['ring', 'amulet'] },
  { id: 'potion', emoji: '🧪', label: '药水', types: ['potion'] },
  { id: 'gem', emoji: '💎', label: '宝石', types: ['gem'] },
] as const

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
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
  const [showStorage, setShowStorage] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')
  const [sellQuantity, setSellQuantity] = useState<number>(1)
  const [showSellConfirm, setShowSellConfirm] = useState(false)
  const [showGemSelector, setShowGemSelector] = useState(false)
  const [selectedSocketItem, setSelectedSocketItem] = useState<GameItem | null>(null)

  // 品质回收相关状态
  const [recyclingQuality, setRecyclingQuality] = useState<string | null>(null)
  const [sortOpen, setSortOpen] = useState(false)

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

  // 获取背包中的宝石
  const gemsInInventory = useMemo(() => {
    return inventory.filter(item => item.definition?.type === 'gem')
  }, [inventory])

  // 判断装备是否可以镶嵌（有空插槽）
  const canSocket = (item: GameItem): boolean => {
    if (!item.sockets || item.sockets <= 0) return false
    const gemCount = item.gems?.length ?? 0
    return gemCount < item.sockets
  }

  // 判断装备是否可以取下宝石（普通装备）
  const canUnsocket = (item: GameItem): boolean => {
    if (item.quality !== 'common') return false
    return !!(item.gems && item.gems.length > 0)
  }

  // 打开宝石选择弹窗
  const handleOpenGemSelector = (item: GameItem) => {
    setSelectedSocketItem(item)
    setShowGemSelector(true)
  }

  // 执行镶嵌
  const handleSocketGem = async (gemItem: GameItem, socketIndex: number) => {
    if (!selectedSocketItem) return
    await socketGem(selectedSocketItem.id, gemItem.id, socketIndex)
    setShowGemSelector(false)
    setSelectedSocketItem(null)
    setSelectedItem(null)
  }

  // 执行取下宝石
  const handleUnsocketGem = async (socketIndex: number) => {
    if (!selectedItem) return
    await unsocketGem(selectedItem.id, socketIndex)
    setSelectedItem(null)
  }

  // 判断物品是否有对应的已装备物品
  const hasEquippedItem = (item: GameItem): boolean => {
    const slot = getEquipmentSlot(item)
    if (!slot) return false
    // 戒指特殊处理：检查 ring
    if (slot === 'ring') {
      return !!equipment.ring
    }
    return !!equipment[slot]
  }

  // 获取已装备的物品
  const getEquippedItem = (item: GameItem): GameItem | null => {
    const slot = getEquipmentSlot(item)
    if (!slot) return null
    // 戒指特殊处理：返回 ring
    if (slot === 'ring') {
      return equipment.ring
    }
    return equipment[slot] ?? null
  }

  // 获取所有已装备的戒指
  const getEquippedRings = (): GameItem[] => {
    const rings: GameItem[] = []
    if (equipment.ring) rings.push(equipment.ring)
    return rings
  }

  // 宝石选择弹窗
  if (showGemSelector && selectedSocketItem) {
    const availableSocketCount =
      (selectedSocketItem.sockets ?? 0) - (selectedSocketItem.gems?.length ?? 0)

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
          <h4 className="text-foreground mb-3 text-base font-bold sm:mb-4 sm:text-lg">
            选择宝石 (还可镶嵌 {availableSocketCount} 个)
          </h4>
          {gemsInInventory.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">背包中没有宝石</p>
          ) : (
            <div className="mb-4 grid grid-cols-4 gap-2">
              {gemsInInventory.map(gem => {
                const usedIndices = new Set(selectedSocketItem.gems?.map(g => g.socket_index) ?? [])
                let emptyIndex = -1
                for (let i = 0; i < (selectedSocketItem.sockets ?? 0); i++) {
                  if (!usedIndices.has(i)) {
                    emptyIndex = i
                    break
                  }
                }
                return (
                  <button
                    key={gem.id}
                    onClick={() => {
                      if (emptyIndex >= 0) {
                        handleSocketGem(gem, emptyIndex)
                      }
                    }}
                    disabled={availableSocketCount <= 0}
                    className="bg-muted hover:bg-muted/80 flex aspect-square flex-col items-center justify-center rounded border p-1 disabled:opacity-50"
                    title={gem.definition?.description ?? gem.definition?.name}
                  >
                    <span className="text-lg">💎</span>
                    <span className="text-[10px]">{gem.definition?.name}</span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowGemSelector(false)
                setSelectedSocketItem(null)
              }}
              className="bg-muted text-foreground hover:bg-secondary rounded px-3 py-2 text-sm sm:px-4"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
        {/* 背包/仓库 - 装备栏已移至角色面板 */}
        <div className="bg-card border-border flex min-w-0 flex-1 flex-col rounded-lg border p-3 sm:p-4">
          <div className="mb-3 flex shrink-0 flex-wrap items-center gap-1.5 sm:mb-4 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowStorage(false)}
              className={`flex flex-col items-center rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
                !showStorage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
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
                showStorage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span>仓库</span>
              <span className="text-[10px] opacity-90 sm:text-xs">
                {storage.length}/{storageSize}
              </span>
            </button>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={`rounded px-2 py-1.5 text-sm transition-colors ${
                      categoryId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    title="筛选"
                  >
                    <span>筛选</span>
                    {categoryId && (
                      <span className="ml-1 text-xs">
                        {INVENTORY_CATEGORIES.find(c => c.id === categoryId)?.emoji}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end">
                  <button
                    type="button"
                    onClick={() => setCategoryId('')}
                    className={`hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${
                      !categoryId ? 'bg-muted font-medium' : ''
                    }`}
                  >
                    全部
                  </button>
                  {INVENTORY_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm ${
                        categoryId === cat.id ? 'bg-muted font-medium' : ''
                      }`}
                    >
                      <span className="mr-2">{cat.emoji}</span>
                      {cat.label}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              {/* 批量回收 - 仅背包显示 */}
              {!showStorage && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1 rounded px-2 py-1.5 text-sm transition-colors"
                      title="回收"
                    >
                      <span>回收</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 space-y-1 p-2" align="end">
                    {['common', 'magic', 'rare', 'legendary', 'mythic'].map(quality => {
                      const stats = qualityStats[quality] || { count: 0, totalPrice: 0 }
                      const isDisabled = stats.count === 0

                      return (
                        <button
                          key={quality}
                          type="button"
                          onClick={() => handleRecycleQuality(quality)}
                          disabled={isLoading || recyclingQuality === quality || isDisabled}
                          className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{
                            backgroundColor: `${QUALITY_COLORS[quality as ItemQuality]}${isDisabled ? '10' : '20'}`,
                            color: isDisabled
                              ? `${QUALITY_COLORS[quality as ItemQuality]}60`
                              : QUALITY_COLORS[quality as ItemQuality],
                          }}
                        >
                          <span>
                            {QUALITY_NAMES[quality as ItemQuality]}
                            <span className="ml-1 text-xs opacity-70">×{stats.count}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <CopperDisplay copper={stats.totalPrice} size="xs" />
                            {recyclingQuality === quality && (
                              <span className="animate-spin">⏳</span>
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </PopoverContent>
                </Popover>
              )}
              <Popover open={sortOpen} onOpenChange={setSortOpen}>
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
                    onClick={() => {
                      sortInventory('default')
                      setSortOpen(false)
                    }}
                    className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm"
                  >
                    默认
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sortInventory('quality')
                      setSortOpen(false)
                    }}
                    className="hover:bg-muted flex w-full items-center rounded px-2 py-1.5 text-left text-sm"
                  >
                    品质
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sortInventory('price')
                      setSortOpen(false)
                    }}
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
                        className={`relative flex h-14 w-12 shrink-0 flex-col items-center rounded border-2 shadow-sm transition-all hover:shadow-md ${
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
                          className="relative flex h-10 w-full items-center justify-center text-lg"
                        >
                          <ItemIcon item={cell.item} className="drop-shadow-sm" />
                          {/* 数量显示 */}
                          {cell.item.quantity > 1 && (
                            <span className="absolute top-0 -right-1 z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/70 text-[9px] font-bold text-white">
                              {cell.item.quantity}
                            </span>
                          )}
                          {/* 凹槽圆形显示在右上角 */}
                          {cell.item?.sockets != null && cell.item?.sockets > 0 && cell.item && (
                            <div className="absolute -top-1 -right-1 z-10 flex -space-x-1">
                              {Array.from({ length: cell.item.sockets }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/50 text-[6px] font-medium ${
                                    cell.item?.gems && idx < (cell.item?.gems?.length ?? 0)
                                      ? 'bg-cyan-500 text-white'
                                      : 'bg-gray-600 text-gray-300'
                                  }`}
                                >
                                  {cell.item?.gems && idx < (cell.item?.gems?.length ?? 0)
                                    ? '💎'
                                    : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                        {/* 价格显示 */}
                        <div className="absolute -bottom-0.5 flex w-full items-center justify-center">
                          <span className="rounded bg-black/70 px-1 text-[9px] font-medium text-yellow-400">
                            {(cell.item.sell_price ??
                              Math.floor((cell.item.definition?.buy_price ?? 0) / 2)) *
                              (cell.item.quantity ?? 1)}
                          </span>
                        </div>
                      </div>
                    </PopoverTrigger>
                    <PopoverContent
                      className={`${
                        isEquippable(cell.item) &&
                        cell.source === 'inventory' &&
                        hasEquippedItem(cell.item)
                          ? cell.item.definition?.type === 'ring' && getEquippedRings().length === 2
                            ? 'w-[840px]'
                            : 'w-[420px]'
                          : 'w-[280px]'
                      } max-w-[95vw] p-0`}
                      side="bottom"
                      align="center"
                      sideOffset={8}
                      collisionPadding={12}
                    >
                      <div className="flex flex-col">
                        {/* 对比面板 - 有对比时显示 */}
                        {isEquippable(cell.item) &&
                          cell.source === 'inventory' &&
                          hasEquippedItem(cell.item) && (
                            <>
                              {/* 戒指特殊处理：装备了两个戒指时，显示两个对比面板 */}
                              {cell.item.definition?.type === 'ring' &&
                                getEquippedRings().length === 2 &&
                                getEquippedRings().map(equippedRing => {
                                  const compareActions: (
                                    | 'equip'
                                    | 'store'
                                    | 'sell'
                                    | 'socket'
                                    | 'unsocket'
                                  )[] = ['equip', 'store', 'sell']
                                  if (cell.item && canSocket(cell.item))
                                    compareActions.push('socket')
                                  if (cell.item && canUnsocket(cell.item))
                                    compareActions.push('unsocket')
                                  return (
                                    <FullComparePanel
                                      key={equippedRing.id}
                                      newItem={cell.item!}
                                      equippedItem={equippedRing}
                                      actions={compareActions}
                                      onAction={action => {
                                        if (action === 'equip') handleEquip()
                                        else if (action === 'store') handleMove(true)
                                        else if (action === 'sell') handleSell()
                                        else if (action === 'socket' && cell.item)
                                          handleOpenGemSelector(cell.item)
                                        else if (action === 'unsocket') handleUnsocketGem(0)
                                      }}
                                    />
                                  )
                                })}
                              {/* 非戒指物品或只有一个戒指时，显示一个对比面板 */}
                              {(cell.item.definition?.type !== 'ring' ||
                                getEquippedRings().length !== 2) &&
                                (() => {
                                  const compareActions: (
                                    | 'equip'
                                    | 'store'
                                    | 'sell'
                                    | 'socket'
                                    | 'unsocket'
                                  )[] = ['equip', 'store', 'sell']
                                  if (cell.item && canSocket(cell.item))
                                    compareActions.push('socket')
                                  if (cell.item && canUnsocket(cell.item))
                                    compareActions.push('unsocket')
                                  return (
                                    <FullComparePanel
                                      newItem={cell.item}
                                      equippedItem={getEquippedItem(cell.item)!}
                                      actions={compareActions}
                                      onAction={action => {
                                        if (action === 'equip') handleEquip()
                                        else if (action === 'store') handleMove(true)
                                        else if (action === 'sell') handleSell()
                                        else if (action === 'socket' && cell.item)
                                          handleOpenGemSelector(cell.item)
                                        else if (action === 'unsocket') handleUnsocketGem(0)
                                      }}
                                    />
                                  )
                                })()}
                            </>
                          )}
                        {/* 物品详情 - 无对比时 */}
                        {!hasEquippedItem(cell.item) && (
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
                                    {/* 宝石和凹槽显示 */}
                                    {(cell.item.gems?.length ?? 0) > 0 ||
                                    (cell.item.sockets != null && cell.item.sockets > 0) ? (
                                      <div className="mt-1 flex flex-wrap items-center gap-1">
                                        {/* 已镶嵌的宝石名称 - 点击可取下 */}
                                        {cell.item.gems?.map((gem, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() => handleUnsocketGem(gem.socket_index)}
                                            disabled={isLoading}
                                            className="text-cyan-600 hover:underline disabled:opacity-50 dark:text-cyan-400"
                                          >
                                            💎 {gem.gemDefinition?.name || '宝石'}
                                          </button>
                                        ))}
                                        {/* 凹槽圆形显示（未镶嵌的凹槽） */}
                                        {cell.item?.sockets != null &&
                                          cell.item?.sockets > 0 &&
                                          cell.item && (
                                            <div className="flex -space-x-1">
                                              {Array.from({ length: cell.item.sockets }).map(
                                                (_, idx) => (
                                                  <span
                                                    key={idx}
                                                    className={`flex h-4 w-4 items-center justify-center rounded-full border text-[6px] ${
                                                      cell.item?.gems &&
                                                      idx < (cell.item?.gems?.length ?? 0)
                                                        ? 'border-cyan-400 bg-cyan-500 text-white'
                                                        : 'border-gray-500 bg-gray-700 text-gray-400'
                                                    }`}
                                                  >
                                                    {cell.item?.gems &&
                                                    idx < (cell.item?.gems?.length ?? 0)
                                                      ? '💎'
                                                      : ''}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    ) : null}
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
                                  <p className="text-yellow-600 dark:text-yellow-400">
                                    卖出:{' '}
                                    <CopperDisplay
                                      copper={
                                        cell.item.sell_price ??
                                        Math.floor((cell.item.definition?.buy_price ?? 0) / 2)
                                      }
                                      size="xs"
                                      nowrap
                                    />
                                  </p>
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
                              {/* 镶嵌按钮 - 背包中的装备有凹槽且未满 */}
                              {cell.source === 'inventory' &&
                                cell.item.sockets != null &&
                                cell.item.sockets > 0 &&
                                cell.item &&
                                canSocket(cell.item) && (
                                  <button
                                    onClick={() => cell.item && handleOpenGemSelector(cell.item)}
                                    disabled={isLoading || gemsInInventory.length === 0}
                                    className="rounded bg-cyan-600 px-3 py-1.5 text-xs text-white hover:bg-cyan-700 disabled:opacity-50"
                                  >
                                    镶嵌
                                  </button>
                                )}
                              {/* 取下按钮 - 背包中的普通装备有宝石 */}
                              {cell.source === 'inventory' &&
                                cell.item &&
                                canUnsocket(cell.item) && (
                                  <button
                                    onClick={() => handleUnsocketGem(0)}
                                    disabled={isLoading}
                                    className="rounded bg-orange-600 px-3 py-1.5 text-xs text-white hover:bg-orange-700 disabled:opacity-50"
                                  >
                                    取下
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
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <EmptySlot key={`empty-${index}`} />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </>
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
  const { socketGem, unsocketGem, inventory, isLoading } = useGameStore()
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null)
  const [showGemSelector, setShowGemSelector] = useState(false)
  const [selectedSocketItem, setSelectedSocketItem] = useState<GameItem | null>(null)

  // 获取当前选中的装备
  const selectedItem = selectedSlot ? equipment[selectedSlot] : null

  // 获取背包中的宝石
  const gemsInInventory = useMemo(() => {
    return inventory.filter(item => item.definition?.type === 'gem')
  }, [inventory])

  // 判断装备是否可以镶嵌（有空插槽）
  const canSocket = (item: GameItem): boolean => {
    if (!item.sockets || item.sockets <= 0) return false
    const gemCount = item.gems?.length ?? 0
    return gemCount < item.sockets
  }

  // 判断装备是否可以取下宝石
  const canUnsocket = (item: GameItem): boolean => {
    return !!(item.gems && item.gems.length > 0)
  }

  // 打开宝石选择弹窗
  const handleOpenGemSelector = (item: GameItem) => {
    setSelectedSocketItem(item)
    setShowGemSelector(true)
  }

  // 执行镶嵌
  const handleSocketGem = async (gemItem: GameItem, socketIndex: number) => {
    if (!selectedSocketItem) return
    await socketGem(selectedSocketItem.id, gemItem.id, socketIndex)
    setShowGemSelector(false)
    setSelectedSocketItem(null)
    setSelectedSlot(null)
  }

  // 执行取下宝石
  const handleUnsocketGem = async (socketIndex: number) => {
    if (!selectedItem) return
    await unsocketGem(selectedItem.id, socketIndex)
    setSelectedSlot(null)
  }

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
        <div className="h-12 w-12 shrink-0" aria-hidden />
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="belt"
            item={equipment.belt}
            onClick={() => equipment.belt && setSelectedSlot('belt')}
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="ring"
            item={equipment.ring}
            onClick={() => equipment.ring && setSelectedSlot('ring')}
            label="戒指"
          />
        </div>
        <div className="flex justify-center">
          <EquipmentSlotComponent
            slot="amulet"
            item={equipment.amulet}
            onClick={() => equipment.amulet && setSelectedSlot('amulet')}
            label="护符"
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
      </div>

      {/* 物品详情弹出框 - 使用固定定位 */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
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
                      {/* 宝石和凹槽显示 */}
                      {(selectedItem.gems?.length ?? 0) > 0 ||
                      (selectedItem.sockets != null && selectedItem.sockets > 0) ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {/* 已镶嵌的宝石名称 - 点击可取下 */}
                          {selectedItem.gems?.map((gem, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleUnsocketGem(gem.socket_index)}
                              disabled={isLoading}
                              className="text-cyan-600 hover:underline disabled:opacity-50 dark:text-cyan-400"
                            >
                              💎 {gem.gemDefinition?.name || '宝石'}
                            </button>
                          ))}
                          {/* 凹槽圆形显示（未镶嵌的凹槽） */}
                          {selectedItem.sockets != null && selectedItem.sockets > 0 && (
                            <div className="flex -space-x-1">
                              {Array.from({ length: selectedItem.sockets }).map((_, idx) => (
                                <span
                                  key={idx}
                                  className={`flex h-4 w-4 items-center justify-center rounded-full border text-[6px] ${
                                    selectedItem.gems && idx < selectedItem.gems.length
                                      ? 'border-cyan-400 bg-cyan-500 text-white'
                                      : 'border-gray-500 bg-gray-700 text-gray-400'
                                  }`}
                                >
                                  {selectedItem.gems && idx < selectedItem.gems.length ? '💎' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null}
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
                    <p className="text-yellow-600 dark:text-yellow-400">
                      卖出:{' '}
                      <CopperDisplay
                        copper={
                          selectedItem.sell_price ??
                          Math.floor((selectedItem.definition?.buy_price ?? 0) / 2)
                        }
                        size="xs"
                        nowrap
                      />
                    </p>
                  </div>
                </div>
              </div>
              {/* 操作按钮 */}
              <div className="border-border bg-muted/30 flex flex-wrap gap-1.5 border-t p-2.5">
                <button
                  onClick={handleUnequip}
                  disabled={isLoading}
                  className="rounded bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                >
                  卸下
                </button>
                {/* 镶嵌按钮 - 装备有凹槽且未满 */}
                {selectedItem &&
                  selectedItem.sockets != null &&
                  selectedItem.sockets > 0 &&
                  canSocket(selectedItem) && (
                    <button
                      onClick={() => handleOpenGemSelector(selectedItem)}
                      disabled={isLoading || gemsInInventory.length === 0}
                      className="rounded bg-cyan-600 px-3 py-1.5 text-xs text-white hover:bg-cyan-700 disabled:opacity-50"
                    >
                      镶嵌
                    </button>
                  )}
                {/* 取下按钮 - 装备有宝石 */}
                {selectedItem && canUnsocket(selectedItem) && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        disabled={isLoading}
                        className="rounded bg-orange-600 px-3 py-1.5 text-xs text-white hover:bg-orange-700 disabled:opacity-50"
                      >
                        取下 ▾
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-32 p-1" align="start">
                      {selectedItem.gems?.map((gem, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleUnsocketGem(gem.socket_index)}
                          disabled={isLoading}
                          className="hover:bg-muted flex w-full items-center gap-1 rounded px-2 py-1.5 text-left text-sm disabled:opacity-50"
                        >
                          <span>💎</span>
                          <span>{gem.gemDefinition?.name || '宝石'}</span>
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                )}
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
        <>
          <ItemIcon item={item} className="drop-shadow-sm" />
          {/* 凹槽圆形显示 */}
          {item.sockets != null && item.sockets > 0 && (
            <div className="absolute -top-1 -right-1 z-10 flex -space-x-1">
              {Array.from({ length: item.sockets }).map((_, idx) => (
                <span
                  key={idx}
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/50 text-[6px] font-medium ${
                    item.gems && idx < item.gems.length
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {item.gems && idx < item.gems.length ? '💎' : ''}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <span className="text-muted-foreground text-xs">{label || SLOT_NAMES[slot]}</span>
      )}
    </button>
  )
}

function EmptySlot() {
  return (
    <div
      className="border-border bg-card flex h-14 w-12 shrink-0 items-center justify-center rounded border-2 border-dashed"
      aria-hidden
    />
  )
}
