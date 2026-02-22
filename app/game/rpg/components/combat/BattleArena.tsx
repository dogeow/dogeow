'use client'

import { type CombatMonster, type SkillUsedEntry } from '../../types'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MonsterIcon } from './MonsterIcon'
import { MonsterGroup } from './MonsterGroup'
import { VSSwords } from './VSSwords'
import { SkillEffect, type SkillEffectType } from './effects'
import styles from '../../rpg.module.css'

/** 战斗对阵：上侧怪物（支持多只），下侧用户，中间 VS 可点击开始/停止挂机 */
export function BattleArena({
  character,
  combatStats,
  currentHp,
  currentMana,
  monster,
  monsterId,
  monsterHpBeforeRound,
  monsters,
  isFighting,
  isLoading,
  onCombatToggle,
  skillUsed,
  skillTargetPositions,
}: {
  character: { name: string; class: string; level: number } | null
  combatStats: { max_hp: number; max_mana: number } | null
  currentHp: number | null
  currentMana: number | null
  monster: { name: string; type: string; level: number; hp?: number; max_hp?: number } | null
  monsterId?: number
  monsterHpBeforeRound?: number
  monsters?: CombatMonster[]
  isFighting: boolean
  isLoading: boolean
  onCombatToggle: () => void
  skillUsed?: SkillUsedEntry | null
  skillTargetPositions?: number[]
}) {
  const finalMonsterHp = monster?.hp ?? 0
  const maxHp = monster?.max_hp ?? 0
  const [displayMonsterHp, setDisplayMonsterHp] = useState<number | null>(null)
  const rafRef = useRef<number | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingFinalHpRef = useRef<number>(finalMonsterHp)
  const lastSkillUsedRef = useRef<SkillUsedEntry | null>(null)
  const skillAnimationCompletedRef = useRef(false)

  // 技能动画未结束前不显示扣血，等 onComplete 后再更新
  const [showDamageAndHp, setShowDamageAndHp] = useState(true)

  // 检测怪物死亡
  const isMonsterDead = finalMonsterHp <= 0
  // 检测角色死亡
  const maxCharacterHp = combatStats?.max_hp ?? 0
  const isCharacterDead = (currentHp ?? 0) <= 0 && maxCharacterHp > 0

  const hpPercent = combatStats?.max_hp
    ? Math.min(100, Math.max(0, ((currentHp ?? 0) / combatStats.max_hp) * 100))
    : 0
  const manaPercent = combatStats?.max_mana
    ? Math.min(100, Math.max(0, ((currentMana ?? 0) / combatStats.max_mana) * 100))
    : 0

  const hasValidMonsters = monsters?.some(m => m != null) ?? false

  // 技能特效类型：直接使用后端返回的 effect_key
  const computedSkillEffect = useMemo((): SkillEffectType | null => {
    if (!skillUsed?.effect_key) return null
    const key = skillUsed.effect_key
    const valid: SkillEffectType[] = [
      'meteor',
      'meteor-storm',
      'fireball',
      'ice-arrow',
      'ice-age',
      'blackhole',
      'heal',
      'lightning',
      'chain-lightning',
    ]
    return valid.includes(key as SkillEffectType) ? (key as SkillEffectType) : null
  }, [skillUsed])

  // 多怪物：延迟显示时传扣血前数据
  const displayMonsters = useMemo(() => {
    const list = monsters ?? []
    if (showDamageAndHp || list.length === 0) return list
    return list.map(m => {
      if (m == null) return m
      const taken = (m as CombatMonster & { damage_taken?: number }).damage_taken ?? 0
      const beforeHp = Math.min(m.max_hp ?? 99999, (m.hp ?? 0) + taken)
      return { ...m, hp: beforeHp, damage_taken: undefined } as typeof m
    })
  }, [monsters, showDamageAndHp])

  // 有技能回合且未到「可显示扣血」时，强制用扣血前血量，避免首帧就显示 finalMonsterHp
  const hasSkillThisRound = Boolean(skillUsed && computedSkillEffect)
  const effectiveMonsterHp =
    hasSkillThisRound && !showDamageAndHp
      ? (monsterHpBeforeRound ?? displayMonsterHp ?? maxHp ?? 0)
      : (displayMonsterHp ?? monsterHpBeforeRound ?? finalMonsterHp)

  // 怪物血量显示：有技能动画时等 onComplete 后再扣血，否则 150ms 后扣血
  useEffect(() => {
    pendingFinalHpRef.current = finalMonsterHp
    if (monster == null || maxHp <= 0) {
      const raf = requestAnimationFrame(() => setDisplayMonsterHp(null))
      rafRef.current = raf
      return () => cancelAnimationFrame(raf)
    }
    const before = monsterHpBeforeRound ?? finalMonsterHp
    const raf = requestAnimationFrame(() => {
      setDisplayMonsterHp(before)
      if (before !== finalMonsterHp) {
        const hasSkillEffect = Boolean(skillUsed && computedSkillEffect)
        if (!hasSkillEffect) {
          const t = setTimeout(() => setDisplayMonsterHp(finalMonsterHp), 150)
          timeoutRef.current = t
        }
      }
    })
    rafRef.current = raf
    return () => {
      cancelAnimationFrame(raf)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [
    monster?.name,
    monster?.level,
    finalMonsterHp,
    maxHp,
    monsterHpBeforeRound,
    monster,
    skillUsed,
    computedSkillEffect,
  ])

  // 根据怪物位置计算目标位置（单目标）
  const computedTargetPos = useMemo(() => {
    if (!skillTargetPositions || skillTargetPositions.length === 0) {
      return { x: 0.5, y: 0.25 }
    }
    const pos = skillTargetPositions[0]
    const x = 0.1 + pos * 0.2
    return { x, y: 0.25 }
  }, [skillTargetPositions])

  // 多目标位置（用于冰河世纪、连锁闪电等）
  const computedTargetPositions = useMemo(() => {
    if (!skillTargetPositions || skillTargetPositions.length === 0) {
      return [{ x: 0.5, y: 0.25 }]
    }
    return skillTargetPositions.map(pos => ({
      x: 0.1 + pos * 0.2,
      y: 0.25,
    }))
  }, [skillTargetPositions])

  // 技能特效状态
  const [activeSkillEffect, setActiveSkillEffect] = useState<SkillEffectType | null>(null)
  const lastSkillUsedIdRef = useRef<number>(0)
  const skillTriggerCountRef = useRef<number>(0)

  // 有技能时在 useLayoutEffect 里立即设为延迟显示，首帧重绘即传扣血前数据
  useLayoutEffect(() => {
    if (skillUsed && computedSkillEffect) {
      if (skillUsed !== lastSkillUsedRef.current) {
        lastSkillUsedRef.current = skillUsed
        skillAnimationCompletedRef.current = false
      }
      setShowDamageAndHp(false)
      skillTriggerCountRef.current += 1
      const uniqueSkillId = skillUsed.skill_id * 10000 + skillTriggerCountRef.current
      if (lastSkillUsedIdRef.current !== uniqueSkillId) {
        lastSkillUsedIdRef.current = uniqueSkillId
        setActiveSkillEffect(computedSkillEffect)
      }
    } else {
      lastSkillUsedRef.current = null
      setShowDamageAndHp(true)
    }
  }, [skillUsed, computedSkillEffect])

  /** 技能视觉命中时调用（如冰箭击中），提前显示扣血，不等尾效播完 */
  const handleHit = useCallback(() => {
    skillAnimationCompletedRef.current = true
    setShowDamageAndHp(true)
    setDisplayMonsterHp(pendingFinalHpRef.current)
  }, [])

  const handleSkillComplete = () => {
    if (!skillAnimationCompletedRef.current) {
      skillAnimationCompletedRef.current = true
      setShowDamageAndHp(true)
      setDisplayMonsterHp(pendingFinalHpRef.current)
    }
    setActiveSkillEffect(null)
  }

  return (
    <div className="relative flex flex-col items-stretch">
      {/* 技能特效层 */}
      {activeSkillEffect && (
        <SkillEffect
          type={activeSkillEffect}
          active={true}
          targetPosition={computedTargetPos}
          targetPositions={
            activeSkillEffect === 'ice-age' || activeSkillEffect === 'chain-lightning'
              ? computedTargetPositions
              : undefined
          }
          onComplete={handleSkillComplete}
          onHit={handleHit}
          className="absolute inset-0 z-10"
        />
      )}

      {/* 上侧：怪物（支持多只），仅在非加载且已有战斗结果时显示，避免点击后未发请求时显示静态/旧数据 */}
      <div className="flex flex-1 flex-col items-center gap-2 p-3 sm:p-4">
        {!isLoading && isFighting && hasValidMonsters ? (
          <MonsterGroup
            monsters={displayMonsters}
            skillUsed={skillUsed}
            skillTargetPositions={skillTargetPositions}
            showDamageAndHp={showDamageAndHp}
          />
        ) : !isLoading && isFighting && monster ? (
          <div className={isMonsterDead ? styles['monster-death'] : ''}>
            <MonsterIcon key={monsterId} monsterId={monsterId} name={monster.name} size="lg" />
          </div>
        ) : isFighting && isLoading ? (
          <div className="text-muted-foreground flex h-20 w-20 items-center justify-center text-xs sm:h-24 sm:w-24 sm:text-sm">
            加载中
          </div>
        ) : (
          <div className="h-20 w-20 sm:h-24 sm:w-24" />
        )}
        {!isLoading && isFighting && !hasValidMonsters && !monster && !monsterId && (
          <div className="text-muted-foreground flex-1 text-xs">战斗中</div>
        )}
      </div>

      {/* VS 双剑：点击开始/停止挂机，战斗中播放交击动画 */}
      <VSSwords
        isFighting={isFighting}
        isLoading={isLoading}
        isDead={isCharacterDead}
        onToggle={onCombatToggle}
      />

      {/* 下侧：用户 */}
      <div className="flex flex-col items-center gap-2 p-3 sm:p-4">
        <div className="bg-primary/20 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold sm:h-16 sm:w-16 sm:text-2xl">
          {character?.name?.charAt(0) ?? '?'}
        </div>
        {combatStats && (
          <div className="w-full max-w-[140px] space-y-1 sm:max-w-[160px]">
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
    </div>
  )
}
