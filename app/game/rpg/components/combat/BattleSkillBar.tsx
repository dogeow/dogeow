'use client'

import type { CharacterSkill, SkillUsedEntry } from '../../types'
import { SkillIcon } from '../shared/SkillIcon'

/** 战斗技能栏：显示主动技能图标、回合冷却、点击启用/关闭 */
export function BattleSkillBar({
  activeSkills,
  skillsUsed,
  skillCooldowns,
  enabledSkillIds,
  onSkillToggle,
  disabled,
}: {
  activeSkills: CharacterSkill[]
  skillsUsed: SkillUsedEntry[] | undefined
  skillCooldowns: Record<number, number>
  enabledSkillIds: number[]
  onSkillToggle: (skillId: number) => void
  disabled?: boolean
}) {
  if (activeSkills.length === 0) return null

  return (
    <div className="flex flex-wrap items-start gap-2">
      {activeSkills.map(cs => {
        const def = cs.skill
        // 剩余冷却回合数
        const remainingRounds = skillCooldowns[def.id] ?? 0
        const onCooldown = remainingRounds > 0
        const enabled = enabledSkillIds.includes(def.id) && !disabled
        const buttonContent = (
          <>
            <div className="relative">
              <SkillIcon icon={def.icon} name={def.name} skillId={def.id} />
              {onCooldown && (
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden rounded bg-black/50"
                  aria-hidden
                >
                  <span className="relative z-10 text-xs font-bold text-white drop-shadow">
                    {remainingRounds}
                  </span>
                </div>
              )}
            </div>
            <span className="text-muted-foreground max-w-[3rem] truncate text-[10px] sm:max-w-[4rem] sm:text-xs">
              {def.name}
            </span>
          </>
        )
        const btnClass = [
          'focus-visible:ring-ring relative flex flex-col items-center gap-0.5 rounded-md border px-1 py-1 transition-[background-color,border-color,filter,opacity] duration-150 focus:outline-none focus-visible:ring-2 outline-offset-0',
          enabled
            ? 'border-primary/60 bg-muted/60 hover:bg-muted/80'
            : 'border-border/50 bg-muted/20 grayscale opacity-80 hover:bg-muted/35',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')
        return (
          <button
            key={cs.id}
            type="button"
            className={btnClass}
            title={enabled ? `${def.name} 已启用（再点关闭）` : `${def.name} 点击启用`}
            onClick={() => onSkillToggle(def.id)}
          >
            {buttonContent}
          </button>
        )
      })}
    </div>
  )
}
