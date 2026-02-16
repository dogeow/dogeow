'use client'

import { useState, useMemo, useCallback } from 'react'
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
  const [selectedSkill, setSelectedSkill] = useState<SkillWithLearnedState | null>(null)
  const [showLearnConfirm, setShowLearnConfirm] = useState(false)

  const handleLearn = useCallback(async () => {
    if (!selectedSkill) return
    await learnSkill(selectedSkill.id)
    setShowLearnConfirm(false)
    setSelectedSkill(null)
  }, [selectedSkill, learnSkill])

  const handleSkillCardClick = useCallback((skill: SkillWithLearnedState) => {
    if (skill.is_learned) {
      setSelectedSkill(prev => (prev?.id === skill.id ? null : skill))
    } else {
      setSelectedSkill(skill)
      setShowLearnConfirm(true)
    }
  }, [])

  const clearSelection = useCallback(() => {
    setShowLearnConfirm(false)
    setSelectedSkill(null)
  }, [])

  return (
    <div className="space-y-3 sm:space-y-4">
      {character != null && (
        <div className="bg-muted/50 text-foreground flex items-center justify-between rounded-lg px-3 py-2 sm:px-4 sm:py-2.5">
          <span className="text-sm font-medium sm:text-base">技能点</span>
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
              <SkillCard
                key={skill.id}
                skill={skill}
                isSelected={selectedSkill?.id === skill.id}
                onClick={() => handleSkillCardClick(skill)}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-4 text-center text-sm">还没有任何技能</p>
        )}
      </div>

      {/* 选中技能详情 */}
      {selectedSkill && <SkillDetailPanel selectedSkill={selectedSkill} />}

      {/* 学习确认弹窗 */}
      {showLearnConfirm && selectedSkill && !selectedSkill.is_learned && (
        <LearnSkillModal
          skill={selectedSkill}
          onCancel={clearSelection}
          onConfirm={handleLearn}
          loading={isLoading}
        />
      )}
    </div>
  )
}

function SkillSection({
  title,
  emptyText,
  children,
}: {
  title: string
  emptyText: string
  children: React.ReactNode
}) {
  const isEmpty = !children || (Array.isArray(children) && children.length === 0)
  return (
    <div className="bg-card border-border min-w-0 flex-1 rounded-lg border p-3 sm:p-4">
      <h4 className="text-foreground mb-3 text-base font-medium sm:mb-4 sm:text-lg">{title}</h4>
      {isEmpty ? (
        <p className="text-muted-foreground py-4 text-center text-sm">{emptyText}</p>
      ) : (
        children
      )}
    </div>
  )
}

function SkillDetailPanel({ selectedSkill }: { selectedSkill: SkillWithLearnedState }) {
  const isLearned = selectedSkill.is_learned
  const level = selectedSkill.level ?? 1
  const maxLevel = selectedSkill.max_level
  const type = selectedSkill.type
  const cooldown = selectedSkill.cooldown
  const targetType = selectedSkill.target_type

  let damage: number | null = null
  let manaCost: number | null = null
  if (type === 'active') {
    const effectiveLevel = isLearned ? level : maxLevel
    damage = selectedSkill.base_damage + selectedSkill.damage_per_level * (effectiveLevel - 1)
    manaCost = selectedSkill.mana_cost + selectedSkill.mana_cost_per_level * (effectiveLevel - 1)
  }

  const targetTypeText = targetType === 'all' ? '群体' : '单体'

  return (
    <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
      <div className="mb-3 flex items-start justify-between sm:mb-4">
        <div>
          <h5 className="text-foreground text-lg font-bold sm:text-xl">{selectedSkill.name}</h5>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {selectedSkill.description ?? ''}
          </p>
        </div>
        <div className="text-right">
          {!isLearned && (
            <p className="text-xs text-green-600 sm:text-sm dark:text-green-400">未学习</p>
          )}
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2 sm:mb-4 sm:gap-4">
        {type === 'active' && (
          <>
            <SkillAttr
              label="伤害"
              value={damage!}
              valueClass="text-orange-500 dark:text-orange-400"
            />
            <SkillAttr
              label="法力消耗"
              value={manaCost!}
              valueClass="text-blue-500 dark:text-blue-400"
            />
            <SkillAttr
              label="攻击范围"
              value={targetTypeText}
              valueClass="text-purple-500 dark:text-purple-400"
            />
          </>
        )}
        <SkillAttr
          label="类型"
          value={type === 'active' ? '主动技能' : '被动技能'}
          valueClass="text-foreground"
        />
        <SkillAttr
          label="冷却时间"
          value={cooldown != null ? `${cooldown}s` : '-'}
          valueClass="text-foreground"
        />
      </div>
    </div>
  )
}

function SkillAttr({
  label,
  value,
  valueClass = '',
}: {
  label: string
  value: React.ReactNode
  valueClass?: string
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-2 sm:p-3">
      <p className="text-muted-foreground text-xs sm:text-sm">{label}</p>
      <p className={`text-sm font-bold sm:text-base ${valueClass}`}>{value}</p>
    </div>
  )
}

function LearnSkillModal({
  skill,
  onCancel,
  onConfirm,
  loading,
}: {
  skill: SkillWithLearnedState
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  const cost = skill.skill_points_cost ?? 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
        <h4 className="text-foreground mb-3 text-base font-bold sm:mb-4 sm:text-lg">学习技能</h4>
        <p className="text-muted-foreground mb-2 text-sm sm:text-base">
          确定要学习
          <span className="text-primary dark:text-primary mx-1">{skill.name}</span>
          吗？
        </p>
        <p className="text-muted-foreground mb-4 text-xs sm:text-sm">
          将消耗 <span className="font-medium text-yellow-600 dark:text-yellow-400">{cost}</span>{' '}
          技能点
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="bg-muted text-foreground hover:bg-secondary rounded px-3 py-2 text-sm sm:px-4"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="bg-primary hover:bg-primary/90 rounded px-3 py-2 text-sm text-white sm:px-4"
            disabled={loading}
          >
            {loading ? '学习中...' : '确认学习'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SkillCard({
  skill,
  isSelected,
  onClick,
}: {
  skill: SkillWithLearnedState
  isSelected: boolean
  onClick: () => void
}) {
  const isLearned = skill.is_learned
  const skillName = skill.name || '未知技能'
  const skillDescription = skill.description ?? ''
  const skillPointsCost = skill.skill_points_cost ?? 1
  const isPassive = skill.type === 'passive'
  const targetTypeText = skill.target_type === 'all' ? '群体' : '单体'

  const cardClass = (() => {
    if (isSelected)
      return 'border-primary bg-primary/30 dark:border-primary dark:bg-primary/20 border'
    if (isLearned) return 'bg-muted/50 hover:bg-muted'
    return 'bg-muted/30 hover:bg-muted/50'
  })()

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-all sm:p-3 ${cardClass}`}
    >
      <SkillIcon skillId={skill.id} icon={skill.icon} name={skillName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-foreground text-sm font-medium sm:text-base">{skillName}</span>
          {!isLearned && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              {skillPointsCost}点
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{skillDescription}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-muted-foreground text-xs">{isPassive ? '被动' : '主动'}</span>
        {!isPassive && (
          <span className="text-xs text-purple-500 dark:text-purple-400">{targetTypeText}</span>
        )}
      </div>
    </button>
  )
}
