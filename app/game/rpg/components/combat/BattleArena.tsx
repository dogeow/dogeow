'use client'

import { type CombatMonster, type SkillUsedEntry } from '../../types'
import { useEffect, useRef, useState } from 'react'
import { MonsterIcon } from './MonsterIcon'
import { MonsterGroup } from './MonsterGroup'
import { VSSwords } from './VSSwords'
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

  // 优先用「本回合开始前」血量，这样首帧就是从满血（或回合初）再动画到扣血后
  const effectiveMonsterHp = displayMonsterHp ?? monsterHpBeforeRound ?? finalMonsterHp
  // 检测怪物死亡
  const isMonsterDead = finalMonsterHp <= 0 && maxHp > 0
  // 检测角色死亡
  const maxCharacterHp = combatStats?.max_hp ?? 0
  const isCharacterDead = (currentHp ?? 0) <= 0 && maxCharacterHp > 0

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
    <div className="flex flex-col items-stretch">
      {/* 上侧：怪物（支持多只），仅在非加载且已有战斗结果时显示，避免点击后未发请求时显示静态/旧数据 */}
      <div className="flex flex-1 flex-col items-center gap-2 p-3 sm:p-4">
        {!isLoading && isFighting && monsters && monsters.length > 0 ? (
          <MonsterGroup
            monsters={monsters}
            skillUsed={skillUsed}
            skillTargetPositions={skillTargetPositions}
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
        {/* 单只怪物时显示大血条；仅在非加载且有怪物数据时显示 */}
        {!isLoading &&
          isFighting &&
          (monsters == null || monsters.length === 0) &&
          (monster || maxHp > 0) && (
            <div className="w-full max-w-[140px] space-y-1 sm:max-w-[160px]">
              <div className="text-muted-foreground flex justify-between text-[10px] sm:text-xs">
                <span>HP</span>
                <span>
                  {effectiveMonsterHp} / {monster?.max_hp ?? maxHp}
                </span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full bg-red-600 transition-[width] duration-300"
                  style={{
                    width: `${(monster?.max_hp ?? maxHp) > 0 ? Math.min(100, Math.max(0, (effectiveMonsterHp / (monster?.max_hp ?? maxHp)) * 100)) : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        {!isLoading &&
          isFighting &&
          (monsters == null || monsters.length === 0) &&
          !monster &&
          !monsterId && <div className="text-muted-foreground flex-1 text-xs">战斗中</div>}
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
