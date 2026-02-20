'use client'

import {
  QUALITY_COLORS,
  QUALITY_NAMES,
  STAT_NAMES,
  type CombatLog as CombatLogType,
  type CombatResult,
  type GameItem,
  type CombatLogDetail,
} from '../../types'
import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import { CopperDisplay } from '../shared/CopperDisplay'
import { getItemDisplayName } from '../../utils/itemUtils'
import { ItemDetailModal } from '@/components/game'
import { useGameStore } from '../../stores/gameStore'
import { X, Swords, Shield, Zap, Target, Skull, Award, Coins } from 'lucide-react'

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
    <ItemDetailModal
      isOpen={true}
      item={item}
      onClose={onClose}
      type="inventory"
      source="inventory"
    />
  )
}

/** 战斗日志详情弹窗 */
function CombatLogDetailDialog({ logId, onClose }: { logId: number; onClose: () => void }) {
  const { fetchCombatLogDetail, clearCombatLogDetail, combatLogDetail } = useGameStore()

  useEffect(() => {
    fetchCombatLogDetail(logId)
    return () => clearCombatLogDetail()
  }, [logId, fetchCombatLogDetail, clearCombatLogDetail])

  if (!combatLogDetail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-card border-border rounded-lg border p-6 text-center">
          <p className="text-muted-foreground">加载中...</p>
          <button onClick={onClose} className="text-primary mt-4 hover:underline">
            关闭
          </button>
        </div>
      </div>
    )
  }

  const d = combatLogDetail

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black/60 p-4">
      <div className="bg-card border-border relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border p-4 sm:p-6">
        <button
          onClick={onClose}
          className="hover:bg-muted absolute top-2 right-2 rounded-full p-1"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-foreground mb-4 flex items-center gap-2 text-lg font-bold">
          {d.victory
            ? '✅ 胜利'
            : d.experience_gained === 0 && d.copper_gained === 0
              ? '⚔️ 战斗中'
              : '💀 战败'}
          <span className="text-muted-foreground text-sm font-normal">
            {d.map?.name || '未知地图'}
          </span>
        </h3>

        {/* 角色属性 */}
        <div className="bg-muted/50 mb-4 rounded-lg p-3">
          <h4 className="text-muted-foreground mb-2 text-sm font-medium">
            角色属性 (Lv.{d.character?.level ?? '?'} {d.character?.class ?? '?'})
          </h4>
          {d.character?.attack != null ? (
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Swords className="h-4 w-4 text-red-500" />
                <span>攻击: {d.character.attack}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-4 w-4 text-blue-500" />
                <span>防御: {d.character.defense}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span>暴击: {d.character.crit_rate}%</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">暂无数据（旧日志）</p>
          )}
        </div>

        {/* 怪物属性 */}
        <div className="bg-muted/50 mb-4 rounded-lg p-3">
          <h4 className="text-muted-foreground mb-2 flex items-center gap-1 text-sm font-medium">
            <Skull className="h-4 w-4" />
            怪物信息 (Lv.{d.monster_stats?.level ?? '?'} {d.monster?.name ?? '?'})
          </h4>
          {d.monster_stats?.hp != null ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                HP: {d.monster_stats.hp}/{d.monster_stats.max_hp}
              </div>
              <div>攻击: {d.monster_stats.attack}</div>
              <div>防御: {d.monster_stats.defense}</div>
              <div>经验: {d.monster_stats.experience}</div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">暂无数据（旧日志）</p>
          )}
        </div>

        {/* 伤害详情 */}
        <div className="bg-muted/50 mb-4 rounded-lg p-3">
          <h4 className="text-muted-foreground mb-2 flex items-center gap-1 text-sm font-medium">
            <Target className="h-4 w-4" />
            伤害构成
          </h4>
          {d.damage_detail?.total != null ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>基础/技能伤害:</span>
                <span className="text-red-500">{d.damage_detail.base_attack}</span>
              </div>
              {d.damage_detail.skill_damage > 0 && (
                <div className="flex justify-between">
                  <span>技能额外伤害:</span>
                  <span className="text-orange-500">+{d.damage_detail.skill_damage}</span>
                </div>
              )}
              {d.damage_detail.crit_damage > 0 && (
                <div className="flex justify-between">
                  <span>暴击额外伤害:</span>
                  <span className="text-yellow-500">+{d.damage_detail.crit_damage}</span>
                </div>
              )}
              {d.damage_detail.aoe_damage > 0 && (
                <div className="flex justify-between">
                  <span>AOE减免:</span>
                  <span className="text-gray-500">-{d.damage_detail.aoe_damage}</span>
                </div>
              )}
              <div className="border-muted flex justify-between border-t pt-1 font-medium">
                <span>本回合总伤害:</span>
                <span className="text-red-500">{d.damage_detail.total}</span>
              </div>
              <div className="flex justify-between">
                <span>怪物防御减伤:</span>
                <span className="text-gray-500">{d.damage_detail.defense_reduction}%</span>
              </div>
              <div className="flex justify-between">
                <span>怪物反击伤害:</span>
                <span className="text-green-500">-{d.damage_detail.counter_damage}</span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">暂无数据（旧日志）</p>
          )}
        </div>

        {/* 战斗信息 */}
        <div className="bg-muted/50 mb-4 rounded-lg p-3">
          <h4 className="text-muted-foreground mb-2 text-sm font-medium">战斗信息</h4>
          {d.battle?.round != null ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>回合: {d.battle.round}</div>
              <div>存活: {d.battle.alive_count}只</div>
              <div>击杀: {d.battle.killed_count}只</div>
              <div>
                难度: {d.difficulty?.tier ?? 0} ({d.difficulty?.multiplier ?? 1}x)
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm italic">暂无数据（旧日志）</p>
          )}
        </div>

        {/* 收益 */}
        <div className="bg-muted/50 mb-4 rounded-lg p-3">
          <h4 className="text-muted-foreground mb-2 flex items-center gap-1 text-sm font-medium">
            <Award className="h-4 w-4" />
            收益
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-purple-500">+{d.experience_gained} 经验</span>
            </div>
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-500">+{d.copper_gained} 铜币</span>
            </div>
          </div>
        </div>

        {/* 使用的技能 */}
        {d.skills_used && d.skills_used.length > 0 && (
          <div className="bg-muted/50 mb-4 rounded-lg p-3">
            <h4 className="text-muted-foreground mb-2 text-sm font-medium">使用的技能</h4>
            <div className="flex flex-wrap gap-2">
              {d.skills_used.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-primary/20 text-primary rounded-full px-2 py-1 text-xs"
                >
                  {skill.name} ×{skill.use_count || 1}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CombatLogList({ logs }: { logs: (CombatResult | CombatLogType)[] }) {
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null)
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null)
  const maxLogs = useMemo(() => logs.slice(0, 50), [logs])

  // 获取日志ID的辅助函数 - 优先使用 id，因为 combat_log_id 可能不准确
  const getLogId = (log: CombatResult | CombatLogType, index: number): number | null => {
    // 优先使用 id 字段
    if ('id' in log && log.id) return log.id
    // 其次使用 combat_log_id
    if ('combat_log_id' in log && log.combat_log_id) return log.combat_log_id
    return null
  }

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
        // 没有回合概念，只显示战斗状态
        const isVictory = 'victory' in log && log.victory === true

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
            {/* 战斗日志主体 - 可点击 */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                const id = getLogId(log, index)
                if (id) setSelectedLogId(id)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  const id = getLogId(log, index)
                  if (id) setSelectedLogId(id)
                }
              }}
              className="hover:bg-muted/50 flex w-full cursor-pointer flex-wrap items-center gap-1 rounded px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
            >
              <span
                className={`font-semibold ${
                  isVictory
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-500 dark:text-orange-400'
                }`}
              >
                {isVictory ? '✅' : '⚔️'}
              </span>
              <span className="text-foreground">{log.monster?.name ?? '?'}</span>
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
      {selectedLogId && (
        <CombatLogDetailDialog logId={selectedLogId} onClose={() => setSelectedLogId(null)} />
      )}
    </>
  )
}
