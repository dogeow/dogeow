'use client'

import { QUALITY_COLORS, type CombatLog as CombatLogType, type CombatResult } from '../../types'
import { useMemo } from 'react'
import { CopperDisplay } from '../shared/CopperDisplay'

export function CombatLogList({ logs }: { logs: (CombatResult | CombatLogType)[] }) {
  const maxLogs = useMemo(() => logs.slice(0, 50), [logs])
  if (!logs || logs.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">暂无战斗记录</p>
  }
  return (
    <>
      {maxLogs.map((log, index) => {
        const logKey =
          'combat_log_id' in log && log.combat_log_id
            ? `log-${log.combat_log_id}`
            : 'id' in log && log.id
              ? `log-${log.id}`
              : `combat-log-${index}`
        // 有经验或铜币视为怪物死亡（胜利），避免仅依赖后端 victory 字段漏传导致显示 ⚔️
        const hasReward = (log.experience_gained ?? 0) > 0 || (log.copper_gained ?? 0) > 0
        const isDefeat = 'defeat' in log && log.defeat
        const isVictory = log.victory === true || (hasReward && !isDefeat)

        const hasPotionBefore =
          log.potion_used?.before && Object.keys(log.potion_used.before).length > 0
        const hasPotionAfter =
          log.potion_used?.after && Object.keys(log.potion_used.after).length > 0

        return (
          <div key={logKey}>
            {/* 开战前药水：单独一行 */}
            {hasPotionBefore && (
              <div className="flex flex-wrap items-center gap-1 rounded px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
                <span className="font-semibold text-pink-600 dark:text-pink-400">🧪</span>
                <span className="text-pink-600 dark:text-pink-400">
                  {Object.entries(log.potion_used!.before!)
                    .map(([, data]) => `${data.name}(+${data.restored})`)
                    .join(' ')}
                </span>
              </div>
            )}
            {/* 战斗日志主体 */}
            <div className="flex flex-wrap items-center gap-1 rounded px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
              <span
                className={`font-semibold ${
                  isVictory
                    ? 'text-green-600 dark:text-green-400'
                    : isDefeat
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-orange-500 dark:text-orange-400'
                }`}
              >
                {isVictory ? '✓' : isDefeat ? '✗' : '⚔️'}
              </span>
              <span className="text-foreground">
                {log.monster?.name ?? '?'} Lv.{log.monster?.level ?? '?'}
              </span>
              {(log.experience_gained ?? 0) > 0 && (
                <span className="text-purple-500 dark:text-purple-400">
                  +{log.experience_gained}
                </span>
              )}
              {(log.copper_gained ?? 0) > 0 && (
                <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400">
                  +<CopperDisplay copper={log.copper_gained} size="sm" />
                </span>
              )}
              {log.skills_used && log.skills_used.length > 0 && (
                <span className="text-cyan-600 dark:text-cyan-400">
                  释放:{' '}
                  {log.skills_used
                    .map(s => ((s.use_count ?? 1) > 1 ? `${s.name}×${s.use_count}` : s.name))
                    .join(' ')}
                </span>
              )}
              {log.loot?.item && (
                <span
                  style={{ color: QUALITY_COLORS[log.loot.item.quality] }}
                  className="font-semibold"
                >
                  🎁 {log.loot.item.definition.name}
                </span>
              )}
            </div>
            {/* 战后药水：单独一行 */}
            {hasPotionAfter && (
              <div className="flex flex-wrap items-center gap-1 rounded px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm">
                <span className="font-semibold text-rose-500 dark:text-rose-400">🧪</span>
                <span className="text-rose-500 dark:text-rose-400">
                  {Object.entries(log.potion_used!.after!)
                    .map(([, data]) => `${data.name}(+${data.restored})`)
                    .join(' ')}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
