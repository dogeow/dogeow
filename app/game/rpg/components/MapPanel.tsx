'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { MapDefinition, MonsterDefinition } from '../types'

const CN_DIGITS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九']

const MONSTER_TYPE_LABEL: Record<string, string> = {
  normal: '普通',
  elite: '精英',
  boss: 'Boss',
}

function MonsterList({ monsters }: { monsters: MonsterDefinition[] }) {
  if (!monsters?.length) return null
  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
      <span className="shrink-0">怪物:</span>
      {monsters.map(m => (
        <span
          key={m.id}
          className="bg-muted rounded px-1.5 py-0.5"
          title={`${m.name} Lv.${m.level} (${MONSTER_TYPE_LABEL[m.type] ?? m.type})`}
        >
          {m.name}
        </span>
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

function getActName(actNum: number): string {
  return `第${toChineseNum(actNum)}幕`
}

export function MapPanel() {
  const { character, maps, mapProgress, currentMap, enterMap, teleportToMap, isLoading } =
    useGameStore()

  const [selectedMap, setSelectedMap] = useState<MapDefinition | null>(null)
  const [activeAct, setActiveAct] = useState(1)

  const handleEnter = async (mapId: number) => {
    await enterMap(mapId)
    setSelectedMap(null)
  }

  const handleTeleport = async (mapId: number) => {
    await teleportToMap(mapId)
    setSelectedMap(null)
  }

  // 按章节分组
  const mapsByAct = useMemo(
    () =>
      maps.reduce(
        (acc, map) => {
          if (!acc[map.act]) acc[map.act] = []
          acc[map.act].push(map)
          return acc
        },
        {} as Record<number, MapDefinition[]>
      ),
    [maps]
  )

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
      {/* 当前地图状态 */}
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <h4 className="text-foreground mb-2 text-base font-medium sm:mb-3 sm:text-lg">当前位置</h4>
        {currentMap ? (
          <div>
            <p className="text-lg font-bold text-green-600 sm:text-xl dark:text-green-400">
              {currentMap.name}
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm">{currentMap.description}</p>
            <p className="text-muted-foreground/80 text-xs">
              等级范围: Lv.{currentMap.min_level}-{currentMap.max_level}
            </p>
            {currentMap.monsters?.length ? (
              <div className="mt-2">
                <MonsterList monsters={currentMap.monsters} />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">尚未进入任何地图</p>
        )}
      </div>

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
                  const canEnter = character && character.level >= map.min_level

                  return (
                    <div
                      key={map.id}
                      className={`min-w-full flex-1 cursor-pointer rounded-lg border-2 p-3 transition-all sm:min-w-[calc(50%-0.375rem)] sm:p-4 lg:min-w-[calc(33.333%-0.5rem)] ${
                        isCurrentMap
                          ? 'border-green-500 bg-green-600/20 dark:bg-green-500/20'
                          : canEnter
                            ? 'border-border bg-muted/50 hover:border-blue-500 dark:hover:border-blue-400'
                            : 'border-border bg-muted/30 opacity-60'
                      }`}
                      onClick={() => setSelectedMap(map)}
                    >
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
                        <span className="text-muted-foreground">
                          Lv.{map.min_level}-{map.max_level}
                        </span>
                        <div className="flex gap-1">
                          {canEnter && (
                            <span className="text-green-600 dark:text-green-400" title="可进入">
                              ✓
                            </span>
                          )}
                          {hasTeleport && (
                            <span className="text-blue-600 dark:text-blue-400" title="传送点已解锁">
                              🌀
                            </span>
                          )}
                        </div>
                      </div>
                      {map.monsters?.length ? <MonsterList monsters={map.monsters} /> : null}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 地图详情弹窗 */}
      {selectedMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border-border w-full max-w-md rounded-lg border p-4 sm:p-6">
            <h4 className="text-foreground mb-2 text-lg font-bold sm:text-xl">
              {selectedMap.name}
            </h4>
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              {selectedMap.description}
            </p>

            <div className="mb-4 flex flex-wrap gap-2 sm:gap-4">
              <div className="bg-muted/50 min-w-[calc(50%-4px)] flex-1 rounded-lg p-2 sm:p-3">
                <p className="text-muted-foreground text-xs sm:text-sm">等级范围</p>
                <p className="text-foreground text-sm font-bold sm:text-base">
                  Lv.{selectedMap.min_level}-{selectedMap.max_level}
                </p>
              </div>
              <div className="bg-muted/50 min-w-[calc(50%-4px)] flex-1 rounded-lg p-2 sm:p-3">
                <p className="text-muted-foreground text-xs sm:text-sm">传送费用</p>
                <p className="text-sm font-bold text-yellow-600 sm:text-base dark:text-yellow-400">
                  {selectedMap.teleport_cost > 0 ? `${selectedMap.teleport_cost} 金币` : '免费'}
                </p>
              </div>
            </div>

            {selectedMap.monsters?.length ? (
              <div className="mb-4">
                <p className="text-muted-foreground mb-2 text-xs sm:text-sm">本图怪物</p>
                <ul className="flex flex-wrap gap-2">
                  {selectedMap.monsters.map(m => (
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

            {(() => {
              const progress = mapProgress[selectedMap.id]
              const hasTeleport = progress?.teleport_unlocked || false
              const isCurrentMap = currentMap?.id === selectedMap.id
              const canEnter = character && character.level >= selectedMap.min_level

              return (
                <div className="flex gap-2">
                  {canEnter && !isCurrentMap && (
                    <button
                      onClick={() => handleEnter(selectedMap.id)}
                      disabled={isLoading}
                      className="flex-1 rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      进入地图
                    </button>
                  )}
                  {hasTeleport && !isCurrentMap && (
                    <button
                      onClick={() => handleTeleport(selectedMap.id)}
                      disabled={
                        isLoading || !character || character.gold < selectedMap.teleport_cost
                      }
                      className="flex-1 rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      传送
                    </button>
                  )}
                  {!canEnter && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      需要等级 {selectedMap.min_level}
                    </p>
                  )}
                </div>
              )
            })()}

            <button
              onClick={() => setSelectedMap(null)}
              className="bg-muted text-foreground hover:bg-secondary mt-4 w-full rounded py-2"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
