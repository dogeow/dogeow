'use client'

import type { CharacterSkill, SkillUsedEntry } from '../../types'
import { SkillIcon } from '../shared/SkillIcon'
import styles from '../../rpg.module.css'

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
        const btnClass = `hover:bg-muted/80 focus-visible:ring-ring relative flex flex-col items-center gap-0.5 rounded-md transition-[background-color] duration-150 focus:outline-none focus-visible:ring-2 outline-offset-0`
        return enabled ? (
          <div key={cs.id} className={styles['skill-marquee-wrap']}>
            <button
              type="button"
              className={`${styles['skill-marquee-btn']} bg-muted/50 ${btnClass}`}
              title={`${def.name} 已启用（再点关闭）`}
              onClick={() => onSkillToggle(def.id)}
            >
              {buttonContent}
            </button>
            <svg
              className={styles['skill-marquee-border']}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              <rect x="1" y="1" width="98" height="98" rx="10" ry="10" />
            </svg>
          </div>
        ) : (
          <button
            key={cs.id}
            type="button"
            className={btnClass}
            title={`${def.name} 点击启用`}
            onClick={() => onSkillToggle(def.id)}
          >
            {buttonContent}
          </button>
        )
      })}
    </div>
  )
}
