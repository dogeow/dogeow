'use client'

import { useGameStore } from '../../stores/gameStore'
import {
  type CombatLog as CombatLogType,
  type CombatMonster,
  type CombatResult,
  type SkillUsedEntry,
  type GameItem,
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
import { LogIn, Heart, Droplet } from 'lucide-react'
import { DIFFICULTY_OPTIONS, DIFFICULTY_COLORS } from '../character/CharacterSelect'

export function CombatPanel() {
  const currentMap = useGameStore(state => state.currentMap)
  const maps = useGameStore(state => state.maps)
  const enterMap = useGameStore(state => state.enterMap)
  const fetchMaps = useGameStore(state => state.fetchMaps)
  const teleportToMap = useGameStore(state => state.teleportToMap)
  const revive = useGameStore(state => state.revive)
  const isFighting = useGameStore(state => state.isFighting)
  const setShouldAutoCombat = useGameStore(state => state.setShouldAutoCombat)
  const stopCombat = useGameStore(state => state.stopCombat)
  const isLoading = useGameStore(state => state.isLoading)
  const combatLogs = useGameStore(state => state.combatLogs)
  const combatResult = useGameStore(state => state.combatResult)
  const currentCombatMonsterFromStatus = useGameStore(state => state.currentCombatMonsterFromStatus)
  const skills = useGameStore(state => state.skills)
  const character = useGameStore(state => state.character)
  const combatStats = useGameStore(state => state.combatStats)
  const currentHp = useGameStore(state => state.currentHp)
  const currentMana = useGameStore(state => state.currentMana)
  const enabledSkillIds = useGameStore(state => state.enabledSkillIds)
  const toggleEnabledSkill = useGameStore(state => state.toggleEnabledSkill)
  const inventory = useGameStore(state => state.inventory)
  const consumePotion = useGameStore(state => state.consumePotion)

  const [mapDropdownOpen, setMapDropdownOpen] = useState(false)
  const [dropdownAct, setDropdownAct] = useState(1)
  const mapDropdownRef = useRef<HTMLDivElement>(null)
  const [showDeathDialog, setShowDeathDialog] = useState(false)
  const lastAutoStoppedRef = useRef<boolean | undefined>(undefined)

  // 监听战斗结果，检测角色死亡
  useEffect(() => {
    if (combatResult?.auto_stopped && lastAutoStoppedRef.current !== combatResult.auto_stopped) {
      lastAutoStoppedRef.current = combatResult.auto_stopped
      // 使用 queueMicrotask 延迟 setState，避免 effect 中同步调用
      queueMicrotask(() => {
        setShowDeathDialog(true)
      })
    }
  }, [combatResult?.auto_stopped])

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

  // 刚注册角色进入战斗界面时，若无当前地图则默认进入第一张地图（按幕数、等级、id 排序）
  useEffect(() => {
    if (!character || currentMap) return
    let cancelled = false
    const ensureFirstMap = async () => {
      if (maps.length === 0) await fetchMaps()
      if (cancelled) return
      const state = useGameStore.getState()
      if (state.currentMap || state.maps.length === 0) return
      const sorted = [...state.maps].sort(
        (a, b) => (a.act !== b.act ? a.act - b.act : 0) || a.id - b.id
      )
      const first = sorted[0]
      if (first) await enterMap(first.id)
    }
    ensureFirstMap()
    return () => {
      cancelled = true
    }
  }, [character, currentMap, maps.length, fetchMaps, enterMap])

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

  useEffect(() => {
    if (!character?.id || !currentMap?.id || isLoading || isFighting || (currentHp ?? 0) <= 0)
      return
    setShouldAutoCombat(true)
  }, [character?.id, currentMap?.id, isLoading, isFighting, currentHp, setShouldAutoCombat])

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
  // skill_cooldowns 是技能冷却到期的回合号，需要减去当前回合数得到剩余冷却
  const currentRound = combatResult?.rounds ?? 0
  const skillCooldowns = useMemo(() => {
    const cooldowns = combatResult?.skill_cooldowns ?? {}
    const result: Record<number, number> = {}
    for (const [skillId, endRound] of Object.entries(cooldowns)) {
      const remaining = (endRound as number) - currentRound
      result[Number(skillId)] = remaining > 0 ? remaining : 0
    }
    return result
  }, [combatResult?.skill_cooldowns, currentRound])

  const handleStartCombat = async () => {
    setShouldAutoCombat(true)
  }

  // 角色死亡时，点击只是复活，不自动开始战斗
  const handleRevive = async () => {
    await revive()
  }

  const handleStopCombat = async () => {
    await stopCombat()
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 地图选择器 */}
      {currentMap && (
        <div className="relative w-full" ref={mapDropdownRef}>
          <div className="flex items-center justify-between rounded-lg bg-black/70 px-3 py-2">
            <button
              type="button"
              onClick={() => setMapDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 text-sm font-medium text-white"
            >
              <span>{currentMap?.name ?? '选择地图'}</span>
              {character && character.difficulty_tier != null && character.difficulty_tier >= 0 && (
                <span
                  className={`rounded ${DIFFICULTY_COLORS[character.difficulty_tier] || 'bg-green-600'} px-1.5 py-0.5 text-xs`}
                >
                  {DIFFICULTY_OPTIONS.find(o => o.tier === character.difficulty_tier)?.label ??
                    '普通'}
                </span>
              )}
              <span className="text-xs">{mapDropdownOpen ? '▲' : '▼'}</span>
            </button>
          </div>
          {/* 下拉内容 */}
          {mapDropdownOpen && (
            <div className="absolute top-full right-0 left-0 z-20 mt-1 flex max-h-[70vh] min-h-64 w-full rounded-lg bg-black/90">
              {/* 左侧：幕数列表 */}
              <div className="flex w-16 shrink-0 flex-col overflow-y-auto border-r border-white/10">
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
                    <button
                      key={map.id}
                      type="button"
                      onClick={() => {
                        if (!isCurrentMap) {
                          handleSelectMap(map.id)
                          setMapDropdownOpen(false)
                        }
                      }}
                      disabled={isCurrentMap}
                      className={`mb-2 flex w-full items-center gap-3 rounded-lg p-2 text-left transition-all ${
                        isCurrentMap ? 'ring-primary ring-2' : 'hover:bg-white/10'
                      }`}
                      style={getMapBackgroundStyle(map, { fill: true })}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{map.name}</span>
                          {isCurrentMap && <span className="text-primary text-xs">(当前)</span>}
                        </div>
                        <div className="text-xs text-gray-400">怪物 {levelText}</div>
                        {map.monsters?.length ? (
                          <div className="mt-1 flex gap-1">
                            {map.monsters.slice(0, 4).map(m => (
                              <MapCardMonsterAvatar key={m.id} monsterId={m.id} name={m.name} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                      {/* 进入按钮 */}
                      {!isCurrentMap && (
                        <div className="flex shrink-0 items-center justify-center rounded-full bg-green-600/80 p-2 hover:bg-green-500">
                          <LogIn className="h-4 w-4 text-white" />
                        </div>
                      )}
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
                <div className="absolute inset-0">
                  <BattleArena
                    character={
                      character
                        ? { name: character.name, class: character.class, level: character.level }
                        : null
                    }
                    combatStats={combatStats}
                    currentHp={currentHp}
                    currentMana={currentMana}
                    monster={
                      combatResult?.monster ?? currentCombatMonsterFromStatus?.monster ?? null
                    }
                    monsterId={
                      combatResult?.monster_id ??
                      currentCombatMonsterFromStatus?.monsterId ??
                      character?.combat_monster_id ??
                      undefined
                    }
                    monsterHpBeforeRound={combatResult?.monster_hp_before_round}
                    monsters={combatResult?.monsters ?? currentCombatMonsterFromStatus?.monsters}
                    isFighting={isFighting}
                    isLoading={isLoading}
                    // 角色死亡时(isFighting可能是true但currentHp<=0)，点击只是复活，不自动开始战斗
                    onCombatToggle={
                      isFighting
                        ? (currentHp ?? 0) > 0
                          ? handleStopCombat
                          : handleRevive
                        : handleStartCombat
                    }
                    skillUsed={combatResult?.skills_used?.[0]}
                    skillTargetPositions={combatResult?.skill_target_positions}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 技能栏（有地图时显示） */}
        {currentMap && activeSkills.length > 0 && (
          <div className="mt-3 overflow-visible pt-3">
            <div className="min-w-0">
              <p className="text-muted-foreground mb-2 text-xs font-medium sm:text-sm">技能</p>
              <div className="overflow-visible">
                <BattleSkillBar
                  activeSkills={activeSkills}
                  skillsUsed={combatResult?.skills_used}
                  skillCooldowns={skillCooldowns}
                  enabledSkillIds={enabledSkillIds}
                  onSkillToggle={toggleEnabledSkill}
                  disabled={showDeathDialog}
                />
              </div>
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

      {/* 死亡弹窗 */}
      {showDeathDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="border-border bg-card w-full max-w-sm rounded-lg border p-6 text-center shadow-xl">
            <div className="mb-4 text-5xl">💀</div>
            <h3 className="text-foreground mb-2 text-xl font-bold">角色已死亡</h3>
            <p className="text-muted-foreground mb-6">你的角色在战斗中不幸阵亡，战斗已自动停止。</p>
            <div className="space-y-3">
              <button
                onClick={async () => {
                  // 复活：切换到第一个地图（新手营地）
                  if (maps.length === 0) {
                    await fetchMaps()
                  }
                  // 获取排序后的第一个地图
                  const sorted = [...maps].sort(
                    (a, b) => (a.act !== b.act ? a.act - b.act : 0) || a.id - b.id
                  )
                  const firstMap = sorted[0]
                  if (firstMap) {
                    await teleportToMap(firstMap.id)
                  }
                  setShowDeathDialog(false)
                }}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg py-2.5 font-medium"
              >
                复活
              </button>
              <button
                onClick={() => setShowDeathDialog(false)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg py-2.5 font-medium"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 药品按钮组件 */
function PotionButton({
  type,
  inventory,
  onUse,
  disabled,
}: {
  type: 'hp' | 'mp'
  inventory: GameItem[]
  onUse: (itemId: number) => Promise<void>
  disabled: boolean
}) {
  // 获取对应类型的药品，按恢复量排序（高级优先）
  const potions = useMemo(() => {
    const statKey = type === 'hp' ? 'max_hp' : 'max_mana'
    return inventory
      .filter(item => item.definition?.type === 'potion' && item.definition?.sub_type === type)
      .sort((a, b) => {
        const aRestore = a.definition?.base_stats?.[statKey] ?? 0
        const bRestore = b.definition?.base_stats?.[statKey] ?? 0
        return bRestore - aRestore
      })
  }, [inventory, type])

  const bestPotion = potions[0]
  const quantity = bestPotion?.quantity ?? 0
  const restoreValue =
    bestPotion?.definition?.base_stats?.[type === 'hp' ? 'max_hp' : 'max_mana'] ?? 0

  const handleClick = useCallback(() => {
    if (bestPotion && quantity > 0 && !disabled) {
      onUse(bestPotion.id)
    }
  }, [bestPotion, quantity, disabled, onUse])

  const Icon = type === 'hp' ? Heart : Droplet
  const colorClass =
    type === 'hp' ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400'
  const bgClass =
    type === 'hp' ? 'bg-red-500/20 hover:bg-red-500/30' : 'bg-blue-500/20 hover:bg-blue-500/30'

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || quantity === 0}
      className={`flex flex-col items-center gap-0.5 rounded-md p-2 transition-colors disabled:opacity-50 ${bgClass}`}
      title={
        bestPotion
          ? `${bestPotion.definition?.name} (+${restoreValue})`
          : `无${type === 'hp' ? '血' : '魔'}药`
      }
    >
      <Icon className={`h-5 w-5 ${colorClass}`} />
      <span className={`text-xs font-medium ${colorClass}`}>{quantity}</span>
    </button>
  )
}
