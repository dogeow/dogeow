'use client'

import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { MapDefinition } from '../types'

export function MapPanel() {
  const { character, maps, mapProgress, currentMap, enterMap, teleportToMap, isLoading } =
    useGameStore()

  const [selectedMap, setSelectedMap] = useState<MapDefinition | null>(null)

  const handleEnter = async (mapId: number) => {
    await enterMap(mapId)
    setSelectedMap(null)
  }

  const handleTeleport = async (mapId: number) => {
    await teleportToMap(mapId)
    setSelectedMap(null)
  }

  // 按章节分组
  const mapsByAct = maps.reduce(
    (acc, map) => {
      if (!acc[map.act]) acc[map.act] = []
      acc[map.act].push(map)
      return acc
    },
    {} as Record<number, MapDefinition[]>
  )

  const actNames: Record<number, string> = {
    1: '第一幕 - 森林',
    2: '第二幕 - 洞穴',
    3: '第三幕 - 地狱',
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 当前地图状态 */}
      <div className="rounded-lg bg-gray-800 p-3 sm:p-4">
        <h4 className="mb-2 text-base font-medium text-white sm:mb-3 sm:text-lg">当前位置</h4>
        {currentMap ? (
          <div>
            <p className="text-lg font-bold text-green-400 sm:text-xl">{currentMap.name}</p>
            <p className="text-xs text-gray-400 sm:text-sm">{currentMap.description}</p>
            <p className="text-xs text-gray-500">
              等级范围: Lv.{currentMap.min_level}-{currentMap.max_level}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">尚未进入任何地图</p>
        )}
      </div>

      {/* 地图列表 */}
      <div className="space-y-3 sm:space-y-4">
        {Object.entries(mapsByAct).map(([act, actMaps]) => (
          <div key={act} className="rounded-lg bg-gray-800 p-3 sm:p-4">
            <h4 className="mb-3 text-base font-medium text-white sm:mb-4 sm:text-lg">
              {actNames[parseInt(act)] || `第${act}幕`}
            </h4>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
              {actMaps.map(map => {
                const progress = mapProgress[map.id]
                const hasTeleport = progress?.teleport_unlocked || false
                const isCurrentMap = currentMap?.id === map.id
                const canEnter = character && character.level >= map.min_level

                return (
                  <div
                    key={map.id}
                    className={`cursor-pointer rounded-lg border-2 p-3 transition-all sm:p-4 ${
                      isCurrentMap
                        ? 'border-green-500 bg-green-600/20'
                        : canEnter
                          ? 'border-gray-600 bg-gray-700/50 hover:border-blue-500'
                          : 'border-gray-700 bg-gray-800/50 opacity-60'
                    }`}
                    onClick={() => setSelectedMap(map)}
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <h5 className="text-sm font-medium text-white sm:text-base">{map.name}</h5>
                      {isCurrentMap && (
                        <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs sm:px-2">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="mb-2 text-xs text-gray-400 sm:text-sm">{map.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        Lv.{map.min_level}-{map.max_level}
                      </span>
                      <div className="flex gap-1">
                        {canEnter && (
                          <span className="text-green-400" title="可进入">
                            ✓
                          </span>
                        )}
                        {hasTeleport && (
                          <span className="text-blue-400" title="传送点已解锁">
                            🌀
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 地图详情弹窗 */}
      {selectedMap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-4 sm:p-6">
            <h4 className="mb-2 text-lg font-bold text-white sm:text-xl">{selectedMap.name}</h4>
            <p className="mb-4 text-sm text-gray-400 sm:text-base">{selectedMap.description}</p>

            <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-4">
              <div className="rounded-lg bg-gray-700/50 p-2 sm:p-3">
                <p className="text-xs text-gray-400 sm:text-sm">等级范围</p>
                <p className="text-sm font-bold text-white sm:text-base">
                  Lv.{selectedMap.min_level}-{selectedMap.max_level}
                </p>
              </div>
              <div className="rounded-lg bg-gray-700/50 p-2 sm:p-3">
                <p className="text-xs text-gray-400 sm:text-sm">传送费用</p>
                <p className="text-sm font-bold text-yellow-400 sm:text-base">
                  {selectedMap.teleport_cost > 0 ? `${selectedMap.teleport_cost} 金币` : '免费'}
                </p>
              </div>
            </div>

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
                      className="flex-1 rounded bg-green-600 py-2 text-white hover:bg-green-700 disabled:bg-gray-600"
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
                      className="flex-1 rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:bg-gray-600"
                    >
                      传送
                    </button>
                  )}
                  {!canEnter && (
                    <p className="text-sm text-red-400">需要等级 {selectedMap.min_level}</p>
                  )}
                </div>
              )
            })()}

            <button
              onClick={() => setSelectedMap(null)}
              className="mt-4 w-full rounded bg-gray-700 py-2 text-white hover:bg-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
