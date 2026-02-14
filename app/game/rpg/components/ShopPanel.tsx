'use client'

import { useState, useEffect, useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { ShopItem, GameItem, QUALITY_COLORS, QUALITY_NAMES, STAT_NAMES, ItemType } from '../types'

// 物品类型图标映射
const ITEM_ICONS: Record<string, string> = {
  weapon: '⚔️',
  helmet: '🪖',
  armor: '👕',
  gloves: '🧤',
  boots: '👢',
  belt: '🥋',
  ring: '💍',
  amulet: '📿',
  potion: '🧪',
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
}

// 物品堆叠函数
interface StackedInventoryItem extends GameItem {
  displayQuantity: number
}

function stackInventoryItems(items: GameItem[]): StackedInventoryItem[] {
  const stacks = new Map<string, StackedInventoryItem>()

  items.forEach(item => {
    // 跳过没有定义的物品（孤立的物品记录）
    if (!item.definition) {
      return
    }

    // 对于药品，按定义ID堆叠
    if (item.definition.type === 'potion') {
      const key = `potion-${item.definition.id}`
      const existing = stacks.get(key)
      if (existing) {
        existing.displayQuantity += item.quantity
      } else {
        stacks.set(key, { ...item, displayQuantity: item.quantity })
      }
    } else {
      // 装备不堆叠
      stacks.set(`equip-${item.id}`, { ...item, displayQuantity: 1 })
    }
  })

  return Array.from(stacks.values())
}

export function ShopPanel() {
  const { shopItems, inventory, character, buyItem, sellItemToShop, fetchShopItems, isLoading } =
    useGameStore()
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<StackedInventoryItem | null>(
    null
  )
  const [activeView, setActiveView] = useState<'buy' | 'sell'>('buy')
  const [buyQuantity, setBuyQuantity] = useState(1)
  const [sellQuantity, setSellQuantity] = useState(1)
  const [filterType, setFilterType] = useState<ItemType | 'all'>('all')

  // 堆叠后的背包物品
  const stackedInventory = useMemo(() => stackInventoryItems(inventory), [inventory])

  // 过滤后的商店物品
  const filteredShopItems = useMemo(() => {
    if (filterType === 'all') return shopItems
    return shopItems.filter(item => item.type === filterType)
  }, [shopItems, filterType])

  // 按类型分组商店物品
  const groupedShopItems = useMemo(() => {
    const groups: Record<string, ShopItem[]> = {}
    filteredShopItems.forEach(item => {
      if (!groups[item.type]) {
        groups[item.type] = []
      }
      groups[item.type].push(item)
    })
    return groups
  }, [filteredShopItems])

  // 加载商店物品
  useEffect(() => {
    fetchShopItems()
  }, [fetchShopItems])

  // 计算购买总价
  const totalBuyPrice = selectedShopItem ? selectedShopItem.buy_price * buyQuantity : 0

  // 计算出售总价
  const getSellPrice = (item: StackedInventoryItem): number => {
    if (!item.definition) return 0 // 防止孤立的物品记录

    const basePrice = item.definition.base_stats?.price ?? 50
    const qualityMultiplier =
      {
        common: 1.0,
        magic: 1.3,
        rare: 1.6,
        legendary: 2.0,
        mythic: 2.5,
      }[item.quality] ?? 1.0
    return Math.floor(basePrice * qualityMultiplier * 0.5)
  }

  const totalSellPrice = selectedInventoryItem
    ? getSellPrice(selectedInventoryItem) * sellQuantity
    : 0

  const handleBuy = async () => {
    if (!selectedShopItem) return
    if (character && character.gold < totalBuyPrice) {
      return // 金币不足
    }
    await buyItem(selectedShopItem.id, buyQuantity)
    setSelectedShopItem(null)
    setBuyQuantity(1)
  }

  const handleSell = async () => {
    if (!selectedInventoryItem) return
    const maxQuantity = selectedInventoryItem.displayQuantity || selectedInventoryItem.quantity
    if (sellQuantity > maxQuantity) return
    await sellItemToShop(selectedInventoryItem.id, sellQuantity)
    setSelectedInventoryItem(null)
    setSellQuantity(1)
  }

  // 获取物品图标
  const getItemIcon = (type: ItemType): string => {
    return ITEM_ICONS[type] || '📦'
  }

  return (
    <div className="space-y-4">
      {/* 标签切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('buy')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeView === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          购买物品
        </button>
        <button
          onClick={() => setActiveView('sell')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
            activeView === 'sell'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          出售物品
        </button>
      </div>

      {/* 金币显示 */}
      <div className="rounded-lg bg-gray-800 p-3 text-center">
        <span className="text-yellow-400">
          💰 当前金币: {character?.gold.toLocaleString() || 0}
        </span>
      </div>

      {/* 购买界面 */}
      {activeView === 'buy' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* 物品列表 */}
          <div className="rounded-lg bg-gray-800 p-3 lg:col-span-2">
            {/* 类型过滤 */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`rounded px-2 py-1 text-xs ${
                  filterType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                全部
              </button>
              {Object.keys(ITEM_TYPE_NAMES).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as ItemType)}
                  className={`rounded px-2 py-1 text-xs ${
                    filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {ITEM_ICONS[type]} {ITEM_TYPE_NAMES[type as ItemType]}
                </button>
              ))}
            </div>

            {/* 物品网格 */}
            <div className="max-h-[400px] space-y-4 overflow-y-auto pr-2">
              {Object.entries(groupedShopItems).map(([type, items]) => (
                <div key={type}>
                  <h4 className="mb-2 text-sm font-medium text-gray-400">
                    {ITEM_ICONS[type]} {ITEM_TYPE_NAMES[type as ItemType] || type}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedShopItem(item)
                          setBuyQuantity(1)
                        }}
                        className={`rounded-lg border-2 p-2 text-left transition-all ${
                          selectedShopItem?.id === item.id
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                        } ${item.required_level > (character?.level || 0) ? 'opacity-50' : ''}`}
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getItemIcon(item.type)}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-white">{item.name}</p>
                            <p className="text-xs text-yellow-400">
                              💰 {item.buy_price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {item.required_level > (character?.level || 0) && (
                          <p className="mt-1 text-xs text-red-400">
                            需要等级 {item.required_level}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 购买详情 */}
          <div className="rounded-lg bg-gray-800 p-3">
            <h4 className="mb-3 text-lg font-medium text-white">购买详情</h4>
            {selectedShopItem ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-700/50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">{getItemIcon(selectedShopItem.type)}</span>
                    <h5 className="text-base font-bold text-white">{selectedShopItem.name}</h5>
                  </div>
                  <p className="mb-2 text-sm text-gray-400">
                    {ITEM_TYPE_NAMES[selectedShopItem.type]}
                    {selectedShopItem.sub_type && ` - ${selectedShopItem.sub_type}`}
                  </p>

                  {/* 属性 */}
                  <div className="mb-2 space-y-1">
                    {Object.entries(selectedShopItem.base_stats || {}).map(([stat, value]) => (
                      <p key={stat} className="text-sm text-green-400">
                        +
                        {typeof value === 'number' && value < 1 && stat.includes('crit')
                          ? `${(value * 100).toFixed(0)}%`
                          : value}{' '}
                        {STAT_NAMES[stat] || stat}
                      </p>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500">
                    需要等级: {selectedShopItem.required_level}
                  </p>
                </div>

                {/* 价格和数量 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">单价:</span>
                    <span className="text-sm text-yellow-400">
                      💰 {selectedShopItem.buy_price.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">数量:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                        className="h-6 w-6 rounded bg-gray-600 text-white hover:bg-gray-500"
                        disabled={isLoading}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={buyQuantity}
                        onChange={e => setBuyQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 rounded bg-gray-700 px-2 py-1 text-center text-sm text-white"
                        min="1"
                        max="99"
                        disabled={isLoading}
                      />
                      <button
                        onClick={() => setBuyQuantity(Math.min(99, buyQuantity + 1))}
                        className="h-6 w-6 rounded bg-gray-600 text-white hover:bg-gray-500"
                        disabled={isLoading}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-600 pt-2">
                    <span className="text-sm font-medium text-gray-300">总价:</span>
                    <span
                      className={`text-sm font-bold ${
                        character && character.gold >= totalBuyPrice
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      💰 {totalBuyPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 购买按钮 */}
                <button
                  onClick={handleBuy}
                  disabled={
                    isLoading ||
                    !character ||
                    character.gold < totalBuyPrice ||
                    selectedShopItem.required_level > character.level
                  }
                  className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-600 disabled:text-gray-400"
                >
                  {character && character.gold < totalBuyPrice
                    ? '金币不足'
                    : selectedShopItem.required_level > (character?.level || 0)
                      ? '等级不足'
                      : '确认购买'}
                </button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400">请选择要购买的物品</p>
            )}
          </div>
        </div>
      )}

      {/* 出售界面 */}
      {activeView === 'sell' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* 背包物品 */}
          <div className="rounded-lg bg-gray-800 p-3 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-base font-medium text-white">背包物品</h4>
              <span className="text-sm text-gray-400">({stackedInventory.length})</span>
            </div>

            {stackedInventory.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">背包中没有可出售的物品</p>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {stackedInventory.map(item => {
                  // 跳过没有定义的物品
                  if (!item.definition) return null

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedInventoryItem(item)
                        setSellQuantity(1)
                      }}
                      className={`relative flex h-14 w-14 items-center justify-center rounded-lg border-2 text-xl transition-all ${
                        selectedInventoryItem?.id === item.id
                          ? 'border-yellow-500 bg-yellow-500/20'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                      style={{
                        borderColor:
                          selectedInventoryItem?.id === item.id
                            ? undefined
                            : QUALITY_COLORS[item.quality],
                      }}
                      disabled={isLoading}
                      title={item.definition.name}
                    >
                      <span>{getItemIcon(item.definition.type)}</span>
                      {(item.displayQuantity || item.quantity) > 1 && (
                        <span className="absolute right-0 bottom-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gray-900 px-1 text-[10px] font-bold text-white">
                          {item.displayQuantity || item.quantity}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 出售详情 */}
          <div className="rounded-lg bg-gray-800 p-3">
            <h4 className="mb-3 text-lg font-medium text-white">出售详情</h4>
            {selectedInventoryItem && selectedInventoryItem.definition ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-gray-700/50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl">
                      {getItemIcon(selectedInventoryItem.definition.type)}
                    </span>
                    <div>
                      <h5
                        className="text-base font-bold"
                        style={{ color: QUALITY_COLORS[selectedInventoryItem.quality] }}
                      >
                        {selectedInventoryItem.definition.name}
                      </h5>
                      <span className="text-xs text-gray-400">
                        {QUALITY_NAMES[selectedInventoryItem.quality]}
                      </span>
                    </div>
                  </div>

                  {/* 属性 */}
                  <div className="mb-2 space-y-1">
                    {Object.entries(selectedInventoryItem.stats || {}).map(([stat, value]) => (
                      <p key={stat} className="text-sm text-green-400">
                        +
                        {typeof value === 'number' && value < 1 && stat.includes('crit')
                          ? `${(value * 100).toFixed(0)}%`
                          : value}{' '}
                        {STAT_NAMES[stat] || stat}
                      </p>
                    ))}
                    {selectedInventoryItem.affixes?.map((affix, i) => (
                      <p key={i} className="text-sm text-blue-400">
                        {Object.entries(affix)
                          .map(([k, v]) => `+${v} ${STAT_NAMES[k] || k}`)
                          .join(', ')}
                      </p>
                    ))}
                  </div>
                </div>

                {/* 价格和数量 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">单价:</span>
                    <span className="text-sm text-yellow-400">
                      💰 {getSellPrice(selectedInventoryItem).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">数量:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSellQuantity(Math.max(1, sellQuantity - 1))}
                        className="h-6 w-6 rounded bg-gray-600 text-white hover:bg-gray-500"
                        disabled={isLoading}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={sellQuantity}
                        onChange={e =>
                          setSellQuantity(
                            Math.min(
                              selectedInventoryItem.displayQuantity ||
                                selectedInventoryItem.quantity,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="w-16 rounded bg-gray-700 px-2 py-1 text-center text-sm text-white"
                        min="1"
                        max={
                          selectedInventoryItem.displayQuantity || selectedInventoryItem.quantity
                        }
                        disabled={isLoading}
                      />
                      <button
                        onClick={() =>
                          setSellQuantity(
                            Math.min(
                              99,
                              selectedInventoryItem.displayQuantity ||
                                selectedInventoryItem.quantity
                            )
                          )
                        }
                        className="h-6 w-6 rounded bg-gray-600 text-white hover:bg-gray-500"
                        disabled={isLoading}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-600 pt-2">
                    <span className="text-sm font-medium text-gray-300">获得:</span>
                    <span className="text-sm font-bold text-yellow-400">
                      💰 {totalSellPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 出售按钮 */}
                <button
                  onClick={handleSell}
                  disabled={
                    isLoading ||
                    sellQuantity >
                      (selectedInventoryItem.displayQuantity || selectedInventoryItem.quantity)
                  }
                  className="w-full rounded-lg bg-yellow-600 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:bg-gray-600 disabled:text-gray-400"
                >
                  确认出售
                </button>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-400">请选择要出售的物品</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
