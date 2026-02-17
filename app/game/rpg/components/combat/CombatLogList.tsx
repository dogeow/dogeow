'use client'

import {
  QUALITY_COLORS,
  QUALITY_NAMES,
  STAT_NAMES,
  type CombatLog as CombatLogType,
  type CombatResult,
  type GameItem,
} from '../../types'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { CopperDisplay } from '../shared/CopperDisplay'
import { getItemDisplayName } from '../../utils/itemUtils'

function ItemTipIcon({ item, className }: { item: GameItem; className?: string }) {
  const definitionId = item.definition?.id
  const src = definitionId != null ? `/game/rpg/items/item_${definitionId}.png` : ''
  const [useImg, setUseImg] = useState(definitionId != null)

  return (
    <div
      className={`relative flex h-14 w-14 items-center justify-center rounded-md bg-black/30 sm:h-16 sm:w-16 ${className}`}
    >
      {useImg && src ? (
        <Image
          src={src}
          alt=""
          fill
          className="rounded object-cover"
          sizes="64px"
          onError={() => setUseImg(false)}
        />
      ) : (
        <span className="text-3xl sm:text-4xl">{item.definition?.icon || '📦'}</span>
      )}
    </div>
  )
}

function ItemDetailDialog({ item, onClose }: { item: GameItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-card border-border max-w-[85vw] rounded-lg border shadow-xl"
        onClick={e => e.stopPropagation()}
        style={{ width: '320px' }}
      >
        <div className="flex flex-col">
          <div
            className="relative flex gap-3 p-3"
            style={{
              background: `linear-gradient(135deg, ${QUALITY_COLORS[item.quality]}20 0%, ${QUALITY_COLORS[item.quality]}10 100%)`,
              borderBottom: `1px solid ${QUALITY_COLORS[item.quality]}30`,
            }}
          >
            <ItemTipIcon item={item} className="shrink-0 drop-shadow-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h5
                    className="min-w-0 text-sm leading-tight font-bold break-words sm:text-base"
                    style={{ color: QUALITY_COLORS[item.quality] }}
                  >
                    {getItemDisplayName(item)}
                  </h5>
                  <span className="text-xs" style={{ color: QUALITY_COLORS[item.quality] }}>
                    {QUALITY_NAMES[item.quality]}
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground ml-1 shrink-0 p-1"
                >
                  ✕
                </button>
              </div>
              <div className="mt-1 space-y-0.5 text-xs">
                {Object.entries(item.stats || {}).map(([stat, value]) => (
                  <p key={stat} className="text-green-600 dark:text-green-400">
                    +{value} {STAT_NAMES[stat] || stat}
                  </p>
                ))}
                {item.affixes?.map((affix, i) => (
                  <p key={i} className="text-blue-600 dark:text-blue-400">
                    {Object.entries(affix)
                      .map(([k, v]) => `+${v} ${STAT_NAMES[k] || k}`)
                      .join(', ')}
                  </p>
                ))}
                <p className="text-muted-foreground">
                  需求等级: {item.definition?.required_level ?? '—'}
                </p>
                {item.sell_price != null && item.sell_price > 0 && (
                  <p className="text-yellow-600 dark:text-yellow-400">
                    卖出: <CopperDisplay copper={item.sell_price} size="xs" nowrap />
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CombatLogList({ logs }: { logs: (CombatResult | CombatLogType)[] }) {
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
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
                <button
                  type="button"
                  style={{ color: QUALITY_COLORS[log.loot.item.quality] }}
                  className="cursor-pointer font-semibold hover:underline"
                  onClick={() => setSelectedItem(log.loot!.item!)}
                >
                  🎁 {log.loot.item.definition.name}
                </button>
              )}
              {log.loot?.potion && (
                <button
                  type="button"
                  className="cursor-pointer font-semibold text-rose-500 hover:underline dark:text-rose-400"
                  onClick={() => setSelectedItem(log.loot!.potion!)}
                >
                  🧪 {log.loot.potion.definition.name}
                </button>
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
      {selectedItem && (
        <ItemDetailDialog item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </>
  )
}
