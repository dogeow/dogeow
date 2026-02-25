'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useGameStore } from '../../stores/gameStore'
import { useMonsterDrops } from '../../hooks/useMonsterDrops'
import { CompendiumItem, CompendiumMonster, ItemType, STAT_NAMES } from '../../types'
import { getItemIconFallback } from '../../utils/itemUtils'

type CompendiumTab = 'items' | 'monsters'

type ItemCategory = {
  id: string
  label: string
  types: readonly string[] | null
}

const ITEM_CATEGORIES: ItemCategory[] = [
  { id: 'all', label: '全部', types: null },
  { id: 'weapon', label: '武器', types: ['weapon'] },
  { id: 'armor', label: '防具', types: ['helmet', 'armor', 'gloves', 'boots', 'belt'] },
  { id: 'accessory', label: '饰品', types: ['ring', 'amulet'] },
  { id: 'potion', label: '药水', types: ['potion'] },
  { id: 'gem', label: '宝石', types: ['gem'] },
]

const MONSTER_TYPES = [
  { id: 'all', label: '全部' },
  { id: 'normal', label: '普通' },
  { id: 'elite', label: '精英' },
  { id: 'boss', label: 'BOSS' },
] as const

export function CompendiumPanel() {
  const { compendiumItems, compendiumMonsters, fetchCompendiumItems, fetchCompendiumMonsters } =
    useGameStore()

  const [activeTab, setActiveTab] = useState<CompendiumTab>('items')
  const [itemCategory, setItemCategory] = useState<string>('all')
  const [monsterFilter, setMonsterFilter] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<CompendiumItem | null>(null)
  const [selectedMonster, setSelectedMonster] = useState<CompendiumMonster | null>(null)
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  // 使用 SWR hook 获取怪物掉落数据
  const { data: compendiumMonsterDrops, isLoading: dropsLoading } = useMonsterDrops(
    selectedMonster?.id
  )

  // 计算进度
  const itemProgress = useMemo(() => {
    const discovered = compendiumItems.filter(i => i.discovered).length
    const total = compendiumItems.length
    return { discovered, total, percent: total > 0 ? Math.round((discovered / total) * 100) : 0 }
  }, [compendiumItems])

  const monsterProgress = useMemo(() => {
    const discovered = compendiumMonsters.filter(m => m.discovered).length
    const total = compendiumMonsters.length
    return { discovered, total, percent: total > 0 ? Math.round((discovered / total) * 100) : 0 }
  }, [compendiumMonsters])

  // 加载数据 - 每次切换 Tab 都强制刷新
  useMemo(() => {
    if (activeTab === 'items') {
      fetchCompendiumItems()
    } else if (activeTab === 'monsters') {
      fetchCompendiumMonsters()
    }
  }, [activeTab, fetchCompendiumItems, fetchCompendiumMonsters])

  // 过滤物品
  const filteredItems = useMemo(() => {
    const category = ITEM_CATEGORIES.find(c => c.id === itemCategory)
    if (!category?.types) return compendiumItems
    return compendiumItems.filter(item => category.types!.includes(item.type as ItemType))
  }, [compendiumItems, itemCategory])

  // 过滤怪物
  const filteredMonsters = useMemo(() => {
    if (monsterFilter === 'all') return compendiumMonsters
    return compendiumMonsters.filter(m => m.type === monsterFilter)
  }, [compendiumMonsters, monsterFilter])

  const handleMonsterClick = (monster: CompendiumMonster) => {
    setSelectedMonster(monster)
  }

  const handleMonsterDialogClose = () => {
    setSelectedMonster(null)
  }

  const handleEventStopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab 切换 */}
      <div className="flex gap-2 *:flex-1">
        <button
          onClick={() => setActiveTab('items')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'items'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          物品图鉴
        </button>
        <button
          onClick={() => setActiveTab('monsters')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'monsters'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          怪物图鉴
        </button>
      </div>

      {/* 进度显示 */}
      {activeTab === 'items' && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>物品收集:</span>
          <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${itemProgress.percent}%` }}
            />
          </div>
          <span>
            {itemProgress.discovered}/{itemProgress.total} ({itemProgress.percent}%)
          </span>
        </div>
      )}
      {activeTab === 'monsters' && (
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>怪物收集:</span>
          <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${monsterProgress.percent}%` }}
            />
          </div>
          <span>
            {monsterProgress.discovered}/{monsterProgress.total} ({monsterProgress.percent}%)
          </span>
        </div>
      )}

      {/* 物品图鉴 */}
      {activeTab === 'items' && (
        <div className="flex flex-col gap-4">
          {/* 分类筛选 */}
          <div className="flex gap-1 *:flex-1">
            {ITEM_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setItemCategory(cat.id)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  itemCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 物品列表 */}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {filteredItems.map(item => {
              const isDiscovered = item.discovered !== false
              return (
                <button
                  key={item.id}
                  onClick={() => isDiscovered && setSelectedItem(item)}
                  disabled={!isDiscovered}
                  className={`flex flex-col items-center rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                    selectedItem?.id === item.id
                      ? 'bg-muted border-yellow-500 ring-2 ring-yellow-500/50'
                      : isDiscovered
                        ? 'border-border bg-card'
                        : 'border-border bg-card opacity-50'
                  } ${!isDiscovered ? 'cursor-not-allowed' : ''}`}
                  style={{
                    borderColor: selectedItem?.id === item.id ? undefined : '#4b5563',
                  }}
                  title={isDiscovered ? item.name : '未发现'}
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
                    {isDiscovered ? (
                      <ItemIcon item={item} className="drop-shadow-sm" />
                    ) : (
                      <span className="text-2xl">❓</span>
                    )}
                  </span>
                  <span
                    className={`mt-1 w-full truncate text-center text-xs ${!isDiscovered ? 'text-muted-foreground' : ''}`}
                  >
                    {isDiscovered ? item.name : '???'}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {isDiscovered ? `Lv.${item.required_level}` : 'Lv.?'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 物品详情 Dialog */}
          <Dialog
            open={!!selectedItem && !viewingImage}
            onOpenChange={open => !open && setSelectedItem(null)}
          >
            <DialogContent className="bg-card max-w-md">
              {selectedItem && (
                <div className="flex gap-4">
                  {/* 左侧图片 */}
                  <button
                    type="button"
                    className="border-border bg-muted relative flex h-[200px] w-[200px] shrink-0 cursor-zoom-in items-center justify-center rounded-lg border-2"
                    onClick={e => {
                      e.stopPropagation()
                      setViewingImage(`/game/rpg/items/item_${selectedItem.id}_origin.png`)
                    }}
                  >
                    <span className="absolute inset-0 rounded-md p-2">
                      <ImageWithFallback
                        src={`/game/rpg/items/item_${selectedItem.id}_origin.png`}
                        fallback={getItemIconFallback({ definition: selectedItem })}
                      />
                    </span>
                  </button>
                  {/* 右侧信息 */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold">{selectedItem.name}</h3>
                      <p className="text-muted-foreground text-sm">{selectedItem.type}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      {Object.entries(selectedItem.base_stats || {}).map(([stat, value]) => (
                        <p key={stat} className="text-green-600 dark:text-green-400">
                          +{value} {STAT_NAMES[stat] || stat}
                        </p>
                      ))}
                      <p className="text-muted-foreground">
                        需求等级: {selectedItem.required_level}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* 查看大图（物品/怪物共用） */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={e => {
            e.stopPropagation()
            setViewingImage(null)
          }}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <Image
              src={viewingImage}
              alt=""
              width={800}
              height={800}
              className="max-h-[90vh] w-auto object-contain"
            />
            <button
              type="button"
              className="absolute top-2 right-2 z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
              onClick={e => {
                e.stopPropagation()
                setViewingImage(null)
              }}
              aria-label="关闭"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 怪物图鉴 */}
      {activeTab === 'monsters' && (
        <div className="flex flex-col gap-4">
          {/* 分类筛选 */}
          <div className="flex gap-1 *:flex-1">
            {MONSTER_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setMonsterFilter(type.id)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  monsterFilter === type.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* 怪物列表 */}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {filteredMonsters.map(monster => {
              const isDiscovered = monster.discovered !== false
              return (
                <button
                  key={monster.id}
                  onClick={() => isDiscovered && handleMonsterClick(monster)}
                  disabled={!isDiscovered}
                  className={`flex flex-col items-center rounded-lg border-2 p-2 transition-all hover:shadow-md ${
                    selectedMonster?.id === monster.id
                      ? 'bg-muted border-yellow-500 ring-2 ring-yellow-500/50'
                      : isDiscovered
                        ? 'border-border bg-card'
                        : 'border-border bg-card opacity-50'
                  } ${isDiscovered ? '' : 'cursor-not-allowed'}`}
                >
                  {isDiscovered ? (
                    <MonsterIcon monsterId={monster.id} className="h-10 w-10" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center text-2xl">❓</span>
                  )}
                  <span
                    className={`mt-1 w-full truncate text-center text-xs ${!isDiscovered ? 'text-muted-foreground' : ''}`}
                  >
                    {isDiscovered ? monster.name : '???'}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {isDiscovered ? `Lv.${monster.level}` : 'Lv.?'}
                  </span>
                </button>
              )
            })}
          </div>

          {/* 怪物详情 Dialog：查看大图时关闭，避免 Dialog 遮罩挡住大图层的关闭按钮 */}
          <Dialog
            open={!!selectedMonster && !viewingImage}
            onOpenChange={open => !open && handleMonsterDialogClose()}
          >
            <DialogContent className="bg-card max-h-[80vh] max-w-md overflow-y-auto">
              {compendiumMonsterDrops ? (
                <div className="space-y-4">
                  {/* 顶部：图片 + 属性 */}
                  <div className="flex gap-4">
                    {/* 左侧图片 */}
                    <button
                      type="button"
                      className="relative h-[200px] w-[200px] shrink-0 cursor-zoom-in"
                      onClick={e => {
                        e.stopPropagation()
                        setViewingImage(
                          `/game/rpg/monsters/monster_${selectedMonster?.id}_origin.png`
                        )
                      }}
                    >
                      <Image
                        src={`/game/rpg/monsters/monster_${selectedMonster?.id}_origin.png`}
                        alt=""
                        fill
                        className="object-contain"
                      />
                    </button>
                    {/* 右侧属性 */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-lg font-bold">{compendiumMonsterDrops.monster.name}</h3>
                        <p className="text-muted-foreground text-sm">
                          Lv.{compendiumMonsterDrops.monster.level} ·{' '}
                          {getMonsterTypeName(compendiumMonsterDrops.monster.type)}
                        </p>
                      </div>

                      <div className="space-y-1 text-sm">
                        <p>生命: {compendiumMonsterDrops.monster.hp_base}</p>
                        <p>攻击: {compendiumMonsterDrops.monster.attack_base}</p>
                        <p>防御: {compendiumMonsterDrops.monster.defense_base}</p>
                        <p>经验: {compendiumMonsterDrops.monster.experience_base}</p>
                      </div>
                    </div>
                  </div>

                  {/* 底部：可能掉落 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">可能掉落</h4>
                      {compendiumMonsterDrops.drop_rates && (
                        <span className="text-muted-foreground text-xs">
                          装备: {compendiumMonsterDrops.drop_rates.item}% | 金币:{' '}
                          {compendiumMonsterDrops.drop_rates.gold}% | 药水:{' '}
                          {compendiumMonsterDrops.drop_rates.potion}%
                        </span>
                      )}
                    </div>
                    {compendiumMonsterDrops.possible_items.length > 0 ? (
                      <div className="grid grid-cols-4 gap-1">
                        {compendiumMonsterDrops.possible_items.map(item => (
                          <div key={item.id} className="bg-muted rounded p-1 text-center">
                            <span className="text-lg">
                              {getItemIconFallback({ definition: item })}
                            </span>
                            <p className="truncate text-xs">{item.name}</p>
                            {item.drop_rate !== undefined && (
                              <p className="text-muted-foreground text-[10px]">{item.drop_rate}%</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">暂无物品掉落数据</p>
                    )}
                  </div>
                </div>
              ) : dropsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">加载失败</p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
}

/** 带 fallback 的图片组件 */
function ImageWithFallback({ src, fallback }: { src: string; fallback: string }) {
  const [useImg, setUseImg] = useState(true)
  return (
    <>
      {useImg && (
        <Image src={src} alt="" fill className="object-contain" onError={() => setUseImg(false)} />
      )}
      {!useImg && (
        <span className="absolute inset-0 flex items-center justify-center text-6xl">
          {fallback}
        </span>
      )}
    </>
  )
}

/** 物品小图标 */
function ItemIcon({ item, className }: { item: CompendiumItem; className?: string }) {
  const definitionId = item.id
  const fallback = getItemIconFallback({ definition: item })
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

/** 物品 tip 大图标 */
function ItemTipIcon({ item, onClick }: { item: CompendiumItem; onClick?: () => void }) {
  const definitionId = item.id
  const fallback = getItemIconFallback({ definition: item })
  const [useImg, setUseImg] = useState(definitionId != null)
  const src = definitionId != null ? `/game/rpg/items/item_${definitionId}.png` : ''
  return (
    <span
      className={`bg-muted relative inline-flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-lg border-2 border-gray-400 shadow-sm ${onClick ? 'cursor-zoom-in' : ''}`}
      onClick={onClick}
    >
      {useImg && src ? (
        <Image
          src={src}
          alt=""
          fill
          className="rounded-md object-contain p-1"
          sizes="80px"
          onError={() => setUseImg(false)}
        />
      ) : (
        <span className="text-4xl drop-shadow-sm">{fallback}</span>
      )}
    </span>
  )
}

/** 怪物图标 */
function MonsterIcon({ monsterId, className }: { monsterId: number; className?: string }) {
  const [useImg, setUseImg] = useState(true)
  const src = `/game/rpg/monsters/monster_${monsterId}.png`
  return (
    <span className={`relative inline-flex items-center justify-center ${className ?? ''}`}>
      {useImg ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-contain"
          sizes="200px"
          onError={() => setUseImg(false)}
        />
      ) : (
        <span>👾</span>
      )}
    </span>
  )
}

function getMonsterTypeName(type: string): string {
  const names: Record<string, string> = {
    normal: '普通',
    elite: '精英',
    boss: 'BOSS',
  }
  return names[type] || type
}
