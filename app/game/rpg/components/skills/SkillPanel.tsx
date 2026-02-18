'use client'

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { useGameStore } from '../../stores/gameStore'
import type { SkillWithLearnedState, CharacterClass } from '../../types'

/** 技能图标：优先 /game/rpg/skills/skill_{id}.png，加载失败则用 emoji/首字 */
function SkillIcon({
  skillId,
  icon,
  name,
}: {
  skillId: number
  icon?: string | null
  name: string
}) {
  const fallback = icon && icon.length <= 4 ? icon : (name?.[0] ?? '?')
  const [useImg, setUseImg] = useState(true)
  const src = `/game/rpg/skills/skill_${skillId}.png`
  return (
    <span className="bg-muted relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded text-base sm:h-10 sm:w-10">
      {useImg ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="40px"
          onError={() => setUseImg(false)}
        />
      ) : (
        fallback
      )}
    </span>
  )
}

/** 技能分支配置 */
const BRANCH_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
  fire: { name: '火焰', color: 'text-red-500', icon: '🔥' },
  ice: { name: '冰霜', color: 'text-blue-500', icon: '❄️' },
  lightning: { name: '闪电', color: 'text-yellow-500', icon: '⚡' },
  warrior: { name: '力量', color: 'text-orange-500', icon: '⚔️' },
  ranger: { name: '敏捷', color: 'text-green-500', icon: '🏹' },
  passive: { name: '被动', color: 'text-purple-500', icon: '✨' },
}

export function SkillPanel() {
  const { character, skills, learnSkill, isLoading } = useGameStore()
  const [learningSkill, setLearningSkill] = useState<SkillWithLearnedState | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>('all')

  // 获取角色职业
  const characterClass = character?.class as CharacterClass | undefined

  // 已学习的技能ID集合
  const learnedSkillIds = useMemo(() => {
    return new Set(skills.filter(s => s.is_learned).map(s => s.id))
  }, [skills])

  // 按分支和层级分组技能
  const groupedSkills = useMemo(() => {
    const groups: Record<string, Record<number, SkillWithLearnedState[]>> = {}
    const allSkills = skills as SkillWithLearnedState[]

    for (const skill of allSkills) {
      const branch = skill.branch || 'other'
      if (!groups[branch]) {
        groups[branch] = {}
      }
      const tier = skill.tier || 1
      if (!groups[branch][tier]) {
        groups[branch][tier] = []
      }
      groups[branch][tier].push(skill)
    }
    return groups
  }, [skills])

  // 获取可用分支（根据职业过滤）
  const availableBranches = useMemo(() => {
    const branches = new Set<string>()
    for (const skill of skills) {
      // 被动技能所有职业可用
      if (skill.branch === 'passive') {
        branches.add('passive')
        continue
      }
      // 检查职业限制
      if (skill.class_restriction === 'all' || skill.class_restriction === characterClass) {
        branches.add(skill.branch || 'other')
      }
    }
    return Array.from(branches)
  }, [skills, characterClass])

  // 过滤选中的分支
  const filteredSkills = useMemo(() => {
    if (selectedBranch === 'all') {
      return skills
    }
    return skills.filter(
      s => s.branch === selectedBranch || (selectedBranch === 'passive' && s.branch === 'passive')
    )
  }, [skills, selectedBranch])

  // 检查技能是否可以学习（前置技能是否已学习）
  const canLearnSkill = useCallback(
    (skill: SkillWithLearnedState): boolean => {
      if (skill.is_learned) return false
      if (!character || character.skill_points < (skill.skill_points_cost || 1)) return false
      // 检查前置技能
      if (skill.prerequisite_skill_id && !learnedSkillIds.has(skill.prerequisite_skill_id)) {
        return false
      }
      return true
    },
    [character, learnedSkillIds]
  )

  // 检查技能是否被锁定（前置技能未学）
  const isSkillLocked = useCallback(
    (skill: SkillWithLearnedState): boolean => {
      if (skill.is_learned) return false
      if (skill.prerequisite_skill_id && !learnedSkillIds.has(skill.prerequisite_skill_id)) {
        return true
      }
      return false
    },
    [learnedSkillIds]
  )

  // 获取前置技能名称
  const getPrerequisiteName = useCallback(
    (skill: SkillWithLearnedState): string | null => {
      if (!skill.prerequisite_skill_id) return null
      const prereq = skills.find(s => s.id === skill.prerequisite_skill_id)
      return prereq?.name || null
    },
    [skills]
  )

  const handleLearnClick = useCallback(
    (skill: SkillWithLearnedState) => {
      if (!skill.is_learned && canLearnSkill(skill)) {
        setLearningSkill(skill)
      }
    },
    [canLearnSkill]
  )

  const handleConfirmLearn = useCallback(async () => {
    if (!learningSkill) return
    await learnSkill(learningSkill.id)
    setLearningSkill(null)
  }, [learningSkill, learnSkill])

  const handleCancelLearn = useCallback(() => {
    setLearningSkill(null)
  }, [])

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 技能点 */}
      {character != null && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {/* 全部选项 */}
            <button
              onClick={() => setSelectedBranch('all')}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                selectedBranch === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              全部
            </button>
            {/* 分支选项 */}
            {availableBranches.map(branch => {
              const config = BRANCH_CONFIG[branch]
              return (
                <button
                  key={branch}
                  onClick={() => setSelectedBranch(branch)}
                  className={`flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    selectedBranch === branch
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <span>{config?.icon}</span>
                  <span>{config?.name || branch}</span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm sm:text-base">技能点</span>
            <span className="text-primary dark:text-primary text-lg font-bold sm:text-xl">
              {character.skill_points}
            </span>
          </div>
        </div>
      )}

      {/* 技能列表 - 按分支和层级显示 */}
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <h4 className="text-foreground mb-3 text-base font-medium sm:mb-4 sm:text-lg">技能树</h4>
        {filteredSkills.length > 0 ? (
          <div className="space-y-4">
            {/* 按层级显示 */}
            {[1, 2, 3].map(tier => {
              const tierSkills = filteredSkills.filter(s => (s.tier || 1) === tier)
              if (tierSkills.length === 0) return null
              return (
                <div key={tier}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-muted-foreground text-xs uppercase">Tier {tier}</span>
                    <div className="bg-border h-px flex-1" />
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {tierSkills.map(skill => (
                      <SkillCard
                        key={skill.id}
                        skill={skill}
                        onLearn={() => handleLearnClick(skill)}
                        canLearn={canLearnSkill(skill)}
                        isLocked={isSkillLocked(skill)}
                        prereqName={getPrerequisiteName(skill)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">还没有任何技能</p>
        )}
      </div>

      {/* 学习确认弹窗 */}
      {learningSkill && !learningSkill.is_learned && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
            <h4 className="text-foreground mb-3 text-base font-bold sm:mb-4 sm:text-lg">
              学习技能
            </h4>
            <p className="text-muted-foreground mb-2 text-sm sm:text-base">
              确定要学习
              <span className="text-primary dark:text-primary mx-1">{learningSkill.name}</span>
              吗？
            </p>
            <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
              将消耗{' '}
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {learningSkill.skill_points_cost ?? 1}
              </span>{' '}
              技能点
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelLearn}
                className="bg-muted text-foreground hover:bg-secondary rounded px-3 py-2 text-sm sm:px-4"
                disabled={isLoading}
              >
                取消
              </button>
              <button
                onClick={handleConfirmLearn}
                className="bg-primary hover:bg-primary/90 rounded px-3 py-2 text-sm text-white sm:px-4"
                disabled={isLoading}
              >
                {isLoading ? '学习中...' : '确认学习'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SkillCard({
  skill,
  onLearn,
  canLearn,
  isLocked,
  prereqName,
}: {
  skill: SkillWithLearnedState
  onLearn: () => void
  canLearn: boolean
  isLocked: boolean
  prereqName: string | null
}) {
  const isLearned = skill.is_learned
  const skillName = skill.name || '未知技能'
  const skillDescription = skill.description ?? ''
  const skillPointsCost = skill.skill_points_cost ?? 1
  const isPassive = skill.type === 'passive'
  const targetTypeText = skill.target_type === 'all' ? '群体' : '单体'

  // 样式
  let cardClass = 'w-full items-center gap-2 rounded-lg p-2 text-left transition-all sm:p-2.5 '
  if (isLearned) {
    cardClass += 'bg-green-900/30 border border-green-600/50'
  } else if (isLocked) {
    cardClass += 'bg-muted/30 opacity-60 border border-dashed border-muted-foreground/30'
  } else if (canLearn) {
    cardClass += 'bg-muted/50 hover:bg-muted/70 cursor-pointer border border-primary/30'
  } else {
    cardClass += 'bg-muted/30 opacity-50'
  }

  return (
    <div className={cardClass}>
      <SkillIcon skillId={skill.id} icon={skill.icon} name={skillName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-medium sm:text-base">{skillName}</span>
          {isLocked && (
            <span className="shrink-0 rounded bg-yellow-600/20 px-1.5 py-0.5 text-[10px] text-yellow-600 dark:text-yellow-400">
              需 {prereqName}
            </span>
          )}
          {isLearned && (
            <span className="shrink-0 rounded bg-green-600/20 px-1.5 py-0.5 text-[10px] text-green-600 dark:text-green-400">
              已学会
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{skillDescription}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="text-muted-foreground text-xs">{isPassive ? '被动' : '主动'}</span>
          {!isPassive && (
            <span className="text-xs text-purple-500 dark:text-purple-400">{targetTypeText}</span>
          )}
          {!isPassive && skill.cooldown != null && skill.cooldown > 0 && (
            <span className="text-xs text-red-500 dark:text-red-400">CD {skill.cooldown}s</span>
          )}
          {!isLearned && !isLocked && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              {skillPointsCost}点
            </span>
          )}
        </div>
      </div>
      {!isLearned && !isLocked && (
        <button
          onClick={onLearn}
          disabled={!canLearn}
          className={`shrink-0 rounded px-2 py-1 text-xs text-white transition-colors ${
            canLearn ? 'bg-green-600 hover:bg-green-700' : 'bg-muted cursor-not-allowed'
          }`}
        >
          学习
        </button>
      )}
    </div>
  )
}
