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

  const expToCurrent = getExpForLevel(character.level)
  const expToNext = getExpForNextLevel(character.level)
  const expInLevel = expToNext - expToCurrent
  const expPercent =
    expInLevel > 0
      ? Math.max(0, Math.min(100, ((character.experience - expToCurrent) / expInLevel) * 100))
      : 0

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 角色基本信息 - 移动端优化 */}
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-3 sm:mb-4 sm:gap-4">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full text-2xl sm:h-16 sm:w-16 sm:text-3xl">
            {classIcon[character.class]}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-foreground truncate text-lg font-bold sm:text-xl">
              {character.name}
            </h3>
            <p className="text-muted-foreground text-sm">
              Lv.{character.level} {CLASS_NAMES[character.class]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-yellow-600 sm:text-base dark:text-yellow-400">
              💰 {character.gold.toLocaleString()}
            </p>
          </div>
        </div>

        {/* 经验条 */}
        <div className="mb-3 sm:mb-4">
          <div className="text-muted-foreground mb-1 flex justify-between text-xs sm:text-sm">
            <span>经验值</span>
            <span className="text-xs">
              {character.experience.toLocaleString()} /{' '}
              {getExpForNextLevel(character.level).toLocaleString()}
            </span>
          </div>
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(100, expPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 战斗属性 - 移动端优化 */}
      {combatStats && (
        <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
          <h4 className="text-foreground mb-3 text-base font-medium sm:text-lg">战斗属性</h4>
          <div className="flex flex-wrap gap-2 sm:gap-3">
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
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-foreground text-base font-medium sm:text-lg">基础属性</h4>
          {character.stat_points > 0 && (
            <span className="text-xs text-green-600 sm:text-sm dark:text-green-400">
              可分配: {character.stat_points} 点
            </span>
          )}
        </div>

        <div className="space-y-2 sm:space-y-3">
          {(['strength', 'dexterity', 'vitality', 'energy'] as const).map(stat => (
            <div key={stat} className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">{STAT_NAMES[stat]}</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-foreground text-sm font-medium sm:text-base">
                  {character[stat]}
                </span>
                {character.stat_points > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setAllocating(a => ({ ...a, [stat]: Math.max(0, a[stat] - 1) }))
                      }
                      className="bg-muted text-foreground hover:bg-secondary h-6 w-6 rounded text-xs sm:text-sm"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs text-green-600 sm:w-6 dark:text-green-400">
                      {allocating[stat] > 0 ? `+${allocating[stat]}` : ''}
                    </span>
                    <button
                      onClick={() => {
                        if (remainingPoints > 0) {
                          setAllocating(a => ({ ...a, [stat]: a[stat] + 1 }))
                        }
                      }}
                      className="bg-muted text-foreground hover:bg-secondary h-6 w-6 rounded text-xs sm:text-sm"
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
            className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:mt-4"
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
    red: 'text-red-500 dark:text-red-400',
    blue: 'text-blue-500 dark:text-blue-400',
    orange: 'text-orange-500 dark:text-orange-400',
    gray: 'text-muted-foreground',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  }

  return (
    <div className="bg-muted/50 flex items-center justify-between rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
      <span className="text-muted-foreground flex items-center gap-1.5 sm:gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-xs sm:text-sm">{label}</span>
      </span>
      <span
        className={`text-sm font-bold sm:text-base ${colorClasses[color] || 'text-foreground'}`}
      >
        {value}
      </span>
    </div>
  )
}

/** 与后端 GameCharacter::EXPERIENCE_TABLE 保持一致（达到该等级所需累计经验） */
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
    11: 50000,
    12: 75000,
    13: 105000,
    14: 140000,
    15: 180000,
    16: 225000,
    17: 275000,
    18: 330000,
    19: 390000,
    20: 455000,
    21: 525000,
    22: 600000,
    23: 680000,
    24: 765000,
    25: 855000,
    26: 950000,
    27: 1050000,
    28: 1155000,
    29: 1265000,
    30: 1380000,
    31: 1500000,
    32: 1625000,
    33: 1755000,
    34: 1890000,
    35: 2030000,
    36: 2175000,
    37: 2325000,
    38: 2480000,
    39: 2640000,
    40: 2805000,
    41: 2975000,
    42: 3150000,
    43: 3330000,
    44: 3515000,
    45: 3705000,
    46: 3900000,
    47: 4100000,
    48: 4305000,
    49: 4515000,
    50: 4730000,
    51: 4950000,
    52: 5175000,
    53: 5405000,
    54: 5640000,
    55: 5880000,
    56: 6125000,
    57: 6375000,
    58: 6630000,
    59: 6890000,
    60: 7155000,
    61: 7425000,
    62: 7700000,
    63: 7980000,
    64: 8265000,
    65: 8555000,
    66: 8850000,
    67: 9150000,
    68: 9455000,
    69: 9765000,
    70: 10080000,
  }
  return table[level] ?? level * 5000
}

function getExpForNextLevel(level: number): number {
  return getExpForLevel(level + 1)
}
