'use client'

import { useState, useMemo, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useGameStore } from '../stores/gameStore'
import { EquipmentGrid } from './InventoryPanel'
import {
  CLASS_NAMES,
  STAT_DESCRIPTIONS,
  STAT_NAMES,
  CharacterClass,
  type StatBreakdownItem,
} from '../types'

const CHARACTER_STATS = ['strength', 'dexterity', 'vitality', 'energy'] as const

const classIcon: Record<CharacterClass, string> = {
  warrior: '⚔️',
  mage: '🔮',
  ranger: '🏹',
}

export function CharacterPanel() {
  const {
    character,
    combatStats,
    statsBreakdown,
    equipment,
    unequipItem,
    allocateStats,
    isLoading,
  } = useGameStore()

  const [allocating, setAllocating] = useState<Record<(typeof CHARACTER_STATS)[number], number>>({
    strength: 0,
    dexterity: 0,
    vitality: 0,
    energy: 0,
  })

  // 优化: 防止不必要的渲染，通过 useMemo 优化数据计算
  const totalAllocating = useMemo(
    () => Object.values(allocating).reduce((a, b) => a + b, 0),
    [allocating]
  )
  const remainingPoints = useMemo(
    () => (character ? character.stat_points - totalAllocating : 0),
    [character, totalAllocating]
  )

  const handleAllocate = useCallback(async () => {
    if (!character) return
    if (totalAllocating === 0) return
    if (totalAllocating > character.stat_points) return

    await allocateStats({ ...allocating })
    setAllocating({ strength: 0, dexterity: 0, vitality: 0, energy: 0 })
  }, [allocating, totalAllocating, character, allocateStats])

  // 优化: 仅在没有角色信息时再渲染 null
  if (!character) return null

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 角色基本信息 - 移动端优化 */}
      <PanelCard>
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
        </div>
      </PanelCard>

      {/* 装备栏 */}
      <PanelCard>
        <h4 className="text-foreground mb-3 text-base font-medium sm:mb-4 sm:text-lg">装备</h4>
        <EquipmentGrid equipment={equipment} onUnequip={unequipItem} />
      </PanelCard>

      {/* 战斗属性 - 移动端优化 */}
      {combatStats && (
        <PanelCard>
          <h4 className="text-foreground mb-3 text-base font-medium sm:text-lg">战斗属性</h4>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <StatBarWithBreakdown
              label="攻击力"
              value={combatStats.attack}
              icon="⚔️"
              color="orange"
              breakdown={statsBreakdown?.attack}
              format="number"
            />
            <StatBarWithBreakdown
              label="防御力"
              value={combatStats.defense}
              icon="🛡️"
              color="gray"
              breakdown={statsBreakdown?.defense}
              format="number"
            />
            <StatBarWithBreakdown
              label="暴击率"
              value={`${(combatStats.crit_rate * 100).toFixed(1)}%`}
              icon="💥"
              color="yellow"
              breakdown={statsBreakdown?.crit_rate}
              format="percent"
            />
            <StatBarWithBreakdown
              label="暴击伤害"
              value={`${(combatStats.crit_damage * 100).toFixed(0)}%`}
              icon="🔥"
              color="red"
              breakdown={statsBreakdown?.crit_damage}
              format="percent"
            />
          </div>
        </PanelCard>
      )}

      {/* 基础属性 - 移动端优化 */}
      <PanelCard>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-foreground text-base font-medium sm:text-lg">基础属性</h4>
          {character.stat_points > 0 && (
            <span className="text-xs text-green-600 sm:text-sm dark:text-green-400">
              可分配: {character.stat_points} 点
            </span>
          )}
        </div>

        <TooltipProvider delayDuration={300}>
          <div className="space-y-2 sm:space-y-3">
            {CHARACTER_STATS.map(stat => (
              <StatRow
                key={stat}
                stat={stat}
                statName={STAT_NAMES[stat]}
                statDescription={STAT_DESCRIPTIONS[stat]}
                statValue={character[stat]}
                canAllocate={character.stat_points > 0}
                allocatingValue={allocating[stat]}
                onDecrement={() => setAllocating(a => ({ ...a, [stat]: Math.max(0, a[stat] - 1) }))}
                onIncrement={() => {
                  if (remainingPoints > 0) {
                    setAllocating(a => ({ ...a, [stat]: a[stat] + 1 }))
                  }
                }}
              />
            ))}
          </div>
        </TooltipProvider>

        {totalAllocating > 0 && (
          <button
            onClick={handleAllocate}
            disabled={isLoading || totalAllocating > character.stat_points}
            className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:mt-4"
          >
            {isLoading ? '分配中...' : `确认分配 ${totalAllocating} 点`}
          </button>
        )}
      </PanelCard>
    </div>
  )
}

// 可复用、减少重复的组件：PanelCard
function PanelCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-card border-border rounded-lg border p-3 sm:p-4">{children}</div>
}

// 可复用、减少重复的组件：StatRow（支持悬停与点击显示说明）
function StatRow({
  stat,
  statName,
  statDescription,
  statValue,
  canAllocate,
  allocatingValue,
  onIncrement,
  onDecrement,
}: {
  stat: (typeof CHARACTER_STATS)[number]
  statName: string
  statDescription: string
  statValue: number
  canAllocate: boolean
  allocatingValue: number
  onIncrement: () => void
  onDecrement: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center justify-between">
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            className="text-muted-foreground inline-flex cursor-help items-center gap-1 text-sm underline decoration-dotted underline-offset-2"
            onClick={() => setOpen(prev => !prev)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setOpen(prev => !prev)
              }
            }}
          >
            {statName}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[240px]">
          {statDescription}
        </TooltipContent>
      </Tooltip>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-foreground text-sm font-medium sm:text-base">{statValue}</span>
        {canAllocate && (
          <div className="flex items-center gap-1">
            <button
              onClick={onDecrement}
              className="bg-muted text-foreground hover:bg-secondary h-6 w-6 rounded text-xs sm:text-sm"
              aria-label={`减少${statName}`}
            >
              -
            </button>
            <span className="w-5 text-center text-xs text-green-600 sm:w-6 dark:text-green-400">
              {allocatingValue > 0 ? `+${allocatingValue}` : ''}
            </span>
            <button
              onClick={onIncrement}
              className="bg-muted text-foreground hover:bg-secondary h-6 w-6 rounded text-xs sm:text-sm"
              aria-label={`增加${statName}`}
            >
              +
            </button>
          </div>
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

function StatBarWithBreakdown({
  label,
  value,
  icon,
  color,
  breakdown,
  format,
}: {
  label: string
  value: string | number
  icon: string
  color: string
  breakdown?: StatBreakdownItem | null
  format: 'number' | 'percent'
}) {
  const colorClasses: Record<string, string> = {
    red: 'text-red-500 dark:text-red-400',
    blue: 'text-blue-500 dark:text-blue-400',
    orange: 'text-orange-500 dark:text-orange-400',
    gray: 'text-muted-foreground',
    yellow: 'text-yellow-600 dark:text-yellow-400',
  }
  const fmt = (n: number) =>
    format === 'percent' ? `${(n * 100).toFixed(1)}%` : String(Math.round(n))

  return (
    <div className="bg-muted/50 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
      <div className="flex items-center justify-between">
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
      {breakdown != null && (
        <p className="text-muted-foreground mt-1 text-[10px] sm:text-xs">
          基础 {fmt(breakdown.base)} + 装备 {fmt(breakdown.equipment)}
        </p>
      )}
    </div>
  )
}
