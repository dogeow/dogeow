'use client'

import { type CombatMonster, type SkillUsedEntry } from '../../types'
import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { MonsterIcon } from './MonsterIcon'
import { MonsterInfoDialog } from './MonsterInfoDialog'
import styles from '../../rpg.module.css'

type MonsterWithMeta = CombatMonster & { damage_taken?: number }

/** 显示多只怪物（固定5个位置，支持 null 占位） */
export function MonsterGroup({
  monsters,
  skillUsed,
  skillTargetPositions,
}: {
  monsters: (MonsterWithMeta | null)[]
  skillUsed?: SkillUsedEntry | null
  skillTargetPositions?: number[]
}) {
  const prevMonstersRef = useRef<MonsterWithMeta[]>([])
  // 存储上一次的 instance_id，用于检测新怪物
  const prevInstanceIdsRef = useRef<Set<string>>(new Set())
  // 存储当前新出现的怪物 instance_id（立即可用，不需要等待状态更新）
  const newAppearingRef = useRef<Set<string>>(new Set())
  const [damageTexts, setDamageTexts] = useState<Record<string, number>>({})
  // 选中的怪物（用于弹窗显示）
  const [selectedMonster, setSelectedMonster] = useState<MonsterWithMeta | null>(null)
  // 记录死亡的怪物，用于触发动画
  const [deadMonsters, setDeadMonsters] = useState<Set<string>>(new Set())
  // 记录需要显示出现动画的怪物 instance_id
  const [appearingMonsters, setAppearingMonsters] = useState<Set<string>>(new Set())
  // 技能图标显示状态：position -> skill info
  const [skillIcons, setSkillIcons] = useState<
    Record<number, { skillId: number; icon: string | null; name: string }>
  >({})

  // 当有新技能使用时，在目标怪物上显示技能图标（queueMicrotask 避免 effect 内同步 setState）
  useEffect(() => {
    if (skillUsed && skillTargetPositions && skillTargetPositions.length > 0) {
      const newIcons: Record<number, { skillId: number; icon: string | null; name: string }> = {}
      skillTargetPositions.forEach(pos => {
        newIcons[pos] = {
          skillId: skillUsed.skill_id,
          icon: skillUsed.icon ?? null,
          name: skillUsed.name,
        }
      })
      queueMicrotask(() => setSkillIcons(newIcons))
      // 1.5秒后清除技能图标
      const timer = setTimeout(() => setSkillIcons({}), 1500)
      return () => clearTimeout(timer)
    }
  }, [skillUsed, skillTargetPositions])

  const handleMonsterClick = (m: MonsterWithMeta) => {
    setSelectedMonster(m)
  }

  // 过滤出有效的怪物（用于效果和新怪物检测）
  const validMonsters = useMemo(
    () => monsters?.filter((m): m is MonsterWithMeta => m != null) ?? [],
    [monsters]
  )

  // 检测怪物掉血并显示伤害数字，以及检测新怪物
  useEffect(() => {
    // 检测新怪物：通过比较 instance_id
    const currentInstanceIds = new Set(validMonsters.map(m => m.instance_id).filter(Boolean))
    const prevInstanceIds = prevInstanceIdsRef.current

    // 找出新出现的怪物 instance_id
    const newAppearing: string[] = []
    currentInstanceIds.forEach(instanceId => {
      if (instanceId && !prevInstanceIds.has(instanceId)) {
        newAppearing.push(instanceId)
      }
    })

    if (newAppearing.length > 0) {
      console.log('[MonsterGroup] New monsters appearing:', newAppearing)
      // 立即更新 ref，用于渲染时判断
      newAppearingRef.current = new Set(newAppearing)
      queueMicrotask(() => {
        setAppearingMonsters(prev => {
          const next = new Set(prev)
          newAppearing.forEach(id => next.add(id))
          return next
        })
      })
      // 1.2秒后移除动画标记
      setTimeout(() => {
        setAppearingMonsters(prev => {
          const next = new Set(prev)
          newAppearing.forEach(id => next.delete(id))
          return next
        })
        newAppearingRef.current.delete(newAppearing[0])
      }, 1200)
    }

    // 更新上一次的 instance_id
    prevInstanceIdsRef.current = currentInstanceIds

    if (prevMonstersRef.current.length === 0 || validMonsters.length === 0) {
      prevMonstersRef.current = validMonsters
      return
    }

    const newDamage: Record<string, number> = {}

    validMonsters.forEach(m => {
      // 使用 position 作为 key 来区分同一波中的不同怪物实例
      const key = `pos-${m.position}`
      const d = m.damage_taken
      // 新出现的怪物不显示伤害（等下一轮）- 使用 ref 立即判断
      if (d != null && d > 0) {
        const isNew = m.instance_id ? newAppearingRef.current.has(m.instance_id) : false
        if (!isNew) {
          newDamage[key] = d
        }
      }
    })

    if (Object.keys(newDamage).length > 0) {
      queueMicrotask(() => {
        setDamageTexts(newDamage)
        setTimeout(() => setDamageTexts({}), 1500)
      })
    }

    // 检测怪物死亡：HP <= 0 时触发死亡动画
    validMonsters.forEach(m => {
      if ((m.hp ?? 0) <= 0) {
        // 使用 position 作为 key 来区分同一波中的不同怪物实例
        const key = `pos-${m.position}`
        setDeadMonsters(prev => {
          if (!prev.has(key)) {
            // 新死亡：添加到死亡集合，1.5秒后动画结束
            return new Set([...prev, key])
          }
          return prev
        })
      }
    })

    prevMonstersRef.current = validMonsters
  }, [validMonsters])

  if (!monsters || monsters.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap items-end justify-center gap-1 sm:gap-2">
        {[0, 1, 2, 3, 4].map(pos => {
          // 优先使用数组索引对应的怪物，其次查找 position 字段
          const m = monsters[pos] ?? validMonsters.find(monster => monster.position === pos)
          if (!m) {
            // 空位置
            return <div key={pos} className="w-14 sm:w-16" />
          }

          const key = `${m.id}-${pos}-${m.level}`
          // 使用后端提供的 is_new 字段判断是否是新的怪物
          // 通过 appearingMonsters state 判断是否需要显示出现动画
          const isNew = m.instance_id ? appearingMonsters.has(m.instance_id) : false
          const damage = damageTexts[`pos-${m.position}`]
          // 使用 position 作为 key 来区分同一波中的不同怪物实例
          const monsterKey = `pos-${m.position}`
          const isDead = (m.hp ?? 0) <= 0 && deadMonsters.has(monsterKey)
          const skillIcon = skillIcons[pos]

          // 使用 instance_id 作为 key，这样新怪物出现时会重新创建元素触发动画
          return (
            <button
              key={m.instance_id ?? monsterKey}
              type="button"
              onClick={() => handleMonsterClick(m)}
              className={`relative flex cursor-pointer flex-col items-center gap-0.5 transition-opacity hover:opacity-80 ${isNew ? styles['monster-appear'] : ''} ${isDead ? styles['monster-death'] : ''}`}
              title={`点击查看 ${m.name} 详情`}
            >
              {/* 技能图标 - 显示在被命中的怪物图片上 */}
              {skillIcon && (
                <span className="absolute top-1/2 left-1/2 z-20 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-lg bg-blue-500/90 p-1 shadow-lg sm:h-12 sm:w-12">
                  {skillIcon.icon && skillIcon.icon.length <= 4 ? (
                    <span className="flex h-full w-full items-center justify-center text-base font-bold text-white sm:text-lg">
                      {skillIcon.icon}
                    </span>
                  ) : (
                    <Image
                      src={`/game/rpg/skills/skill_${skillIcon.skillId}.png`}
                      alt={skillIcon.name}
                      fill
                      className="rounded object-cover"
                      sizes="48px"
                    />
                  )}
                </span>
              )}
              {damage !== undefined && damage > 0 && (
                <span className="absolute -top-5 text-xs font-bold text-red-500 sm:text-sm">
                  -{damage}
                </span>
              )}
              <MonsterIcon monsterId={m.id} name={m.name} size="md" />
              <div className="w-full max-w-[50px] sm:max-w-[60px]">
                <div className="text-muted-foreground flex justify-between text-[8px] sm:text-[10px]">
                  <span>HP</span>
                  <span>
                    {m.hp}/{m.max_hp}
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full bg-red-600 transition-all duration-300"
                    style={{
                      width: `${m.max_hp && m.max_hp > 0 ? Math.min(100, Math.max((m.hp ?? 0) <= 0 ? 0 : 5, (m.hp / m.max_hp) * 100)) : 100}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-muted-foreground max-w-[50px] truncate text-[10px] sm:max-w-[60px] sm:text-xs">
                {m.name}
              </p>
            </button>
          )
        })}
      </div>

      {/* 怪物信息弹窗 */}
      <MonsterInfoDialog monster={selectedMonster} onClose={() => setSelectedMonster(null)} />
    </>
  )
}
