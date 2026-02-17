'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useGameStore } from '../../stores/gameStore'
import type { SkillWithLearnedState } from '../../types'

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

export function SkillPanel() {
  const { character, skills, learnSkill, isLoading } = useGameStore()
  const [learningSkill, setLearningSkill] = useState<SkillWithLearnedState | null>(null)

  const handleLearnClick = useCallback((skill: SkillWithLearnedState) => {
    if (!skill.is_learned) {
      setLearningSkill(skill)
    }
  }, [])

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
        <div className="flex items-center justify-end gap-2">
          <span className="text-muted-foreground text-sm sm:text-base">技能点</span>
          <span className="text-primary dark:text-primary text-lg font-bold sm:text-xl">
            {character.skill_points}
          </span>
        </div>
      )}

      {/* 技能列表 */}
      <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
        <h4 className="text-foreground mb-3 text-base font-medium sm:mb-4 sm:text-lg">技能列表</h4>
        {skills.length > 0 ? (
          <div className="space-y-1.5 sm:space-y-2">
            {skills.map(skill => (
              <SkillCard key={skill.id} skill={skill} onLearn={() => handleLearnClick(skill)} />
            ))}
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

function SkillCard({ skill, onLearn }: { skill: SkillWithLearnedState; onLearn: () => void }) {
  const isLearned = skill.is_learned
  const skillName = skill.name || '未知技能'
  const skillDescription = skill.description ?? ''
  const skillPointsCost = skill.skill_points_cost ?? 1
  const isPassive = skill.type === 'passive'
  const targetTypeText = skill.target_type === 'all' ? '群体' : '单体'

  const cardClass = isLearned ? 'bg-muted/50' : 'bg-muted/30 hover:bg-muted/50 cursor-pointer'

  return (
    <div
      className={`flex w-full items-center gap-2 rounded-lg p-2 text-left transition-all sm:p-2.5 ${cardClass}`}
    >
      <SkillIcon skillId={skill.id} icon={skill.icon} name={skillName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-foreground text-sm font-medium sm:text-base">{skillName}</span>
          <div className="flex flex-1 items-center justify-end gap-2">
            {!isLearned && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                {skillPointsCost}点
              </span>
            )}
            {!isLearned && (
              <button
                onClick={onLearn}
                className="shrink-0 rounded bg-green-600 px-2 py-0.5 text-xs text-white hover:bg-green-700"
              >
                学习
              </button>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{skillDescription}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className="text-muted-foreground text-xs">{isPassive ? '被动' : '主动'}</span>
          {!isPassive && (
            <span className="text-xs text-purple-500 dark:text-purple-400">{targetTypeText}</span>
          )}
          {!isPassive && skill.cooldown != null && skill.cooldown > 0 && (
            <span className="text-xs text-red-500 dark:text-red-400">CD {skill.cooldown}</span>
          )}
        </div>
      </div>
    </div>
  )
}
