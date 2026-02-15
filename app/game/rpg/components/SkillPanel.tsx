'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { useGameStore } from '../stores/gameStore'
import { CharacterSkill, SkillDefinition } from '../types'

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
  const { character, skills, availableSkills, learnSkill, isLoading } = useGameStore()
  const [selectedSkill, setSelectedSkill] = useState<CharacterSkill | SkillDefinition | null>(null)
  const [showLearnConfirm, setShowLearnConfirm] = useState(false)

  // 过滤无效项，防止接口返回不完整或历史脏数据时报错
  const validSkills = useMemo(
    () =>
      skills.filter((s): s is CharacterSkill => s != null && 'skill_id' in s && s.skill != null),
    [skills]
  )
  const learnedSkillIds = useMemo(() => validSkills.map(s => s.skill_id), [validSkills])
  const unlearnedSkills = useMemo(
    () => availableSkills.filter(s => !learnedSkillIds.includes(s.id)),
    [availableSkills, learnedSkillIds]
  )

  // 优化 handleLearn，避免多余渲染
  const handleLearn = useCallback(async () => {
    if (!selectedSkill || !('class_restriction' in selectedSkill)) return
    await learnSkill(selectedSkill.id)
    setShowLearnConfirm(false)
    setSelectedSkill(null)
  }, [selectedSkill, learnSkill])

  const handleSkillCardClick = useCallback((skill: CharacterSkill) => {
    setSelectedSkill(prev => (prev?.id === skill.id ? null : skill))
  }, [])

  const handleUnlearnedSkillClick = useCallback((skill: SkillDefinition) => {
    setSelectedSkill(skill)
    setShowLearnConfirm(true)
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
          <span className="text-lg font-bold text-purple-600 sm:text-xl dark:text-purple-400">
            {character.skill_points}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row">
        {/* 已学技能 */}
        <SkillSection title="已学技能" emptyText="还没有学习任何技能">
          {skills.length > 0 && (
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
          )}
        </SkillSection>

        {/* 可学习技能 */}
        <SkillSection title="可学习技能" emptyText="没有可学习的技能">
          {unlearnedSkills.length > 0 && (
            <div className="space-y-1.5 sm:space-y-2">
              {unlearnedSkills.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => handleUnlearnedSkillClick(skill)}
                  className="bg-muted/50 hover:bg-muted flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors sm:p-3"
                  disabled={isLoading}
                >
                  <SkillIcon skillId={skill.id} icon={skill.icon} name={skill.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-sm font-medium sm:text-base">
                        {skill.name}
                      </span>
                      <span className="text-xs text-purple-500 dark:text-purple-400">
                        {skill.type === 'active' ? '主动' : '被动'}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
                      {skill.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SkillSection>
      </div>

      {/* 选中技能详情 */}
      {selectedSkill && <SkillDetailPanel selectedSkill={selectedSkill} />}

      {/* 学习确认弹窗 */}
      {showLearnConfirm && selectedSkill && !('level' in selectedSkill) && (
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

function SkillDetailPanel({ selectedSkill }: { selectedSkill: CharacterSkill | SkillDefinition }) {
  const isLearned = 'level' in selectedSkill
  const hasSkillData = 'skill' in selectedSkill

  // 伤害与消耗显示（仅主动技能）
  let damage: number | null = null
  let manaCost: number | null = null
  let maxLevel: number | null = null
  let type: string = ''
  let cooldown: number | null = null
  if (hasSkillData) {
    const skill = selectedSkill.skill
    maxLevel = skill.max_level
    type = skill.type
    cooldown = skill.cooldown
    if (skill.type === 'active') {
      damage =
        skill.base_damage +
        skill.damage_per_level * ((isLearned ? selectedSkill.level : skill.max_level) - 1)
      manaCost =
        skill.mana_cost +
        skill.mana_cost_per_level * ((isLearned ? selectedSkill.level : skill.max_level) - 1)
    }
  }

  return (
    <div className="bg-card border-border rounded-lg border p-3 sm:p-4">
      <div className="mb-3 flex items-start justify-between sm:mb-4">
        <div>
          <h5 className="text-foreground text-lg font-bold sm:text-xl">
            {hasSkillData ? selectedSkill.skill.name : selectedSkill.name}
          </h5>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {hasSkillData ? selectedSkill.skill.description : selectedSkill.description}
          </p>
        </div>
        <div className="text-right">
          {isLearned ? (
            <>
              <p className="text-sm font-bold text-purple-500 sm:text-base dark:text-purple-400">
                Lv.{(selectedSkill as CharacterSkill).level}
              </p>
              <p className="text-muted-foreground text-xs">
                最高 {hasSkillData ? (selectedSkill as CharacterSkill).skill.max_level : ''} 级
              </p>
            </>
          ) : (
            <p className="text-xs text-green-600 sm:text-sm dark:text-green-400">未学习</p>
          )}
        </div>
      </div>
      {/* 技能属性展示 */}
      {hasSkillData && (
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
            </>
          )}
          <SkillAttr
            label="类型"
            value={type === 'active' ? '主动技能' : '被动技能'}
            valueClass="text-foreground"
          />
          <SkillAttr
            label="冷却时间"
            value={cooldown !== null ? `${cooldown}s` : '-'}
            valueClass="text-foreground"
          />
        </div>
      )}
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
  skill: SkillDefinition
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border-border w-full max-w-sm rounded-lg border p-4 sm:p-6">
        <h4 className="text-foreground mb-3 text-base font-bold sm:mb-4 sm:text-lg">学习技能</h4>
        <p className="text-muted-foreground mb-2 text-sm sm:text-base">
          确定要学习
          <span className="mx-1 text-purple-500 dark:text-purple-400">{skill.name}</span>
          吗？
        </p>
        <p className="text-muted-foreground mb-4 text-xs sm:text-sm">将消耗1技能点</p>
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
            className="rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 sm:px-4"
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
  skill: CharacterSkill
  isSelected: boolean
  onClick: () => void
}) {
  const skillName = skill?.skill?.name || '未知技能'
  const skillDescription = skill?.skill?.description || ''
  const def = skill?.skill

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-all sm:p-3 ${
        isSelected
          ? 'border border-purple-500 bg-purple-600/30 dark:border-purple-400 dark:bg-purple-500/20'
          : 'bg-muted/50 hover:bg-muted'
      }`}
    >
      {def && <SkillIcon skillId={def.id} icon={def.icon} name={skillName} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-foreground text-sm font-medium sm:text-base">{skillName}</span>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">{skillDescription}</p>
      </div>
    </button>
  )
}
