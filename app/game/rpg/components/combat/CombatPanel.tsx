'use client'

import { useGameStore } from '../../stores/gameStore'
import {
  type CombatLog as CombatLogType,
  type CombatMonster,
  type CombatResult,
  type SkillUsedEntry,
} from '../../types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CharacterSkill, SkillWithLearnedState } from '../../types'
import type { MapDefinition } from '../../types'
import { getMapBackgroundStyle } from '../../utils/mapBackground'
import { BattleArena } from './BattleArena'
import { BattleSkillBar } from './BattleSkillBar'
import { CombatLogList } from './CombatLogList'
import { getActName } from '../../utils/combat'
import { MapCardMonsterAvatar } from './MapCardMonsterAvatar'

export function CombatPanel() {
  const currentMap = useGameStore(state => state.currentMap)
  const maps = useGameStore(state => state.maps)
  const mapProgress = useGameStore(state => state.mapProgress)
  const enterMap = useGameStore(state => state.enterMap)
  const fetchMaps = useGameStore(state => state.fetchMaps)
  const startCombat = useGameStore(state => state.startCombat)
  const isFighting = useGameStore(state => state.isFighting)
  const setShouldAutoCombat = useGameStore(state => state.setShouldAutoCombat)
  const stopCombat = useGameStore(state => state.stopCombat)
  const isLoading = useGameStore(state => state.isLoading)
  const combatLogs = useGameStore(state => state.combatLogs)
  const combatResult = useGameStore(state => state.combatResult)
  const skills = useGameStore(state => state.skills)
  const character = useGameStore(state => state.character)
  const combatStats = useGameStore(state => state.combatStats)
  const currentHp = useGameStore(state => state.currentHp)
  const currentMana = useGameStore(state => state.currentMana)
  const enabledSkillIds = useGameStore(state => state.enabledSkillIds)
  const toggleEnabledSkill = useGameStore(state => state.toggleEnabledSkill)

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

  const learnedSkills = useMemo((): CharacterSkill[] => {
    const c = character
    if (!c) return []
    return skills
      .filter(
        (s): s is SkillWithLearnedState & { character_skill_id: number } =>
          s.is_learned && s.character_skill_id != null
      )
      .map(s => ({
        id: s.character_skill_id!,
        character_id: c.id,
        skill_id: s.id,
        skill: s,
        level: s.level ?? 1,
        slot_index: s.slot_index ?? null,
      }))
  }, [skills, character])

  const activeSkills = useMemo(
    () => learnedSkills.filter(s => s.skill?.type === 'active'),
    [learnedSkills]
  )
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
      {/* 地图选择器 */}
      {currentMap && (
        <div className="relative" ref={mapDropdownRef}>
          <div className="flex items-center justify-between rounded-lg bg-black/70 px-3 py-2">
            <button
              type="button"
              onClick={() => setMapDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 text-sm font-medium text-white"
            >
              <span>{currentMap?.name ?? '选择地图'}</span>
              <span className="text-xs">{mapDropdownOpen ? '▲' : '▼'}</span>
            </button>
          </div>
          {/* 下拉内容 */}
          {mapDropdownOpen && (
            <div className="absolute top-full left-0 z-20 mt-1 flex h-64 w-80 rounded-lg bg-black/90">
              {/* 左侧：幕数列表 */}
              <div className="flex w-16 flex-col overflow-y-auto border-r border-white/10">
                {actOrder.map(actNum => (
                  <button
                    key={actNum}
                    type="button"
                    onClick={() => setDropdownAct(actNum)}
                    className={`flex h-12 shrink-0 items-center justify-center border-b border-white/10 text-xs ${
                      effectiveAct === actNum
                        ? 'bg-primary text-white'
                        : 'text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {getActName(actNum)}
                  </button>
                ))}
              </div>
              {/* 右侧：地图列表 */}
              <div className="flex-1 overflow-y-auto p-2">
                {displayActMaps.map(map => {
                  const isCurrentMap = currentMap?.id === map.id
                  const canEnter = !!character && character.level >= map.min_level
                  return (
                    <button
                      key={map.id}
                      type="button"
                      onClick={() => {
                        if (canEnter) {
                          handleSelectMap(map.id)
                          setMapDropdownOpen(false)
                        }
                      }}
                      disabled={!canEnter}
                      className={`mb-2 flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all ${
                        isCurrentMap
                          ? 'ring-primary ring-2'
                          : canEnter
                            ? 'hover:bg-white/10'
                            : 'opacity-50'
                      }`}
                      style={getMapBackgroundStyle(map, { fill: true })}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{map.name}</span>
                          {isCurrentMap && <span className="text-primary text-xs">(当前)</span>}
                        </div>
                        <div className="text-xs text-gray-400">
                          Lv.{map.min_level}-{map.max_level}
                        </div>
                        {map.monsters?.length ? (
                          <div className="mt-1 flex gap-1">
                            {map.monsters.slice(0, 4).map(m => (
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
          )}
        </div>
      )}

      {/* 战斗区域：有地图时显示，VS 处点击开始/停止挂机 */}
      <div className="border-border bg-card rounded-lg border p-2 sm:p-3">
        {/* 用户 vs 怪物（仅此区域显示地图背景，区域 1:1 比例） */}
        {currentMap && (
          <div className="border-border">
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
                  monsters={combatResult?.monsters}
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
          <div className="mt-3 overflow-visible pt-3">
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
