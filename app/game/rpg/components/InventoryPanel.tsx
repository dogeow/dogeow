'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import {
  GameItem,
  QUALITY_COLORS,
  QUALITY_NAMES,
  SLOT_NAMES,
  EquipmentSlot,
  STAT_NAMES,
} from '../types'

// 物品类型图标映射
const ITEM_ICONS: Record<string, string> = {
  weapon: '⚔️',
  helmet: '🪖',
  armor: '👕', // 衣服/盔甲
  gloves: '🧤',
  boots: '👢',
  belt: '🥋',
  ring: '💍',
  amulet: '📿',
  potion: '🧪',
  gem: '💎',
}

/** 背包固定格位数（表格形式展示） */
const INVENTORY_SLOTS = 40
/** 仓库固定格位数（表格形式展示） */
const WAREHOUSE_SLOTS = 60

// 获取物品图标：药水按 sub_type 区分 HP❤️/MP💙，其余优先按 type 映射，否则用 definition.icon，最后默认 📦
function getItemIcon(item: GameItem): string {
  if (item.definition.type === 'potion') {
    if (item.definition.sub_type === 'hp') return '❤️'
    if (item.definition.sub_type === 'mp') return '💙'
  }
  const typeIcon = ITEM_ICONS[item.definition.type]
  if (typeIcon) return typeIcon
  if (item.definition.icon && !item.definition.icon.includes('.')) return item.definition.icon
  return '📦'
}

// 物品堆叠函数 - 相同属性的物品可以堆叠
interface StackedItem extends GameItem {
  quantity: number
}

function stackItems(items: GameItem[]): StackedItem[] {
  const stacks = new Map<string, StackedItem>()

  items.forEach(item => {
    // 生成唯一键：物品定义ID + 属性 + 词缀
    const statsKey = item.stats
      ? JSON.stringify(Object.entries(item.stats).sort(([a], [b]) => a.localeCompare(b)))
      : ''
    const affixesKey = item.affixes
      ? JSON.stringify(item.affixes.map(a => JSON.stringify(a)).sort())
      : ''
    const key = `${item.definition.id}-${statsKey}-${affixesKey}`

    const existing = stacks.get(key)
    if (existing) {
      existing.quantity++
    } else {
      stacks.set(key, { ...item, quantity: 1 })
    }
  })

  return Array.from(stacks.values())
}

export function InventoryPanel() {
  const { inventory, storage, equipment, equipItem, unequipItem, sellItem, moveItem, isLoading } =
    useGameStore()
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
  const [showStorage, setShowStorage] = useState(false)
  const [showSellConfirm, setShowSellConfirm] = useState(false)

  // 使用 useMemo 优化性能，计算堆叠后的物品（详情等仍可用）
  const stackedInventory = useMemo(() => stackItems(inventory), [inventory])
  const stackedStorage = useMemo(() => stackItems(storage), [storage])
  // 背包按固定格位展示（类似表格），空位也占格
  const inventorySlots = useMemo(
    () => Array.from({ length: INVENTORY_SLOTS }, (_, i) => inventory[i] ?? null),
    [inventory]
  )
  // 仓库按固定格位展示（类似表格），空位也占格
  const warehouseSlots = useMemo(
    () => Array.from({ length: WAREHOUSE_SLOTS }, (_, i) => storage[i] ?? null),
    [storage]
  )

  const handleEquip = async () => {
    if (!selectedItem) return
    await equipItem(selectedItem.id)
    setSelectedItem(null)
  }

  const handleUnequip = async (slot: EquipmentSlot) => {
    await unequipItem(slot)
  }

  const handleSell = async () => {
    if (!selectedItem) return
    await sellItem(selectedItem.id)
    setSelectedItem(null)
    setShowSellConfirm(false)
  }

  const handleMove = async (toStorage: boolean) => {
    if (!selectedItem) return
    await moveItem(selectedItem.id, toStorage)
    setSelectedItem(null)
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
      {/* 装备栏 - 参考经典 RPG 三列布局：左(武器/手套/靴子)、中(头盔/盔甲/腰带/护身符)、右(戒指) */}
      <div className="bg-card border-border flex shrink-0 flex-col rounded-lg border p-3 sm:p-4 lg:min-w-[360px] lg:items-center">
        <h4 className="text-foreground mb-3 text-base font-medium sm:mb-4 sm:text-lg lg:w-full">
          装备
        </h4>
        <div className="mb-3 w-full border-b-2 border-red-500/80 sm:mb-4" aria-hidden />
        {/* 4 行 x 3 列网格：左(武器/手套/靴子)、中(头盔/盔甲/腰带/护身符)、右(戒指与盔甲/腰带同行) */}
        <div className="mx-auto grid w-[280px] max-w-full grid-cols-3 gap-x-4 gap-y-3 sm:w-[320px] sm:gap-x-5 sm:gap-y-4">
          {/* 第 1 行：空、头盔、护身符 */}
          <div className="h-12 w-12 shrink-0" aria-hidden />
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="helmet"
              item={equipment.helmet}
              onClick={() => equipment.helmet && handleUnequip('helmet')}
            />
          </div>
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="amulet"
              item={equipment.amulet}
              onClick={() => equipment.amulet && handleUnequip('amulet')}
            />
          </div>

          {/* 第 2 行：武器、盔甲、戒指1（武器在盔甲左侧，同一行水平对齐） */}
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="weapon"
              item={equipment.weapon}
              onClick={() => equipment.weapon && handleUnequip('weapon')}
            />
          </div>
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="armor"
              item={equipment.armor}
              onClick={() => equipment.armor && handleUnequip('armor')}
            />
          </div>
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="gloves"
              item={equipment.gloves}
              onClick={() => equipment.gloves && handleUnequip('gloves')}
            />
          </div>

          {/* 第 3 行：戒指1、腰带、戒指2 */}
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="ring1"
              item={equipment.ring1}
              onClick={() => equipment.ring1 && handleUnequip('ring1')}
              label="戒指1"
            />
          </div>
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="belt"
              item={equipment.belt}
              onClick={() => equipment.belt && handleUnequip('belt')}
            />
          </div>
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="ring2"
              item={equipment.ring2}
              onClick={() => equipment.ring2 && handleUnequip('ring2')}
              label="戒指2"
            />
          </div>

          {/* 第 4 行：空、靴子（腰带正下方）、空 */}
          <div className="h-12 w-12 shrink-0" aria-hidden />
          <div className="flex justify-center">
            <EquipmentSlotComponent
              slot="boots"
              item={equipment.boots}
              onClick={() => equipment.boots && handleUnequip('boots')}
            />
          </div>
          <div className="h-12 w-12 shrink-0" aria-hidden />
        </div>
      </div>

      {/* 背包/仓库 - 边距与角色面板一致 */}
      <div className="bg-card border-border flex min-w-0 flex-1 flex-col rounded-lg border p-3 sm:p-4">
        <div className="mb-3 flex shrink-0 items-center justify-between sm:mb-4">
          <h4 className="text-foreground text-base font-medium sm:text-lg">
            {showStorage ? '仓库' : '背包'}
            <span className="text-muted-foreground ml-2 text-sm">
              ({showStorage ? storage.length : inventory.length}
              {showStorage ? `/${WAREHOUSE_SLOTS}` : `/${INVENTORY_SLOTS}`})
            </span>
          </h4>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowStorage(false)}
              className={`rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
                !showStorage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              背包
            </button>
            <button
              onClick={() => setShowStorage(true)}
              className={`rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
                showStorage
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              仓库
            </button>
          </div>
        </div>

        <div className="mx-auto min-h-0 flex-1 overflow-auto p-1">
          <div className="flex w-[17.5rem] flex-wrap gap-x-2 gap-y-2 sm:w-[23.5rem]">
            {(showStorage ? warehouseSlots : inventorySlots).map((item, index) =>
              item ? (
                <ItemSlot
                  key={item.id}
                  item={item}
                  quantity={1}
                  selected={selectedItem?.id === item.id}
                  onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                />
              ) : (
                <EmptySlot key={`empty-${index}`} />
              )
            )}
          </div>
        </div>

        {/* 选中物品详情 */}
        {selectedItem && (
          <div className="bg-muted/50 border-border mt-3 rounded-lg border p-3 sm:mt-4 sm:p-4">
            <div className="mb-2 flex items-start justify-between">
              <h5
                className="text-sm font-bold sm:text-base"
                style={{ color: QUALITY_COLORS[selectedItem.quality] }}
              >
                {selectedItem.definition.name}
              </h5>
              <span className="text-muted-foreground text-xs sm:text-sm">
                {QUALITY_NAMES[selectedItem.quality]}
              </span>
            </div>

            <div className="mb-3 space-y-1 text-xs sm:mb-4 sm:text-sm">
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
                需求等级: {selectedItem.definition.required_level}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {!showStorage && selectedItem.definition.type !== 'potion' && (
                <button
                  onClick={handleEquip}
                  disabled={isLoading}
                  className="flex-1 rounded bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm"
                >
                  装备
                </button>
              )}
              <button
                onClick={() => handleMove(!showStorage)}
                disabled={isLoading}
                className="flex-1 rounded bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700 disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm"
              >
                {showStorage ? '放入背包' : '存入仓库'}
              </button>
              {!showStorage && (
                <button
                  onClick={() => setShowSellConfirm(true)}
                  disabled={isLoading}
                  className="flex-1 rounded bg-red-600 px-3 py-2 text-xs text-white hover:bg-red-700 disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm"
                >
                  出售
                </button>
              )}
            </div>
          </div>
        )}

        {/* 出售确认 - 移动端优化 */}
        {showSellConfirm && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
              <h4 className="text-foreground mb-3 text-base font-bold sm:mb-4 sm:text-lg">
                确认出售
              </h4>
              <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                确定要出售
                <span className="mx-1" style={{ color: QUALITY_COLORS[selectedItem.quality] }}>
                  {selectedItem.definition.name}
                </span>
                吗？
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSellConfirm(false)}
                  className="bg-muted text-foreground hover:bg-secondary rounded px-3 py-2 text-sm sm:px-4"
                >
                  取消
                </button>
                <button
                  onClick={handleSell}
                  className="rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 sm:px-4"
                >
                  确认出售
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
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
      title={item ? `${item.definition.name} (点击卸下)` : label || SLOT_NAMES[slot]}
    >
      {item ? (
        <span className="drop-shadow-sm">{getItemIcon(item)}</span>
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

function ItemSlot({
  item,
  quantity,
  selected,
  onClick,
}: {
  item: GameItem
  quantity?: number
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 text-lg shadow-sm transition-all hover:shadow-md ${
        selected
          ? 'border-yellow-500 ring-2 ring-yellow-500/50 dark:border-yellow-400 dark:ring-yellow-400/50'
          : 'border-border'
      }`}
      style={{
        background: selected
          ? `${QUALITY_COLORS[item.quality]}20`
          : `linear-gradient(135deg, ${QUALITY_COLORS[item.quality]}15 0%, ${QUALITY_COLORS[item.quality]}08 100%)`,
        borderColor: selected ? undefined : QUALITY_COLORS[item.quality],
      }}
      title={item.definition.name}
    >
      <span className="drop-shadow-sm">{getItemIcon(item)}</span>
      {quantity && quantity > 1 && (
        <span className="bg-foreground text-background absolute right-0 bottom-0 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold">
          {quantity}
        </span>
      )}
    </button>
  )
}
