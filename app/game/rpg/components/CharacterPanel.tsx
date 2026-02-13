'use client'

import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { CLASS_NAMES, STAT_NAMES, CharacterClass } from '../types'

export function CharacterPanel() {
  const { character, combatStats, currentHp, currentMana, allocateStats, isLoading } =
    useGameStore()
  const [allocating, setAllocating] = useState<{
    strength: number
    dexterity: number
    vitality: number
    energy: number
  }>({
    strength: 0,
    dexterity: 0,
    vitality: 0,
    energy: 0,
  })

  if (!character) return null

  const classIcon: Record<CharacterClass, string> = {
    warrior: '⚔️',
    mage: '🔮',
    ranger: '🏹',
  }

  const handleAllocate = async () => {
    const total = Object.values(allocating).reduce((a, b) => a + b, 0)
    if (total === 0) return
    if (total > character.stat_points) return

    await allocateStats(allocating)
    setAllocating({ strength: 0, dexterity: 0, vitality: 0, energy: 0 })
  }

  const totalAllocating = Object.values(allocating).reduce((a, b) => a + b, 0)
  const remainingPoints = character.stat_points - totalAllocating

  const expPercent =
    ((character.experience - getExpForLevel(character.level)) /
      (getExpForNextLevel(character.level) - getExpForLevel(character.level))) *
    100

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 角色基本信息 - 移动端优化 */}
      <div className="rounded-lg bg-gray-800 p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-2xl sm:h-16 sm:w-16 sm:text-3xl">
            {classIcon[character.class]}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-white sm:text-xl">{character.name}</h3>
            <p className="text-sm text-gray-400">
              Lv.{character.level} {CLASS_NAMES[character.class]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-yellow-400 sm:text-base">
              💰 {character.gold.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 经验条 */}
        <div className="mb-2 sm:mb-4">
          <div className="mb-1 flex justify-between text-xs text-gray-400 sm:text-sm">
            <span>经验值</span>
            <span className="text-xs">
              {character.experience.toLocaleString()} /{' '}
              {getExpForNextLevel(character.level).toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(100, expPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 战斗属性 - 移动端优化 */}
      {combatStats && (
        <div className="rounded-lg bg-gray-800 p-3 sm:p-4">
          <h4 className="mb-3 text-base font-medium text-white sm:text-lg">战斗属性</h4>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <StatBar
              label="生命值"
              value={`${currentHp ?? combatStats.max_hp} / ${combatStats.max_hp}`}
              icon="❤️"
              color="red"
            />
            <StatBar
              label="法力值"
              value={`${currentMana ?? combatStats.max_mana} / ${combatStats.max_mana}`}
              icon="💙"
              color="blue"
            />
            <StatBar label="攻击力" value={combatStats.attack} icon="⚔️" color="orange" />
            <StatBar label="防御力" value={combatStats.defense} icon="🛡️" color="gray" />
            <StatBar
              label="暴击率"
              value={`${(combatStats.crit_rate * 100).toFixed(1)}%`}
              icon="💥"
              color="yellow"
            />
            <StatBar
              label="暴击伤害"
              value={`${(combatStats.crit_damage * 100).toFixed(0)}%`}
              icon="🔥"
              color="red"
            />
          </div>
        </div>
      )}

      {/* 基础属性 - 移动端优化 */}
      <div className="rounded-lg bg-gray-800 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-medium text-white sm:text-lg">基础属性</h4>
          {character.stat_points > 0 && (
            <span className="text-xs text-green-400 sm:text-sm">
              可分配: {character.stat_points} 点
            </span>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          {(['strength', 'dexterity', 'vitality', 'energy'] as const).map(stat => (
            <div key={stat} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{STAT_NAMES[stat]}</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm font-medium text-white sm:text-base">
                  {character[stat]}
                </span>
                {character.stat_points > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setAllocating(a => ({ ...a, [stat]: Math.max(0, a[stat] - 1) }))
                      }
                      className="h-6 w-6 rounded bg-gray-700 text-xs text-white hover:bg-gray-600 sm:text-sm"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs text-green-400 sm:w-6">
                      {allocating[stat] > 0 ? `+${allocating[stat]}` : ''}
                    </span>
                    <button
                      onClick={() => {
                        if (remainingPoints > 0) {
                          setAllocating(a => ({ ...a, [stat]: a[stat] + 1 }))
                        }
                      }}
                      className="h-6 w-6 rounded bg-gray-700 text-xs text-white hover:bg-gray-600 sm:text-sm"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {totalAllocating > 0 && (
          <button
            onClick={handleAllocate}
            disabled={isLoading || totalAllocating > character.stat_points}
            className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:bg-gray-600 sm:mt-4"
          >
            {isLoading ? '分配中...' : `确认分配 ${totalAllocating} 点`}
          </button>
        )}
      </div>
    </div>
  )
}

function StatBar({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: string | number
  icon: string
  color: string
}) {
  const colorClasses: Record<string, string> = {
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    gray: 'text-gray-300',
    yellow: 'text-yellow-400',
  }

  return (
    <div className="flex items-center justify-between rounded-lg bg-gray-700/50 px-2 py-1.5 sm:px-3 sm:py-2">
      <span className="flex items-center gap-1.5 text-gray-400 sm:gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs sm:text-sm">{label}</span>
      </span>
      <span className={`text-sm font-bold sm:text-base ${colorClasses[color] || 'text-white'}`}>
        {value}
      </span>
    </div>
  )
}

function getExpForLevel(level: number): number {
  const table: Record<number, number> = {
    1: 0,
    2: 100,
    3: 250,
    4: 500,
    5: 1000,
    6: 2000,
    7: 4000,
    8: 8000,
    9: 16000,
    10: 32000,
  }
  return table[level] ?? level * 5000
}

function getExpForNextLevel(level: number): number {
  return getExpForLevel(level + 1)
}
