'use client'

import { useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { CLASS_NAMES } from '../types'

interface CreateCharacterProps {
  onCreateSuccess?: () => void
}

export function CreateCharacter({ onCreateSuccess }: CreateCharacterProps) {
  const { createCharacter, isLoading, error, fetchCharacters } = useGameStore()
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState<'warrior' | 'mage' | 'ranger'>('warrior')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await createCharacter(name.trim(), selectedClass)
      // 创建成功后刷新角色列表
      await fetchCharacters()
      onCreateSuccess?.()
    } catch (err) {
      console.error('创建角色失败:', err)
    }
  }

  const classDescriptions = {
    warrior: {
      title: '战士',
      desc: '高生命、高攻击的近战职业',
      stats: '力量+5, 体力+5',
      icon: '⚔️',
    },
    mage: {
      title: '法师',
      desc: '高法力、高技能伤害的魔法职业',
      stats: '能量+10, 智力+5',
      icon: '🔮',
    },
    ranger: {
      title: '游侠',
      desc: '高敏捷、高暴击的远程职业',
      stats: '敏捷+10, 暴击+5%',
      icon: '🏹',
    },
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-white">创建角色</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">角色名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入角色名称"
              maxLength={16}
              className="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">选择职业</label>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(classDescriptions) as Array<keyof typeof classDescriptions>).map(
                cls => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`min-w-[calc(33.333%-8px)] flex-1 rounded-lg border-2 p-3 transition-all ${
                      selectedClass === cls
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="mb-2 text-3xl">{classDescriptions[cls].icon}</div>
                    <div className="text-sm font-medium text-white">
                      {classDescriptions[cls].title}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="rounded-lg bg-gray-700/50 p-4">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl">{classDescriptions[selectedClass].icon}</span>
              <span className="text-lg font-medium text-white">
                {classDescriptions[selectedClass].title}
              </span>
            </div>
            <p className="mb-2 text-sm text-gray-400">{classDescriptions[selectedClass].desc}</p>
            <p className="text-sm text-green-400">{classDescriptions[selectedClass].stats}</p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500 bg-red-500/20 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-600"
          >
            {isLoading ? '创建中...' : '创建角色'}
          </button>
        </form>
      </div>
    </div>
  )
}
