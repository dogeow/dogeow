'use client'

import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { CharacterSkill, SkillDefinition } from '../types'

export function SkillPanel() {
  const { character, skills, availableSkills, learnSkill, isLoading } = useGameStore()
  const [selectedSkill, setSelectedSkill] = useState<CharacterSkill | SkillDefinition | null>(null)
  const [showLearnConfirm, setShowLearnConfirm] = useState(false)

  const learnedSkillIds = skills.map(s => s.skill_id)
  const unlearnedSkills = availableSkills.filter(s => !learnedSkillIds.includes(s.id))

  const handleLearn = async () => {
    if (!selectedSkill || !('class_restriction' in selectedSkill)) return
    await learnSkill(selectedSkill.id)
    setShowLearnConfirm(false)
    setSelectedSkill(null)
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
        {/* 已学技能 - 移动端优化 */}
        <div className="rounded-lg bg-gray-800 p-3 sm:p-4">
          <h4 className="mb-3 text-base font-medium text-white sm:mb-4 sm:text-lg">已学技能</h4>

          {skills.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">还没有学习任何技能</p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {skills.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  isSelected={selectedSkill?.id === skill.id}
                  onClick={() => {
                    console.log(
                      '[SkillCard] Clicked skill:',
                      skill.skill?.name,
                      'type:',
                      skill.skill?.type,
                      'is CharacterSkill:',
                      'level' in skill
                    )
                    setSelectedSkill(selectedSkill?.id === skill.id ? null : skill)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 可学习技能 - 移动端优化 */}
        <div className="rounded-lg bg-gray-800 p-3 sm:p-4">
          <h4 className="mb-3 text-base font-medium text-white sm:mb-4 sm:text-lg">可学习技能</h4>

          {unlearnedSkills.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">没有可学习的技能</p>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {unlearnedSkills.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => {
                    setSelectedSkill(skill)
                    setShowLearnConfirm(true)
                  }}
                  className="w-full rounded-lg bg-gray-700/50 p-2.5 text-left transition-colors hover:bg-gray-700 sm:p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white sm:text-base">
                      {skill.name}
                    </span>
                    <span className="text-xs text-purple-400">
                      {skill.type === 'active' ? '主动' : '被动'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400 sm:text-sm">{skill.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 选中技能详情 - 移动端优化 */}
      {selectedSkill && (
        <div className="rounded-lg bg-gray-800 p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between sm:mb-4">
            <div>
              <h5 className="text-lg font-bold text-white sm:text-xl">
                {'skill' in selectedSkill ? selectedSkill.skill.name : selectedSkill.name}
              </h5>
              <p className="text-xs text-gray-400 sm:text-sm">
                {'skill' in selectedSkill
                  ? selectedSkill.skill.description
                  : selectedSkill.description}
              </p>
            </div>
            <div className="text-right">
              {'level' in selectedSkill ? (
                <>
                  <p className="text-sm font-bold text-purple-400 sm:text-base">
                    Lv.{selectedSkill.level}
                  </p>
                  <p className="text-xs text-gray-400">最高 {selectedSkill.skill.max_level} 级</p>
                </>
              ) : (
                <p className="text-xs text-green-400 sm:text-sm">未学习</p>
              )}
            </div>
          </div>

          {/* 已学技能才显示属性 */}
          {'skill' in selectedSkill && (
            <>
              <div className="mb-3 grid grid-cols-2 gap-2 sm:mb-4 sm:gap-4">
                {selectedSkill.skill.type === 'active' && (
                  <>
                    <div className="rounded-lg bg-gray-700/50 p-2 sm:p-3">
                      <p className="text-xs text-gray-400 sm:text-sm">伤害</p>
                      <p className="text-sm font-bold text-orange-400 sm:text-base">
                        {selectedSkill.skill.base_damage +
                          selectedSkill.skill.damage_per_level *
                            (selectedSkill.skill.max_level - 1)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-700/50 p-2 sm:p-3">
                      <p className="text-xs text-gray-400 sm:text-sm">法力消耗</p>
                      <p className="text-sm font-bold text-blue-400 sm:text-base">
                        {selectedSkill.skill.mana_cost +
                          selectedSkill.skill.mana_cost_per_level *
                            (selectedSkill.skill.max_level - 1)}
                      </p>
                    </div>
                  </>
                )}
                <div className="rounded-lg bg-gray-700/50 p-2 sm:p-3">
                  <p className="text-xs text-gray-400 sm:text-sm">类型</p>
                  <p className="text-sm font-bold text-white sm:text-base">
                    {selectedSkill.skill.type === 'active' ? '主动技能' : '被动技能'}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-700/50 p-2 sm:p-3">
                  <p className="text-xs text-gray-400 sm:text-sm">冷却时间</p>
                  <p className="text-sm font-bold text-white sm:text-base">
                    {selectedSkill.skill.cooldown}s
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 学习确认 - 移动端优化 */}
      {showLearnConfirm && selectedSkill && !('level' in selectedSkill) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-gray-800 p-4 sm:p-6">
            <h4 className="mb-3 text-base font-bold text-white sm:mb-4 sm:text-lg">学习技能</h4>
            <p className="mb-2 text-sm text-gray-300 sm:text-base">
              确定要学习
              <span className="mx-1 text-purple-400">{selectedSkill.name}</span>
              吗？
            </p>
            <p className="mb-4 text-xs text-gray-400 sm:text-sm">将消耗1技能点</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowLearnConfirm(false)
                  setSelectedSkill(null)
                }}
                className="rounded bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-500 sm:px-4"
              >
                取消
              </button>
              <button
                onClick={handleLearn}
                className="rounded bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-700 sm:px-4"
              >
                确认学习
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
  isSelected,
  onClick,
}: {
  skill: CharacterSkill
  isSelected: boolean
  onClick: () => void
}) {
  // 防御性检查 - 确保 skill 对象和 skill 属性都存在
  const skillName = skill?.skill?.name || '未知技能'
  const skillDescription = skill?.skill?.description || ''
  const skillIcon = skill?.skill?.icon

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg p-2.5 text-left transition-all sm:p-3 ${
        isSelected
          ? 'border border-purple-500 bg-purple-600/30'
          : 'bg-gray-700/50 hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white sm:text-base">{skillName}</span>
      </div>
      <p className="mt-1 text-xs text-gray-400">{skillDescription}</p>
    </button>
  )
}
