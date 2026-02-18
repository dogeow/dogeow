'use client'

import { useState, useMemo, useCallback } from 'react'
import { useGameStore } from '../../stores/gameStore'
import { MapDefinition, MonsterDefinition } from '../../types'
import { getMapBackgroundStyle } from '../../utils/mapBackground'
import { MonsterInfoDialog } from '../combat/MonsterInfoDialog'

const CN_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

const MONSTER_TYPE_LABEL: Record<string, string> = {
  normal: '普通',
  elite: '精英',
  boss: 'Boss',
}

const MonsterList = ({
  monsters,
  onMonsterClick,
}: {
  monsters: MonsterDefinition[]
  onMonsterClick: (monster: MonsterDefinition) => void
}) => {
  if (!monsters?.length) return null
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
      <span className="shrink-0">怪物:</span>
      {monsters.map(m => (
        <button
          key={m.id}
          type="button"
          className="bg-muted hover:bg-muted/80 cursor-pointer rounded px-1.5 py-0.5 transition-colors"
          title={`${m.name} Lv.${m.level} (${MONSTER_TYPE_LABEL[m.type] ?? m.type})`}
          onClick={() => onMonsterClick(m)}
        >
          {m.name}
        </button>
      ))}
    </div>
  )
}

function toChineseNum(n: number): string {
  if (n <= 0) return String(n)
  if (n < 10) return CN_DIGITS[n]
  if (n === 10) return '十'
  if (n < 20) return '十' + CN_DIGITS[n - 10]
  if (n < 100) {
    const tens = Math.floor(n / 10)
    const ones = n % 10
    return (tens === 1 ? '' : CN_DIGITS[tens]) + '十' + (ones === 0 ? '' : CN_DIGITS[ones])
  }
  return String(n)
}

const getActName = (actNum: number): string => `第${toChineseNum(actNum)}幕`

const MapDetailDialog = ({
  map,
  mapProgress,
  character,
  currentMap,
  isLoading,
  onClose,
  onEnter,
  onTeleport,
}: {
  map: MapDefinition
  mapProgress: Record<number, any>
  character: any
  currentMap: MapDefinition | null
  isLoading: boolean
  onClose: () => void
  onEnter: (id: number) => Promise<void>
  onTeleport: (id: number) => Promise<void>
}) => {
  const progress = mapProgress[map.id]
  const hasTeleport = progress?.teleport_unlocked || false
  const isCurrentMap = currentMap?.id === map.id
  const canTeleport = hasTeleport && !isCurrentMap
  const canShowEnter = !isCurrentMap
  const disabledTeleport = isLoading || !character

  // 计算怪物等级范围（仅从怪物定义取，无等级限制）
  const monsterLevels = map.monsters?.map(m => m.level) ?? []
  const minMonsterLevel = monsterLevels.length > 0 ? Math.min(...monsterLevels) : null
  const maxMonsterLevel = monsterLevels.length > 0 ? Math.max(...monsterLevels) : null
  const levelText =
    minMonsterLevel != null && maxMonsterLevel != null
      ? `Lv.${minMonsterLevel}-${maxMonsterLevel}`
      : '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="border-border bg-card relative w-full max-w-md overflow-hidden rounded-lg border p-4 sm:p-6">
        <div className="rounded-lg p-3 sm:p-4">
          <h4 className="text-foreground mb-2 text-lg font-bold sm:text-xl">{map.name}</h4>
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">{map.description}</p>
          <div className="bg-muted/50 mb-4 rounded-lg p-2 sm:p-3">
            <p className="text-muted-foreground text-xs sm:text-sm">怪物等级</p>
            <p className="text-foreground text-sm font-bold sm:text-base">{levelText}</p>
          </div>
          {map.monsters?.length ? (
            <div className="mb-4">
              <p className="text-muted-foreground mb-2 text-xs sm:text-sm">本图怪物</p>
              <ul className="flex flex-wrap gap-2">
                {map.monsters.map(m => (
                  <li
                    key={m.id}
                    className="bg-muted/60 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm"
                  >
                    <span className="text-foreground font-medium">{m.name}</span>
                    <span
                      className={`rounded px-1 text-xs ${
                        m.type === 'boss'
                          ? 'bg-amber-600/30 text-amber-700 dark:text-amber-400'
                          : m.type === 'elite'
                            ? 'bg-purple-600/30 text-purple-700 dark:text-purple-400'
                            : 'bg-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {MONSTER_TYPE_LABEL[m.type] ?? m.type}
                    </span>
                    <span className="text-muted-foreground text-xs">Lv.{m.level}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex gap-2">
            {canTeleport && (
              <button
                onClick={() => onTeleport(map.id)}
                disabled={disabledTeleport}
                className="flex-1 rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                传送
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-muted text-foreground hover:bg-secondary mt-4 w-full rounded py-2"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

export function MapPanel() {
  const { character, maps, mapProgress, currentMap, enterMap, teleportToMap, isLoading } =
    useGameStore()

  const [selectedMap, setSelectedMap] = useState<MapDefinition | null>(null)
  const [selectedMonster, setSelectedMonster] = useState<MonsterDefinition | null>(null)
  const [activeAct, setActiveAct] = useState(1)

  const handleEnter = useCallback(
    async (mapId: number) => {
      await enterMap(mapId)
      setSelectedMap(null)
    },
    [enterMap]
  )

  const handleTeleport = useCallback(
    async (mapId: number) => {
      await teleportToMap(mapId)
      setSelectedMap(null)
    },
    [teleportToMap]
  )

  const handleMonsterClick = useCallback((monster: MonsterDefinition) => {
    setSelectedMonster(monster)
  }, [])

  // 将 MonsterDefinition 转换为 MonsterInfoDialog 需要的 CombatMonster 格式
  const monsterForDialog = selectedMonster
    ? {
        id: selectedMonster.id,
        name: selectedMonster.name,
        type: selectedMonster.type,
        level: selectedMonster.level,
        hp: selectedMonster.hp_base,
        max_hp: selectedMonster.hp_base,
      }
    : null

  // 按章节分组
  const mapsByAct = useMemo(() => {
    const actMaps: Record<number, MapDefinition[]> = {}
    for (const map of maps) {
      if (!actMaps[map.act]) actMaps[map.act] = []
      actMaps[map.act].push(map)
    }
    return actMaps
  }, [maps])

  const actOrder = useMemo(
    () =>
      Object.keys(mapsByAct)
        .map(Number)
        .sort((a, b) => a - b),
    [mapsByAct]
  )
  const effectiveAct = actOrder.includes(activeAct) ? activeAct : (actOrder[0] ?? 1)
  const displayActMaps = mapsByAct[effectiveAct] ?? []

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 地图列表 - 按幕用 tabs 切换 */}
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
          {actOrder.length > 0 && (
            <>
              <div className="bg-muted/50 mb-3 flex gap-1 rounded-lg p-1 sm:mb-4">
                {actOrder.map(actNum => (
                  <button
                    key={actNum}
                    type="button"
                    onClick={() => setActiveAct(actNum)}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                      effectiveAct === actNum
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {getActName(actNum)}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {displayActMaps.map(map => {
                  const progress = mapProgress[map.id]
                  const hasTeleport = progress?.teleport_unlocked || false
                  const isCurrentMap = currentMap?.id === map.id

                  // 计算怪物等级范围（仅从怪物定义取，无等级限制）
                  const monsterLevels = map.monsters?.map(m => m.level) ?? []
                  const minMonsterLevel =
                    monsterLevels.length > 0 ? Math.min(...monsterLevels) : null
                  const maxMonsterLevel =
                    monsterLevels.length > 0 ? Math.max(...monsterLevels) : null
                  const levelText =
                    minMonsterLevel != null && maxMonsterLevel != null
                      ? `Lv.${minMonsterLevel}-${maxMonsterLevel}`
                      : '—'

                  return (
                    <div
                      key={map.id}
                      className={`relative min-w-full flex-1 cursor-pointer overflow-hidden rounded-lg border-2 transition-all sm:min-w-[calc(50%-0.375rem)] lg:min-w-[calc(33.333%-0.5rem)] ${
                        isCurrentMap
                          ? 'border-green-500'
                          : 'border-border hover:border-blue-500 dark:hover:border-blue-400'
                      }`}
                      style={getMapBackgroundStyle(map)}
                      onClick={() => !isCurrentMap && enterMap(map.id)}
                      tabIndex={0}
                      role="button"
                    >
                      <div className="bg-black/40 p-3 sm:p-4">
                        <div className="mb-2 flex items-start justify-between">
                          <h5 className="text-foreground text-sm font-medium sm:text-base">
                            {map.name}
                          </h5>
                          {isCurrentMap && (
                            <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs text-white sm:px-2">
                              当前
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-2 text-xs sm:text-sm">
                          {map.description}
                        </p>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">怪物 {levelText}</span>
                          <div className="flex gap-1">
                            {hasTeleport && (
                              <span
                                className="text-blue-600 dark:text-blue-400"
                                title="传送点已解锁"
                              >
                                🌀
                              </span>
                            )}
                          </div>
                        </div>
                        {!!map.monsters?.length && (
                          <MonsterList
                            monsters={map.monsters}
                            onMonsterClick={handleMonsterClick}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 怪物信息弹窗 */}
      {monsterForDialog && (
        <MonsterInfoDialog monster={monsterForDialog} onClose={() => setSelectedMonster(null)} />
      )}

      {/* 地图详情弹窗 */}
      {selectedMap && (
        <MapDetailDialog
          map={selectedMap}
          mapProgress={mapProgress}
          character={character}
          currentMap={currentMap}
          isLoading={isLoading}
          onClose={() => setSelectedMap(null)}
          onEnter={handleEnter}
          onTeleport={handleTeleport}
        />
      )}
    </div>
  )
}
