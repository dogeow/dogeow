'use client'

import { type CombatMonster } from '../../types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MonsterIcon } from './MonsterIcon'
import { MonsterInfoDialog } from './MonsterInfoDialog'
import styles from '../../rpg.module.css'

type MonsterWithMeta = CombatMonster & { damage_taken?: number }

/** 显示多只怪物（固定5个位置，支持 null 占位） */
export function MonsterGroup({ monsters }: { monsters: (MonsterWithMeta | null)[] }) {
  const prevMonstersRef = useRef<MonsterWithMeta[]>([])
  const [damageTexts, setDamageTexts] = useState<Record<string, number>>({})
  // 上一帧的怪物 keys，用于渲染时计算 newMonsters（ref 不能在 render 中读取）
  const [prevMonsterKeys, setPrevMonsterKeys] = useState<string[]>([])
  // 选中的怪物（用于弹窗显示）
  const [selectedMonster, setSelectedMonster] = useState<MonsterWithMeta | null>(null)

  const handleMonsterClick = (m: MonsterWithMeta) => {
    setSelectedMonster(m)
  }

  // 过滤出有效的怪物（用于效果和新怪物检测）
  const validMonsters = useMemo(
    () => monsters?.filter((m): m is MonsterWithMeta => m != null) ?? [],
    [monsters]
  )

  // 上一帧 keys 的 Set，用于计算 newMonsters（所有 hooks 必须在 early return 之前）
  const prevKeysSet = useMemo(() => new Set(prevMonsterKeys), [prevMonsterKeys])
  const newMonsters = useMemo(
    () => validMonsters.filter(m => !prevKeysSet.has(`${m.id}-${m.level}`)),
    [validMonsters, prevKeysSet]
  )

  // 检测怪物掉血并显示伤害数字；下一帧的 prevMonsterKeys 用 queueMicrotask 延迟更新以避免 effect 内同步 setState
  useEffect(() => {
    if (prevMonstersRef.current.length === 0 || validMonsters.length === 0) {
      prevMonstersRef.current = validMonsters
      const nextKeys = validMonsters.map(m => `${m.id}-${m.level}`)
      queueMicrotask(() => setPrevMonsterKeys(nextKeys))
      return
    }

    const newDamage: Record<string, number> = {}

    validMonsters.forEach(m => {
      const key = `${m.id}-${m.level}`
      const d = m.damage_taken
      if (d != null && d > 0) newDamage[key] = d
    })

    if (Object.keys(newDamage).length > 0) {
      queueMicrotask(() => {
        setDamageTexts(newDamage)
        setTimeout(() => setDamageTexts({}), 1500)
      })
    }

    prevMonstersRef.current = validMonsters
    queueMicrotask(() => setPrevMonsterKeys(validMonsters.map(m => `${m.id}-${m.level}`)))
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
          const isNew = newMonsters.some(nm => nm.id === m.id && nm.level === m.level)
          const damage = damageTexts[`${m.id}-${m.level}`]

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleMonsterClick(m)}
              className={`relative flex cursor-pointer flex-col items-center gap-0.5 transition-opacity hover:opacity-80 ${isNew ? styles['monster-appear'] : ''}`}
              title={`点击查看 ${m.name} 详情`}
            >
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
