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
}

// 获取物品图标
function getItemIcon(item: GameItem): string {
  // 如果 definition.icon 是文件名（包含.），则忽略它，使用默认图标映射
  if (item.definition.icon && !item.definition.icon.includes('.')) {
    return item.definition.icon
  }
  return ITEM_ICONS[item.definition.type] || '📦'
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

  // 使用 useMemo 优化性能，计算堆叠后的物品
  const stackedInventory = useMemo(() => stackItems(inventory), [inventory])
  const stackedStorage = useMemo(() => stackItems(storage), [storage])
  const currentItems = showStorage ? stackedStorage : stackedInventory

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

  const slots: EquipmentSlot[] = [
    'weapon',
    'helmet',
    'armor',
    'gloves',
    'boots',
    'belt',
    'ring1',
    'ring2',
    'amulet',
  ]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 装备栏 - 移动端优化 */}
      <div className="rounded-lg bg-gray-800 p-3 sm:p-4">
        <h4 className="mb-3 text-base font-medium text-white sm:mb-4 sm:text-lg">装备</h4>
        <div className="mx-auto grid max-w-[320px] grid-cols-3 gap-1.5 sm:gap-2 lg:mx-0">
          {/* 第一行：头盔 */}
          <div className="col-start-2">
            <EquipmentSlotComponent
              slot="helmet"
              item={equipment.helmet}
              onClick={() => equipment.helmet && handleUnequip('helmet')}
            />
          </div>

          {/* 第二行：武器、盔甲、戒指1 */}
          <EquipmentSlotComponent
            slot="weapon"
            item={equipment.weapon}
            onClick={() => equipment.weapon && handleUnequip('weapon')}
          />
          <EquipmentSlotComponent
            slot="armor"
            item={equipment.armor}
            onClick={() => equipment.armor && handleUnequip('armor')}
          />
          <EquipmentSlotComponent
            slot="ring1"
            item={equipment.ring1}
            onClick={() => equipment.ring1 && handleUnequip('ring1')}
            label="戒指1"
          />

          {/* 第三行：手套、腰带、戒指2 */}
          <EquipmentSlotComponent
            slot="gloves"
            item={equipment.gloves}
            onClick={() => equipment.gloves && handleUnequip('gloves')}
          />
          <EquipmentSlotComponent
            slot="belt"
            item={equipment.belt}
            onClick={() => equipment.belt && handleUnequip('belt')}
          />
          <EquipmentSlotComponent
            slot="ring2"
            item={equipment.ring2}
            onClick={() => equipment.ring2 && handleUnequip('ring2')}
            label="戒指2"
          />

          {/* 第四行：靴子、护身符 */}
          <EquipmentSlotComponent
            slot="boots"
            item={equipment.boots}
            onClick={() => equipment.boots && handleUnequip('boots')}
          />
          <EquipmentSlotComponent
            slot="amulet"
            item={equipment.amulet}
            onClick={() => equipment.amulet && handleUnequip('amulet')}
          />
        </div>
      </div>

      {/* 背包/仓库 - 移动端优化 */}
      <div className="rounded-lg bg-gray-800 p-3 sm:p-4 lg:col-span-2">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h4 className="text-base font-medium text-white sm:text-lg">
            {showStorage ? '仓库' : '背包'}
            <span className="ml-2 text-sm text-gray-400">({currentItems.length})</span>
          </h4>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowStorage(false)}
              className={`rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
                !showStorage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              背包
            </button>
            <button
              onClick={() => setShowStorage(true)}
              className={`rounded px-2.5 py-1 text-xs sm:px-3 sm:text-sm ${
                showStorage ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              仓库
            </button>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
          {currentItems.map(item => (
            <ItemSlot
              key={item.id}
              item={item}
              quantity={(item as StackedItem).quantity}
              selected={selectedItem?.id === item.id}
              onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
            />
          ))}
        </div>

        {/* 选中物品详情 - 移动端优化 */}
        {selectedItem && (
          <div className="mt-3 rounded-lg bg-gray-700/50 p-3 sm:mt-4 sm:p-4">
            <div className="mb-2 flex items-start justify-between">
              <h5
                className="text-sm font-bold sm:text-base"
                style={{ color: QUALITY_COLORS[selectedItem.quality] }}
              >
                {selectedItem.definition.name}
              </h5>
              <span className="text-xs text-gray-400 sm:text-sm">
                {QUALITY_NAMES[selectedItem.quality]}
              </span>
            </div>

            <div className="mb-3 space-y-1 text-xs sm:mb-4 sm:text-sm">
              {Object.entries(selectedItem.stats || {}).map(([stat, value]) => (
                <p key={stat} className="text-green-400">
                  +{value} {STAT_NAMES[stat] || stat}
                </p>
              ))}
              {selectedItem.affixes?.map((affix, i) => (
                <p key={i} className="text-blue-400">
                  {Object.entries(affix)
                    .map(([k, v]) => `+${v} ${STAT_NAMES[k] || k}`)
                    .join(', ')}
                </p>
              ))}
              <p className="text-gray-400">需求等级: {selectedItem.definition.required_level}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {!showStorage && selectedItem.definition.type !== 'potion' && (
                <button
                  onClick={handleEquip}
                  disabled={isLoading}
                  className="flex-1 rounded bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 disabled:bg-gray-600 sm:flex-none sm:px-4 sm:text-sm"
                >
                  装备
                </button>
              )}
              <button
                onClick={() => handleMove(!showStorage)}
                disabled={isLoading}
                className="flex-1 rounded bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700 disabled:bg-gray-600 sm:flex-none sm:px-4 sm:text-sm"
              >
                {showStorage ? '放入背包' : '存入仓库'}
              </button>
              {!showStorage && (
                <button
                  onClick={() => setShowSellConfirm(true)}
                  disabled={isLoading}
                  className="flex-1 rounded bg-red-600 px-3 py-2 text-xs text-white hover:bg-red-700 disabled:bg-gray-600 sm:flex-none sm:px-4 sm:text-sm"
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
            <div className="w-full max-w-sm rounded-lg bg-gray-800 p-4 sm:p-6">
              <h4 className="mb-3 text-base font-bold text-white sm:mb-4 sm:text-lg">确认出售</h4>
              <p className="mb-4 text-sm text-gray-300 sm:text-base">
                确定要出售
                <span className="mx-1" style={{ color: QUALITY_COLORS[selectedItem.quality] }}>
                  {selectedItem.definition.name}
                </span>
                吗？
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSellConfirm(false)}
                  className="rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-500 sm:px-4"
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
          ? 'cursor-pointer border-gray-500 bg-gradient-to-br from-gray-700 to-gray-800 hover:border-yellow-500 hover:shadow-md'
          : 'cursor-default border-dashed border-gray-700 bg-gray-800/30'
      }`}
      style={
        !item
          ? {
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
              backgroundSize: '8px 8px',
            }
          : undefined
      }
      title={item ? `${item.definition.name} (点击卸下)` : label || SLOT_NAMES[slot]}
    >
      {item ? (
        <span className="drop-shadow-sm">{getItemIcon(item)}</span>
      ) : (
        <span className="text-xs text-gray-600">{label || SLOT_NAMES[slot]}</span>
      )}
    </button>
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
      className={`relative flex h-10 w-10 items-center justify-center rounded border-2 text-lg shadow-sm transition-all hover:shadow-md ${
        selected ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-gray-600'
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
        <span className="absolute right-0 bottom-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
          {quantity}
        </span>
      )}
    </button>
  )
}
