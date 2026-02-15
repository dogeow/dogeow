'use client'

import { useGameStore } from '../stores/gameStore'
import { CopperDisplay } from './CopperDisplay'
import {
  QUALITY_COLORS,
  type CombatLog as CombatLogType,
  type CombatResult,
  type SkillUsedEntry,
} from '../types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import type { CharacterSkill } from '../types'
import type { MapDefinition } from '../types'
import { getMapBackgroundStyle } from '../utils/mapBackground'

const ACT_NAMES: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '七',
  8: '八',
}
function getActName(actNum: number): string {
  return `第${ACT_NAMES[actNum] ?? actNum}幕`
}

function MapCardMonsterAvatar({ monsterId, name }: { monsterId: number; name: string }) {
  const [useImg, setUseImg] = useState(true)
  return (
    <span
      className="bg-muted/80 relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 text-[10px] font-medium"
      title={name}
    >
      {useImg ? (
        <Image
          src={`/game/rpg/monsters/monster_${monsterId}.png`}
          alt=""
          fill
          className="object-cover"
          sizes="24px"
          onError={() => setUseImg(false)}
        />
      ) : (
        (name?.[0] ?? '?')
      )}
    </span>
  )
}

/** VS 区域：可点击的 emoji，未战斗静止、战斗中播放动画 */
function VSSwords({
  isFighting,
  isLoading,
  onToggle,
}: {
  isFighting: boolean
  isLoading: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      className="text-primary hover:text-primary/90 focus-visible:ring-ring flex shrink-0 flex-col items-center justify-center gap-0.5 transition-colors focus:outline-none focus-visible:ring-2 disabled:opacity-50"
      title={isFighting ? '停止挂机' : '开始挂机'}
      aria-label={isFighting ? '停止挂机' : '开始挂机'}
    >
      <span
        className={`text-3xl leading-none sm:text-4xl ${isFighting ? 'vs-emoji-fighting' : ''}`}
        aria-hidden
      >
        ⚔️
      </span>
      <span className="text-primary text-xs font-bold sm:text-sm">VS</span>
    </button>
  )
}

/** 怪物图标：有 monsterId 时优先用 /game/rpg/monsters/monster_{id}.png，失败则回退到首字；父组件用 key={monsterId} 以便切换怪物时重置 */
function MonsterIcon({ monsterId, name }: { monsterId?: number; name: string }) {
  const fallback = name && name[0] ? name[0] : '?'
  const src = monsterId != null ? `/game/rpg/monsters/monster_${monsterId}.png` : ''
  const [useImg, setUseImg] = useState(true)
  return (
    <span className="bg-destructive/20 relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full text-2xl sm:h-24 sm:w-24 sm:text-3xl">
      {useImg && src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="96px"
          onError={() => setUseImg(false)}
        />
      ) : (
        fallback
      )}
    </span>
  )
}

/** 战斗对阵：左侧用户，右侧怪物；支持先显示怪物再扣血（monsterHpBeforeRound）；中间 VS 可点击开始/停止挂机 */
function BattleArena({
  character,
  combatStats,
  currentHp,
  currentMana,
  monster,
  monsterId,
  monsterHpBeforeRound,
  isFighting,
  isLoading,
  onCombatToggle,
}: {
  character: { name: string; class: string; level: number } | null
  combatStats: { max_hp: number; max_mana: number } | null
  currentHp: number | null
  currentMana: number | null
  monster: { name: string; type: string; level: number; hp?: number; max_hp?: number } | null
  monsterId?: number
  monsterHpBeforeRound?: number
  isFighting: boolean
  isLoading: boolean
  onCombatToggle: () => void
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
    <div className="flex items-stretch gap-3 p-3 sm:gap-4 sm:p-4">
      {/* 左侧：用户 */}
      <div className="flex flex-1 flex-col items-center gap-2 p-3 sm:p-4">
        <div className="bg-primary/20 text-primary flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold sm:h-24 sm:w-24 sm:text-3xl">
          {character?.name?.charAt(0) ?? '?'}
        </div>
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-medium">{character?.name ?? '—'}</p>
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

      {/* VS 双剑：点击开始/停止挂机，战斗中播放交击动画 */}
      <VSSwords isFighting={isFighting} isLoading={isLoading} onToggle={onCombatToggle} />

      {/* 右侧：怪物 */}
      <div className="flex flex-1 flex-col items-center gap-2 p-3 sm:p-4">
        <MonsterIcon key={monsterId} monsterId={monsterId} name={monster?.name ?? ''} />
        <div className="text-center">
          <p className="text-muted-foreground text-sm font-medium">{monster?.name ?? '—'}</p>
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

/** 技能图标：有 skillId 时优先用 /game/rpg/skills/skill_{id}.png，加载失败则回退到 emoji/首字 */
function SkillIcon({
  icon,
  name,
  skillId,
}: {
  icon?: string | null
  name: string
  skillId?: number
}) {
  const fallback = icon && icon.length <= 4 ? icon : name && name[0] ? name[0] : '?'
  const [useImg, setUseImg] = useState(!!skillId)
  const src = skillId != null ? `/game/rpg/skills/skill_${skillId}.png` : ''
  return (
    <span className="bg-muted relative flex h-8 w-8 items-center justify-center overflow-hidden rounded text-base sm:h-9 sm:w-9">
      {useImg && src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="36px"
          onError={() => setUseImg(false)}
        />
      ) : (
        fallback
      )}
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
              <SkillIcon icon={def.icon} name={def.name} skillId={def.id} />
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
          className="flex flex-wrap items-center gap-1 rounded px-2 py-1 text-xs sm:gap-2 sm:px-3 sm:py-2 sm:text-sm"
        >
          <span
            className={`font-semibold ${log.victory ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
          >
            {log.victory ? '✓' : '✗'}
          </span>
          <span className="text-foreground">
            {log.monster?.name ?? '?'} Lv.{log.monster?.level ?? '?'}
          </span>
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
    maps,
    mapProgress,
    enterMap,
    fetchMaps,
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

  const [mapDropdownOpen, setMapDropdownOpen] = useState(false)
  const [dropdownAct, setDropdownAct] = useState(1)
  const mapDropdownRef = useRef<HTMLDivElement>(null)

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
  const effectiveAct = actOrder.includes(dropdownAct) ? dropdownAct : (actOrder[0] ?? 1)
  const displayActMaps = mapsByAct[effectiveAct] ?? []

  useEffect(() => {
    if (mapDropdownOpen && maps.length === 0) fetchMaps()
  }, [mapDropdownOpen, maps.length, fetchMaps])

  useEffect(() => {
    if (!mapDropdownOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (mapDropdownRef.current && !mapDropdownRef.current.contains(e.target as Node)) {
        setMapDropdownOpen(false)
      }
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [mapDropdownOpen])

  const handleSelectMap = useCallback(
    async (mapId: number) => {
      await enterMap(mapId)
      setMapDropdownOpen(false)
    },
    [enterMap]
  )

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
      {/* 战斗导航顶部：当前地图（带缩略图，点击展开下拉选择） */}
      <div className="relative" ref={mapDropdownRef}>
        <button
          type="button"
          onClick={() => setMapDropdownOpen(prev => !prev)}
          className="border-border hover:bg-muted/50 flex w-full items-stretch overflow-hidden rounded-lg border text-left transition-colors"
        >
          {currentMap ? (
            <>
              <div
                className="h-14 w-14 shrink-0 rounded-l-[calc(theme(borderRadius.lg)-1px)] sm:h-16 sm:w-16"
                style={getMapBackgroundStyle(currentMap, { useOrigin: true })}
              />
              <div className="text-foreground flex min-w-0 flex-1 flex-col justify-center px-3 py-2 sm:px-4">
                <span className="truncate text-sm font-medium text-green-600 sm:text-base dark:text-green-400">
                  {currentMap.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {currentMap.description}
                </span>
              </div>
              <span
                className="text-muted-foreground flex shrink-0 items-center pr-2 text-xs sm:pr-3"
                aria-hidden
              >
                {mapDropdownOpen ? '▲' : '▼'}
              </span>
            </>
          ) : (
            <>
              <div
                className="bg-muted/50 flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16"
                aria-hidden
              >
                <span className="text-muted-foreground text-xl">🗺️</span>
              </div>
              <span className="text-muted-foreground flex flex-1 items-center px-3 py-2 sm:px-4">
                选择地图
              </span>
              <span
                className="text-muted-foreground flex shrink-0 items-center pr-2 text-xs sm:pr-3"
                aria-hidden
              >
                ▼
              </span>
            </>
          )}
        </button>
        {mapDropdownOpen && (
          <div className="border-border bg-card absolute top-full right-0 left-0 z-50 mt-1 flex max-h-[70vh] overflow-hidden rounded-lg border shadow-lg">
            {actOrder.length > 0 ? (
              <>
                <div className="bg-muted/50 flex shrink-0 flex-col gap-1 overflow-y-auto p-1.5">
                  {actOrder.map(actNum => (
                    <button
                      key={actNum}
                      type="button"
                      onClick={() => setDropdownAct(actNum)}
                      className={`w-full rounded-md px-3 py-2 text-left text-xs font-medium whitespace-nowrap transition-colors sm:text-sm ${
                        effectiveAct === actNum
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {getActName(actNum)}
                    </button>
                  ))}
                </div>
                <div className="min-w-0 flex-1 overflow-y-auto p-2">
                  <div className="flex flex-col gap-2">
                    {displayActMaps.map(map => {
                      const isCurrentMap = currentMap?.id === map.id
                      const canEnter = !!character && character.level >= map.min_level
                      return (
                        <button
                          key={map.id}
                          type="button"
                          onClick={() => canEnter && handleSelectMap(map.id)}
                          disabled={!canEnter}
                          className={`relative min-h-[80px] w-full overflow-hidden rounded-lg border-2 text-left transition-all ${
                            isCurrentMap
                              ? 'border-primary'
                              : canEnter
                                ? 'border-border hover:border-primary'
                                : 'border-border opacity-60'
                          }`}
                          style={getMapBackgroundStyle(map, { fill: true })}
                        >
                          <div className="bg-black/50 p-2.5 sm:p-3">
                            <div className="mb-1 flex items-start justify-between">
                              <span className="text-foreground text-sm font-medium sm:text-base">
                                {map.name}
                              </span>
                              {isCurrentMap && (
                                <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">
                                  当前
                                </span>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-1 line-clamp-1 text-xs">
                              {map.description}
                            </p>
                            <p className="text-muted-foreground mb-1.5 text-xs">
                              Lv.{map.min_level}-{map.max_level}
                              {map.monsters?.length
                                ? ` · ${map.monsters.map(m => m.name).join('、')}`
                                : ''}
                            </p>
                            {map.monsters?.length ? (
                              <div className="flex flex-wrap gap-1">
                                {map.monsters.map(m => (
                                  <MapCardMonsterAvatar key={m.id} monsterId={m.id} name={m.name} />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground p-4 text-center text-sm">加载地图中…</p>
            )}
          </div>
        )}
      </div>

      {/* 战斗区域：有地图时显示，VS 处点击开始/停止挂机 */}
      <div className="border-border bg-card rounded-lg border p-2 sm:p-3">
        {/* 用户 vs 怪物（仅此区域显示地图背景，区域 1:1 比例） */}
        {currentMap && (
          <div className="border-border mt-3 border-t pt-3">
            <div
              className="relative aspect-square w-full overflow-hidden rounded-lg"
              style={
                currentMap
                  ? getMapBackgroundStyle(currentMap, { useOrigin: true, fill: true })
                  : undefined
              }
            >
              {currentMap && (
                <div className="absolute inset-0 rounded-lg bg-black/15" aria-hidden />
              )}
              <div className="relative flex h-full w-full items-center justify-center p-3 sm:p-4">
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
                  monsterId={combatResult?.monster_id ?? character?.combat_monster_id ?? undefined}
                  monsterHpBeforeRound={combatResult?.monster_hp_before_round}
                  isFighting={isFighting}
                  isLoading={isLoading}
                  onCombatToggle={isFighting ? handleStopCombat : handleStartCombat}
                />
              </div>
            </div>
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
