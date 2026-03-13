'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useGameStore } from '../../stores/gameStore'
import type { SkillWithLearnedState, CharacterClass } from '../../types'
import { gameAsset } from '@/lib/helpers/assets'

/** 技能图标 */
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
  const src = gameAsset(`/game/rpg/skills/skill_${skillId}.png`)
  return (
    <span className="bg-muted relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded text-lg">
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
  warrior: { name: '力量', color: 'text-orange-500', icon: '⚔️' },
  defense: { name: '防御', color: 'text-gray-500', icon: '🛡️' },
  berserker: { name: '狂暴', color: 'text-red-600', icon: '💢' },
  fire: { name: '火焰', color: 'text-red-500', icon: '🔥' },
  ice: { name: '冰霜', color: 'text-blue-500', icon: '❄️' },
  lightning: { name: '闪电', color: 'text-yellow-500', icon: '⚡' },
  arcane: { name: '奥术', color: 'text-pink-500', icon: '🔮' },
  summon: { name: '召唤', color: 'text-purple-600', icon: '👻' },
  ranger: { name: '敏捷', color: 'text-green-500', icon: '🏹' },
  poison: { name: '毒系', color: 'text-green-600', icon: '☠️' },
  trap: { name: '陷阱', color: 'text-amber-600', icon: '🪤' },
  beast: { name: '野兽', color: 'text-amber-700', icon: '🐺' },
  passive: { name: '被动', color: 'text-purple-500', icon: '✨' },
}

/** 单个技能卡片 */
function SkillCard({
  skill,
  learnedSkillIds,
  canLearnSkill,
  isSkillLocked,
  onLearn,
  getPrerequisiteName,
  prerequisiteSkill,
}: {
  skill: SkillWithLearnedState
  learnedSkillIds: Set<number>
  canLearnSkill: (skill: SkillWithLearnedState) => boolean
  isSkillLocked: (skill: SkillWithLearnedState) => boolean
  onLearn: (skill: SkillWithLearnedState) => void
  getPrerequisiteName: (skill: SkillWithLearnedState) => string | null
  prerequisiteSkill?: SkillWithLearnedState | null
}) {
  const isLearned = learnedSkillIds.has(skill.id)
  const canLearn = canLearnSkill(skill)
  const isLocked = isSkillLocked(skill)
  const prereqName = getPrerequisiteName(skill)

  let cardClass = 'flex items-center gap-2 rounded-lg p-2 transition-all '
  if (isLearned) {
    cardClass += 'bg-green-900/30 border-2 border-green-600'
  } else if (isLocked) {
    cardClass += 'bg-muted/30 border border-dashed border-muted-foreground/30 opacity-60'
  } else if (canLearn) {
    cardClass += 'bg-muted/50 border-2 border-primary/30 hover:border-primary cursor-pointer'
  } else {
    cardClass += 'bg-muted/30 opacity-50'
  }

  return (
    <div
      className={cardClass}
      onClick={() => !isLearned && !isLocked && canLearn && onLearn(skill)}
    >
      <SkillIcon skillId={skill.id} icon={skill.icon} name={skill.name || ''} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-medium">{skill.name}</span>
          {isLocked && prereqName && (
            <span className="shrink-0 rounded bg-yellow-600/20 px-1.5 py-0.5 text-[10px] text-yellow-600">
              需 {prereqName}
            </span>
          )}
          {isLearned && (
            <span className="shrink-0 rounded bg-green-600/20 px-1.5 py-0.5 text-[10px] text-green-600">
              已学
            </span>
          )}
        </div>
        <p className="text-muted-foreground truncate text-xs">{skill.description}</p>

        {/* 显示前置依赖 */}
        {prerequisiteSkill && !isLearned && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span className="text-muted-foreground">前置:</span>
            {learnedSkillIds.has(prerequisiteSkill.id) ? (
              <span className="text-green-500">✓ {prerequisiteSkill.name}</span>
            ) : (
              <span className="text-red-500">✗ {prerequisiteSkill.name}</span>
            )}
          </div>
        )}

        <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
          <span className="text-muted-foreground">
            {skill.type === 'passive' ? '被动' : '主动'}
          </span>
          {skill.type !== 'passive' && (
            <span className="text-purple-500">{skill.target_type === 'all' ? '群体' : '单体'}</span>
          )}
          {skill.type !== 'passive' && skill.cooldown != null && skill.cooldown > 0 && (
            <span className="text-red-500">CD {skill.cooldown}s</span>
          )}
          {!isLearned && !isLocked && (
            <span className="text-yellow-600">{skill.skill_points_cost || 1}点</span>
          )}
        </div>
      </div>
      {!isLearned && !isLocked && (
        <button
          onClick={e => {
            e.stopPropagation()
            canLearn && onLearn(skill)
          }}
          disabled={!canLearn}
          className={`shrink-0 rounded px-2 py-1 text-xs text-white ${canLearn ? 'bg-green-600 hover:bg-green-700' : 'bg-muted cursor-not-allowed'}`}
        >
          学习
        </button>
      )}
    </div>
  )
}

/** 技能分支视图 - 简单列表 */
function BranchView({
  branch,
  skills,
  learnedSkillIds,
  canLearnSkill,
  isSkillLocked,
  onLearn,
  getPrerequisiteName,
  getPrerequisiteSkill,
}: {
  branch: string
  skills: SkillWithLearnedState[]
  learnedSkillIds: Set<number>
  canLearnSkill: (skill: SkillWithLearnedState) => boolean
  isSkillLocked: (skill: SkillWithLearnedState) => boolean
  onLearn: (skill: SkillWithLearnedState) => void
  getPrerequisiteName: (skill: SkillWithLearnedState) => string | null
  getPrerequisiteSkill: (skillId: number) => SkillWithLearnedState | null
}) {
  const config = BRANCH_CONFIG[branch]

  // 按层级分组
  const tierGroups = useMemo(() => {
    const groups: Record<number, SkillWithLearnedState[]> = {}
    for (const skill of skills) {
      const tier = skill.tier || 1
      if (!groups[tier]) groups[tier] = []
      groups[tier].push(skill)
    }
    return Object.entries(groups)
      .map(([tier, list]) => ({ tier: Number(tier), list }))
      .sort((a, b) => a.tier - b.tier)
  }, [skills])

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <div className="border-border mb-4 flex items-center gap-2 border-b pb-2">
        <span className="text-xl">{config?.icon}</span>
        <span className="text-lg font-bold">{config?.name || branch}</span>
      </div>
      <div className="space-y-4">
        {tierGroups.map(({ tier, list }) => (
          <div key={tier}>
            <div className="mb-2 flex items-center gap-2">
              <span className="bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs">
                Tier {tier}
              </span>
              <div className="bg-border h-px flex-1" />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {list.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  learnedSkillIds={learnedSkillIds}
                  canLearnSkill={canLearnSkill}
                  isSkillLocked={isSkillLocked}
                  onLearn={onLearn}
                  getPrerequisiteName={getPrerequisiteName}
                  prerequisiteSkill={
                    skill.prerequisite_skill_id
                      ? getPrerequisiteSkill(skill.prerequisite_skill_id)
                      : null
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkillPanel() {
  const { character, skills, learnSkill, isLoading } = useGameStore()
  const [learningSkill, setLearningSkill] = useState<SkillWithLearnedState | null>(null)
  const [selectedBranch, setSelectedBranch] = useState<string>('all')

  const characterClass = character?.class as CharacterClass | undefined

  // 已学习的技能ID集合
  const learnedSkillIds = useMemo(() => {
    return new Set(skills.filter(s => s.is_learned).map(s => s.id))
  }, [skills])

  // 获取可用分支
  const availableBranches = useMemo(() => {
    const branches = new Set<string>()
    for (const skill of skills) {
      if (skill.branch === 'passive') {
        branches.add('passive')
        continue
      }
      if (skill.class_restriction === 'all' || skill.class_restriction === characterClass) {
        branches.add(skill.branch || 'other')
      }
    }
    return Array.from(branches).sort()
  }, [skills, characterClass])

  // 按分支分组技能
  const skillsByBranch = useMemo(() => {
    const groups: Record<string, SkillWithLearnedState[]> = {}
    for (const skill of skills) {
      const branch = skill.branch || 'other'
      if (!groups[branch]) groups[branch] = []
      groups[branch].push(skill)
    }
    return groups
  }, [skills])

  const canLearnSkill = useCallback(
    (skill: SkillWithLearnedState): boolean => {
      if (skill.is_learned) return false
      if (!character || character.skill_points < (skill.skill_points_cost || 1)) return false

      // 优先使用 effect_key 判断前置条件
      if (skill.prerequisite_effect_key) {
        const learnedEffectKeys = skills
          .filter(s => learnedSkillIds.has(s.id) && s.effect_key)
          .map(s => s.effect_key as string)
        if (!learnedEffectKeys.includes(skill.prerequisite_effect_key)) {
          return false
        }
      } else if (skill.prerequisite_skill_id && !learnedSkillIds.has(skill.prerequisite_skill_id)) {
        return false
      }
      return true
    },
    [character, learnedSkillIds, skills]
  )

  const isSkillLocked = useCallback(
    (skill: SkillWithLearnedState): boolean => {
      if (skill.is_learned) return false
      // 优先使用 effect_key 判断前置条件
      if (skill.prerequisite_effect_key) {
        const learnedEffectKeys = skills
          .filter(s => learnedSkillIds.has(s.id) && s.effect_key)
          .map(s => s.effect_key as string)
        if (!learnedEffectKeys.includes(skill.prerequisite_effect_key)) {
          return true
        }
      } else if (skill.prerequisite_skill_id && !learnedSkillIds.has(skill.prerequisite_skill_id)) {
        return true
      }
      return false
    },
    [learnedSkillIds, skills]
  )

  const getPrerequisiteName = useCallback(
    (skill: SkillWithLearnedState): string | null => {
      // 优先使用 effect_key
      if (skill.prerequisite_effect_key) {
        const prereq = skills.find(s => s.effect_key === skill.prerequisite_effect_key)
        return prereq?.name || null
      }
      if (!skill.prerequisite_skill_id) return null
      const prereq = skills.find(s => s.id === skill.prerequisite_skill_id)
      return prereq?.name || null
    },
    [skills]
  )

  const getPrerequisiteSkill = useCallback(
    (skillId: number): SkillWithLearnedState | null => {
      return skills.find(s => s.id === skillId) ?? null
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
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
            {availableBranches.map(branch => {
              const config = BRANCH_CONFIG[branch]
              const count = skillsByBranch[branch]?.length ?? 0
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
                  <span className="text-xs opacity-60">({count})</span>
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm sm:text-base">技能点</span>
            <span className="text-primary text-lg font-bold sm:text-xl">
              {character.skill_points}
            </span>
          </div>
        </div>
      )}

      {/* 技能列表 */}
      <div className="max-h-[500px] space-y-4 overflow-y-auto pr-2">
        {selectedBranch === 'all' ? (
          // 显示所有分支
          availableBranches.map(branch => (
            <BranchView
              key={branch}
              branch={branch}
              skills={skillsByBranch[branch] || []}
              learnedSkillIds={learnedSkillIds}
              canLearnSkill={canLearnSkill}
              isSkillLocked={isSkillLocked}
              onLearn={handleLearnClick}
              getPrerequisiteName={getPrerequisiteName}
              getPrerequisiteSkill={getPrerequisiteSkill}
            />
          ))
        ) : (
          // 只显示选中的分支
          <BranchView
            branch={selectedBranch}
            skills={skillsByBranch[selectedBranch] || []}
            learnedSkillIds={learnedSkillIds}
            canLearnSkill={canLearnSkill}
            isSkillLocked={isSkillLocked}
            onLearn={handleLearnClick}
            getPrerequisiteName={getPrerequisiteName}
            getPrerequisiteSkill={getPrerequisiteSkill}
          />
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
              确定要学习 <span className="text-primary mx-1">{learningSkill.name}</span> 吗？
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
