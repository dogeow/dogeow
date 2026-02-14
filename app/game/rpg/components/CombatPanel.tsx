'use client'

import { useGameStore } from '../stores/gameStore'
import { CopperDisplay } from './CopperDisplay'
import {
  QUALITY_COLORS,
  type CombatLog as CombatLogType,
  type CombatResult,
  type SkillUsedEntry,
} from '../types'
import { useMemo, useState, useEffect, useRef } from 'react'
import type { CharacterSkill } from '../types'

function MapInfo({ currentMap }: { currentMap: any }) {
  if (!currentMap) {
    return <p className="text-muted-foreground text-sm">尚未进入任何地图</p>
  }
  return (
    <div>
      <p className="text-base font-bold text-green-600 sm:text-lg dark:text-green-400">
        {currentMap.name}
      </p>
      <p className="text-muted-foreground text-xs sm:text-sm">{currentMap.description}</p>
      <p className="text-muted-foreground/80 text-xs">
        等级范围: Lv.{currentMap.min_level}-{currentMap.max_level}
      </p>
    </div>
  )
}

function CombatButton({
  currentMap,
  isFighting,
  isLoading,
  onStart,
  onStop,
}: {
  currentMap: any
  isFighting: boolean
  isLoading: boolean
  onStart: () => void
  onStop: () => void
}) {
  if (!currentMap) return null
  if (!isFighting)
    return (
      <button
        onClick={onStart}
        disabled={isLoading}
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
      >
        ⚔️ 开始挂机
      </button>
    )
  return (
    <button
      onClick={onStop}
      disabled={isLoading}
      className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-50 sm:px-6 sm:py-3 sm:text-base"
    >
      停止挂机
    </button>
  )
}

/** 战斗对阵：左侧用户，右侧怪物；支持先显示怪物再扣血（monsterHpBeforeRound） */
function BattleArena({
  character,
  combatStats,
  currentHp,
  currentMana,
  monster,
  monsterHpBeforeRound,
}: {
  character: { name: string; class: string; level: number } | null
  combatStats: { max_hp: number; max_mana: number } | null
  currentHp: number | null
  currentMana: number | null
  monster: { name: string; type: string; level: number; hp?: number; max_hp?: number } | null
  monsterHpBeforeRound?: number
}) {
  const finalMonsterHp = monster?.hp ?? 0
  const maxHp = monster?.max_hp ?? 0
  const [displayMonsterHp, setDisplayMonsterHp] = useState<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 优先用「本回合开始前」血量，这样首帧就是从满血（或回合初）再动画到扣血后
  const effectiveMonsterHp = displayMonsterHp ?? monsterHpBeforeRound ?? finalMonsterHp

  useEffect(() => {
    if (monster == null || maxHp <= 0) {
      const raf = requestAnimationFrame(() => setDisplayMonsterHp(null))
      rafRef.current = raf
      return () => cancelAnimationFrame(raf)
    }
    const before = monsterHpBeforeRound ?? finalMonsterHp
    const raf = requestAnimationFrame(() => {
      setDisplayMonsterHp(before)
      if (before !== finalMonsterHp) {
        const t = setTimeout(() => setDisplayMonsterHp(finalMonsterHp), 150)
        timeoutRef.current = t
      }
    })
    rafRef.current = raf
    return () => {
      cancelAnimationFrame(raf)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [monster?.name, monster?.level, finalMonsterHp, maxHp, monsterHpBeforeRound, monster])

  const hpPercent = combatStats?.max_hp
    ? Math.min(100, Math.max(0, ((currentHp ?? 0) / combatStats.max_hp) * 100))
    : 0
  const manaPercent = combatStats?.max_mana
    ? Math.min(100, Math.max(0, ((currentMana ?? 0) / combatStats.max_mana) * 100))
    : 0

  return (
    <div className="border-border bg-muted/30 flex items-stretch gap-3 rounded-lg border p-3 sm:gap-4 sm:p-4">
      {/* 左侧：用户 */}
      <div className="bg-card border-border flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 sm:p-4">
        <div className="text-muted-foreground text-xs font-medium sm:text-sm">我方</div>
        <div className="bg-primary/20 text-primary flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold sm:h-14 sm:w-14 sm:text-xl">
          {character?.name?.charAt(0) ?? '?'}
        </div>
        <div className="text-center">
          <p className="text-foreground font-medium">{character?.name ?? '—'}</p>
          <p className="text-muted-foreground text-xs">
            Lv.{character?.level ?? '?'} {character?.class ?? ''}
          </p>
        </div>
        {combatStats && (
          <div className="w-full space-y-1">
            <div className="text-muted-foreground flex justify-between text-[10px] sm:text-xs">
              <span>HP</span>
              <span>
                {currentHp ?? 0} / {combatStats.max_hp}
              </span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-red-500 transition-[width] duration-300"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
            <div className="text-muted-foreground flex justify-between text-[10px] sm:text-xs">
              <span>MP</span>
              <span>
                {currentMana ?? 0} / {combatStats.max_mana}
              </span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-blue-500 transition-[width] duration-300"
                style={{ width: `${manaPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* VS 分隔 */}
      <div className="text-muted-foreground flex shrink-0 items-center text-lg font-bold sm:text-xl">
        VS
      </div>

      {/* 右侧：怪物 */}
      <div className="bg-card border-border flex flex-1 flex-col items-center gap-2 rounded-lg border p-3 sm:p-4">
        <div className="text-muted-foreground text-xs font-medium sm:text-sm">敌方</div>
        <div className="bg-destructive/20 flex h-12 w-12 items-center justify-center rounded-full text-lg sm:h-14 sm:w-14 sm:text-xl">
          {monster?.name?.charAt(0) ?? '?'}
        </div>
        <div className="text-center">
          <p className="text-foreground font-medium">{monster?.name ?? '—'}</p>
          <p className="text-muted-foreground text-xs">
            Lv.{monster?.level ?? '?'} {monster?.type ?? ''}
          </p>
        </div>
        {monster && monster.max_hp != null && (
          <div className="w-full space-y-1">
            <div className="text-muted-foreground flex justify-between text-[10px] sm:text-xs">
              <span>HP</span>
              <span>
                {effectiveMonsterHp} / {monster.max_hp}
              </span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-amber-600 transition-[width] duration-300"
                style={{
                  width: `${monster.max_hp > 0 ? Math.min(100, Math.max(0, (effectiveMonsterHp / monster.max_hp) * 100)) : 0}%`,
                }}
              />
            </div>
          </div>
        )}
        {(!monster || monster.max_hp == null) && (
          <div className="text-muted-foreground flex-1 text-xs">战斗中</div>
        )}
      </div>
    </div>
  )
}

/** 技能图标：优先 emoji/icon，否则取首字 */
function SkillIcon({ icon, name }: { icon?: string | null; name: string }) {
  const display = icon && icon.length <= 4 ? icon : name && name[0] ? name[0] : '?'
  return (
    <span className="bg-muted flex h-8 w-8 items-center justify-center rounded text-base sm:h-9 sm:w-9">
      {display}
    </span>
  )
}

/** 战斗技能栏：显示主动技能图标、CD 冷却、点击启用/关闭 */
function BattleSkillBar({
  activeSkills,
  skillsUsed,
  cooldownSecondsBySkillId,
  skillCooldownEnd,
  now,
  enabledSkillIds,
  onSkillToggle,
}: {
  activeSkills: CharacterSkill[]
  skillsUsed: SkillUsedEntry[] | undefined
  cooldownSecondsBySkillId: Record<number, number>
  skillCooldownEnd: Record<number, number>
  now: number
  enabledSkillIds: number[]
  onSkillToggle: (skillId: number) => void
}) {
  if (activeSkills.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {activeSkills.map(cs => {
        const def = cs.skill
        const endAt = skillCooldownEnd[def.id] ?? 0
        const totalMs = (cooldownSecondsBySkillId[def.id] ?? def.cooldown) * 1000
        const remaining = Math.max(0, endAt - now)
        const progress = totalMs > 0 ? 1 - remaining / totalMs : 1
        const onCooldown = remaining > 0
        const enabled = enabledSkillIds.includes(def.id)
        const buttonContent = (
          <>
            <div className="relative">
              <SkillIcon icon={def.icon} name={def.name} />
              {onCooldown && (
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden rounded bg-black/50"
                  aria-hidden
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-black/70 transition-[height] duration-150"
                    style={{ height: `${(1 - progress) * 100}%` }}
                  />
                  <span className="relative z-10 text-xs font-bold text-white drop-shadow">
                    {(remaining / 1000).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            <span className="text-muted-foreground max-w-[3rem] truncate text-[10px] sm:max-w-[4rem] sm:text-xs">
              {def.name}
            </span>
          </>
        )
        return enabled ? (
          <div key={cs.id} className="skill-marquee-wrap">
            <svg className="skill-marquee-border" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="1" y="1" width="98" height="98" rx="10" ry="10" />
            </svg>
            <button
              type="button"
              className="skill-marquee-btn bg-muted/50 hover:bg-muted/80 focus-visible:ring-ring flex flex-col items-center gap-0.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2"
              title={`${def.name} 已启用（再点关闭）`}
              onClick={() => onSkillToggle(def.id)}
            >
              {buttonContent}
            </button>
          </div>
        ) : (
          <button
            key={cs.id}
            type="button"
            className="hover:bg-muted/80 focus-visible:ring-ring relative flex flex-col items-center gap-0.5 rounded-md transition-colors focus:outline-none focus-visible:ring-2"
            title={`${def.name} 点击启用`}
            onClick={() => onSkillToggle(def.id)}
          >
            {buttonContent}
          </button>
        )
      })}
    </div>
  )
}

function CombatLogList({ logs }: { logs: (CombatResult | CombatLogType)[] }) {
  const maxLogs = useMemo(() => logs.slice(0, 50), [logs])
  if (!logs || logs.length === 0) {
    return <p className="text-muted-foreground py-4 text-center text-sm">暂无战斗记录</p>
  }
  return (
    <>
      {maxLogs.map((log, index) => (
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
            {log.monster?.name ?? '?'} Lv.{log.monster?.level ?? '?'}
          </span>
          <span className="text-orange-500 dark:text-orange-400">{log.damage_dealt}</span>
          <span className="text-purple-500 dark:text-purple-400">+{log.experience_gained}</span>
          {(log.copper_gained ?? 0) > 0 && (
            <span className="inline-flex items-center text-yellow-600 dark:text-yellow-400">
              +<CopperDisplay copper={log.copper_gained} size="sm" />
            </span>
          )}
          {log.skills_used && log.skills_used.length > 0 && (
            <span className="text-cyan-600 dark:text-cyan-400">
              释放:{' '}
              {log.skills_used
                .map(s => (s.use_count > 1 ? `${s.name}×${s.use_count}` : s.name))
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
      ))}
    </>
  )
}

export function CombatPanel() {
  const {
    currentMap,
    startCombat,
    isFighting,
    setShouldAutoCombat,
    stopCombat,
    isLoading,
    combatLogs,
    combatResult,
    skills,
    character,
    combatStats,
    currentHp,
    currentMana,
    enabledSkillIds,
    toggleEnabledSkill,
  } = useGameStore()

  const activeSkills = useMemo(() => skills.filter(s => s.skill?.type === 'active'), [skills])
  const cooldownSecondsBySkillId = useMemo(() => {
    const m: Record<number, number> = {}
    activeSkills.forEach(s => {
      if (s.skill) m[s.skill.id] = s.skill.cooldown
    })
    return m
  }, [activeSkills])

  const [skillCooldownEnd, setSkillCooldownEnd] = useState<Record<number, number>>({})
  const [now, setNow] = useState(0)

  // 根据战斗结果刷新技能 CD 结束时间（后端 cooldown 单位为回合，前端按 1 回合=1 秒展示）
  useEffect(() => {
    const used = combatResult?.skills_used
    if (!used?.length) return
    const raf = requestAnimationFrame(() => {
      setSkillCooldownEnd(prev => {
        const next = { ...prev }
        used.forEach((u: SkillUsedEntry) => {
          const sec = cooldownSecondsBySkillId[u.skill_id] ?? 3
          next[u.skill_id] = Date.now() + sec * 1000
        })
        return next
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [combatResult?.combat_log_id, combatResult?.skills_used, cooldownSecondsBySkillId])

  // 定时刷新以更新 CD 数字与遮罩，并在 CD 结束后清理
  useEffect(() => {
    const hasActive = Object.values(skillCooldownEnd).some(end => end > Date.now())
    if (!hasActive) return
    const raf = requestAnimationFrame(() => setNow(Date.now()))
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      setSkillCooldownEnd(prev => {
        const next = { ...prev }
        let changed = false
        for (const k of Object.keys(next)) {
          if (next[Number(k)] <= t) {
            delete next[Number(k)]
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 200)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(id)
    }
  }, [skillCooldownEnd])

  const handleStartCombat = async () => {
    await startCombat()
    setShouldAutoCombat(true)
  }

  const handleStopCombat = async () => {
    await stopCombat()
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
            <MapInfo currentMap={currentMap} />
          </div>
          <CombatButton
            currentMap={currentMap}
            isFighting={isFighting}
            isLoading={isLoading}
            onStart={handleStartCombat}
            onStop={handleStopCombat}
          />
        </div>
        {/* 用户 vs 怪物（战斗时或最近一次战斗结果） */}
        {(isFighting || combatResult) && (
          <div className="border-border mt-3 border-t pt-3">
            <BattleArena
              character={
                character
                  ? { name: character.name, class: character.class, level: character.level }
                  : null
              }
              combatStats={combatStats}
              currentHp={currentHp}
              currentMana={currentMana}
              monster={combatResult?.monster ?? null}
              monsterHpBeforeRound={combatResult?.monster_hp_before_round}
            />
          </div>
        )}
        {/* 战斗中的技能栏：图标 + CD 冷却动画 */}
        {isFighting && activeSkills.length > 0 && (
          <div className="border-border mt-3 overflow-visible border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium sm:text-sm">
              技能（点击启用，自动战斗时使用）
            </p>
            <div className="overflow-visible">
              <BattleSkillBar
                activeSkills={activeSkills}
                skillsUsed={combatResult?.skills_used}
                cooldownSecondsBySkillId={cooldownSecondsBySkillId}
                skillCooldownEnd={skillCooldownEnd}
                now={now}
                enabledSkillIds={enabledSkillIds}
                onSkillToggle={toggleEnabledSkill}
              />
            </div>
          </div>
        )}
      </div>

      {/* 战斗日志 */}
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <h4 className="text-foreground mb-3 text-base font-medium sm:mb-4 sm:text-lg">战斗日志</h4>
        <div className="max-h-64 space-y-1 overflow-y-auto sm:max-h-80 sm:space-y-1.5">
          <CombatLogList logs={combatLogs} />
        </div>
      </div>
    </div>
  )
}
