'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import Image from 'next/image'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGameStore } from '../stores/gameStore'
import { CopperDisplay } from './CopperDisplay'
import {
  GameItem,
  QUALITY_COLORS,
  QUALITY_NAMES,
  SLOT_NAMES,
  EquipmentSlot,
  STAT_NAMES,
} from '../types'
import {
  getItemIconFallback,
  getItemDisplayName,
  isEquippable,
  isPotion,
  stackItems,
  itemMatchesCategory,
} from '../utils/itemUtils'

// 背包固定格位数（与后端 InventoryController::INVENTORY_SIZE 一致）
const INVENTORY_SLOTS = 100
/** 仓库固定格位数（与后端 InventoryController::STORAGE_SIZE 一致） */
const WAREHOUSE_SLOTS = 100

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

export function InventoryPanel() {
  const { inventory, storage, equipItem, sellItem, moveItem, consumePotion, isLoading } =
    useGameStore()
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
  const [showStorage, setShowStorage] = useState(false)
  const [categoryId, setCategoryId] = useState<string>('')

  // 背包按 slot_index 放入对应格位，与后端格位一致
  const inventorySlots = useMemo(() => {
    const slots: (GameItem | null)[] = Array.from({ length: INVENTORY_SLOTS }, () => null)
    inventory.forEach(item => {
      const idx = item.slot_index
      if (typeof idx === 'number' && idx >= 0 && idx < INVENTORY_SLOTS) slots[idx] = item
    })
    return slots
  }, [inventory])
  // 仓库按 slot_index 放入对应格位
  const warehouseSlots = useMemo(() => {
    const slots: (GameItem | null)[] = Array.from({ length: WAREHOUSE_SLOTS }, () => null)
    storage.forEach(item => {
      const idx = item.slot_index
      if (typeof idx === 'number' && idx >= 0 && idx < WAREHOUSE_SLOTS) slots[idx] = item
    })
    return slots
  }, [storage])

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
    await sellItem(selectedItem.id)
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
              {inventory.length}/{INVENTORY_SLOTS}
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
              {storage.length}/{WAREHOUSE_SLOTS}
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
                    <button
                      onClick={() =>
                        setSelectedItem(prev => (prev?.id === cell.item?.id ? null : cell.item))
                      }
                      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 text-lg shadow-sm transition-all hover:shadow-md ${
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
                      <ItemIcon item={cell.item} className="drop-shadow-sm" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-48 max-w-[85vw] p-2.5 sm:w-56 sm:p-3"
                    side="right"
                    align="center"
                    sideOffset={8}
                    collisionPadding={8}
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h5
                          className="min-w-0 shrink text-sm leading-tight font-bold break-words sm:text-base"
                          style={{ color: QUALITY_COLORS[cell.item.quality] }}
                        >
                          {getItemDisplayName(cell.item)}
                        </h5>
                        <span className="text-muted-foreground shrink-0 text-xs sm:text-sm">
                          {QUALITY_NAMES[cell.item.quality]}
                        </span>
                      </div>
                      <div className="min-w-0 space-y-0.5 text-xs sm:text-sm">
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
                        {cell.item.sell_price != null && cell.item.sell_price > 0 && (
                          <p className="text-yellow-600 dark:text-yellow-400">
                            卖出: <CopperDisplay copper={cell.item.sell_price} size="xs" nowrap />
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {cell.source === 'inventory' && cell.item.definition?.type === 'potion' && (
                          <button
                            onClick={handleUsePotion}
                            disabled={isLoading}
                            className="rounded bg-violet-600 px-2.5 py-1.5 text-xs text-white hover:bg-violet-700 disabled:opacity-50"
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
                              className="rounded bg-green-600 px-2.5 py-1.5 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              装备
                            </button>
                          )}
                        <button
                          onClick={() => handleMove(cell.source === 'inventory')}
                          disabled={isLoading}
                          className="rounded bg-blue-600 px-2.5 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {cell.source === 'storage' ? '取' : '存'}
                        </button>
                        {cell.source === 'inventory' && (
                          <button
                            onClick={handleSell}
                            disabled={isLoading}
                            className="rounded bg-red-600 px-2.5 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            出售
                          </button>
                        )}
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
  return (
    <div className="mx-auto grid w-[280px] max-w-full grid-cols-3 gap-x-4 gap-y-3 sm:w-[320px] sm:gap-x-5 sm:gap-y-4">
      <div className="h-12 w-12 shrink-0" aria-hidden />
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="helmet"
          item={equipment.helmet}
          onClick={() => equipment.helmet && onUnequip('helmet')}
        />
      </div>
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="amulet"
          item={equipment.amulet}
          onClick={() => equipment.amulet && onUnequip('amulet')}
        />
      </div>
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="weapon"
          item={equipment.weapon}
          onClick={() => equipment.weapon && onUnequip('weapon')}
        />
      </div>
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="armor"
          item={equipment.armor}
          onClick={() => equipment.armor && onUnequip('armor')}
        />
      </div>
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="gloves"
          item={equipment.gloves}
          onClick={() => equipment.gloves && onUnequip('gloves')}
        />
      </div>
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="ring1"
          item={equipment.ring1}
          onClick={() => equipment.ring1 && onUnequip('ring1')}
          label="戒指1"
        />
      </div>
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="belt"
          item={equipment.belt}
          onClick={() => equipment.belt && onUnequip('belt')}
        />
      </div>
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="ring2"
          item={equipment.ring2}
          onClick={() => equipment.ring2 && onUnequip('ring2')}
          label="戒指2"
        />
      </div>
      <div className="h-12 w-12 shrink-0" aria-hidden />
      <div className="flex justify-center">
        <EquipmentSlotComponent
          slot="boots"
          item={equipment.boots}
          onClick={() => equipment.boots && onUnequip('boots')}
        />
      </div>
      <div className="h-12 w-12 shrink-0" aria-hidden />
    </div>
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
  return (
    <button
      onClick={onClick}
      disabled={!item}
      className={`relative flex h-12 w-12 items-center justify-center rounded border-2 text-xl shadow-sm transition-all ${
        item
          ? 'border-border bg-secondary hover:border-primary cursor-pointer hover:shadow-md'
          : 'border-border bg-card cursor-default border-dashed'
      }`}
      title={item ? `${getItemDisplayName(item)} (点击卸下)` : label || SLOT_NAMES[slot]}
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
