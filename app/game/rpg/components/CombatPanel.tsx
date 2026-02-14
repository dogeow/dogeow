'use client'

import { useGameStore } from '../stores/gameStore'
import { QUALITY_COLORS } from '../types'

export function CombatPanel() {
  const {
    currentMap,
    startCombat,
    isFighting,
    setShouldAutoCombat,
    stopCombat,
    isLoading,
    combatResult,
    combatLogs,
  } = useGameStore()

  // 注意：战斗 interval 的管理已移至 page.tsx 页面级别
  // 这样可以确保即使切换到其他标签页，战斗也会继续执行

  const handleStartCombat = async () => {
    await startCombat()
    setShouldAutoCombat(true) // 开启自动战斗
  }

  const handleStopCombat = async () => {
    await stopCombat()
    // stopCombat 会自动设置 shouldAutoCombat: false
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 当前地图与战斗控制 */}
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h4 className="text-foreground mb-2 text-base font-medium sm:mb-3 sm:text-lg">
              当前地图
            </h4>
            {currentMap ? (
              <div>
                <p className="text-base font-bold text-green-600 sm:text-lg dark:text-green-400">
                  {currentMap.name}
                </p>
                <p className="text-muted-foreground text-xs sm:text-sm">{currentMap.description}</p>
                <p className="text-muted-foreground/80 text-xs">
                  等级范围: Lv.{currentMap.min_level}-{currentMap.max_level}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">尚未进入任何地图</p>
            )}
          </div>

          {currentMap && !isFighting && (
            <button
              onClick={handleStartCombat}
              disabled={isLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
            >
              ⚔️ 开始挂机
            </button>
          )}
          {isFighting && (
            <button
              onClick={handleStopCombat}
              disabled={isLoading}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
            >
              停止挂机
            </button>
          )}
        </div>
      </div>

      {/* 战斗结果 - 最新一次 */}
      {combatResult && (
        <div
          className={`rounded-lg border p-3 sm:p-4 ${
            combatResult.victory
              ? 'border-green-600 bg-green-600/20 dark:border-green-500 dark:bg-green-500/20'
              : 'border-red-600 bg-red-600/20 dark:border-red-500 dark:bg-red-500/20'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-sm font-bold sm:text-base">
              {combatResult.victory ? '✓ 胜利' : '✗ 失败'}
            </span>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {combatResult.monster.type === 'boss'
                ? '👑'
                : combatResult.monster.type === 'elite'
                  ? '⭐'
                  : ''}{' '}
              {combatResult.monster.name} Lv.{combatResult.monster.level}
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2 text-center text-xs sm:gap-4 sm:text-sm">
            <div className="min-w-[calc(50%-4px)] flex-1 sm:min-w-[calc(25%-12px)]">
              <p className="text-muted-foreground text-xs">造成伤害</p>
              <p className="text-sm font-bold text-orange-500 sm:text-base dark:text-orange-400">
                {combatResult.damage_dealt}
              </p>
            </div>
            <div className="min-w-[calc(50%-4px)] flex-1 sm:min-w-[calc(25%-12px)]">
              <p className="text-muted-foreground text-xs">受到伤害</p>
              <p className="text-sm font-bold text-red-500 sm:text-base dark:text-red-400">
                {combatResult.damage_taken}
              </p>
            </div>
            <div className="min-w-[calc(50%-4px)] flex-1 sm:min-w-[calc(25%-12px)]">
              <p className="text-muted-foreground text-xs">获得经验</p>
              <p className="text-sm font-bold text-purple-500 sm:text-base dark:text-purple-400">
                +{combatResult.experience_gained}
              </p>
            </div>
            <div className="min-w-[calc(50%-4px)] flex-1 sm:min-w-[calc(25%-12px)]">
              <p className="text-muted-foreground text-xs">获得金币</p>
              <p className="text-sm font-bold text-yellow-600 sm:text-base dark:text-yellow-400">
                +{combatResult.gold_gained}
              </p>
            </div>
          </div>

          {combatResult.loot?.item && (
            <div className="bg-muted/50 mt-3 rounded p-2 text-center">
              <span className="text-muted-foreground text-xs sm:text-sm">获得物品: </span>
              <span
                style={{ color: QUALITY_COLORS[combatResult.loot.item.quality] }}
                className="text-sm font-bold sm:text-base"
              >
                {combatResult.loot.item.definition.name}
              </span>
            </div>
          )}
          {combatResult.loot?.item_lost && (
            <div className="mt-3 rounded bg-red-600/20 p-2 text-center dark:bg-red-500/20">
              <span className="text-sm font-bold text-red-600 sm:text-base dark:text-red-400">
                ⚠️ 物品掉落丢失：{combatResult.loot.item_lost_reason}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 战斗日志 - 紧凑显示 */}
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <h4 className="text-foreground mb-3 text-base font-medium sm:mb-4 sm:text-lg">战斗日志</h4>
        <div className="max-h-64 space-y-1 overflow-y-auto sm:max-h-80 sm:space-y-1.5">
          {combatLogs.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">暂无战斗记录</p>
          ) : (
            combatLogs.slice(0, 50).map((log, index) => (
              <div
                key={`combat-log-${index}`}
                className={`flex flex-wrap items-center gap-1 rounded px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm ${
                  log.victory
                    ? 'bg-green-600/10 dark:bg-green-500/10'
                    : 'bg-red-600/10 dark:bg-red-500/10'
                }`}
              >
                <span
                  className={`font-semibold ${log.victory ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {log.victory ? '✓' : '✗'}
                </span>
                <span className="text-foreground">
                  {log.monster.name} Lv.{log.monster.level}
                </span>
                <span className="text-orange-500 dark:text-orange-400">{log.damage_dealt}</span>
                <span className="text-purple-500 dark:text-purple-400">
                  +{log.experience_gained}
                </span>
                <span className="text-yellow-600 dark:text-yellow-400">+{log.gold_gained}</span>
                {log.loot?.item && (
                  <span
                    style={{ color: QUALITY_COLORS[log.loot.item.quality] }}
                    className="font-semibold"
                  >
                    🎁 {log.loot.item.definition.name}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
