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
      // 创建成功后拉取最新列表（与乐观更新双保险），再切到选择界面
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
      <div className="bg-card border-border w-full max-w-md rounded-lg border p-6 shadow-xl">
        <h2 className="text-foreground mb-6 text-center text-2xl font-bold">创建角色</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">角色名称</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="输入角色名称"
              maxLength={16}
              className="border-input bg-muted text-foreground placeholder:text-muted-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">选择职业</label>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(classDescriptions) as Array<keyof typeof classDescriptions>).map(
                cls => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setSelectedClass(cls)}
                    className={`min-w-[calc(33.333%-8px)] flex-1 rounded-lg border-2 p-3 transition-all ${
                      selectedClass === cls
                        ? 'border-primary bg-primary/20'
                        : 'border-border bg-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <div className="mb-2 text-3xl">{classDescriptions[cls].icon}</div>
                    <div className="text-foreground text-sm font-medium">
                      {classDescriptions[cls].title}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>

          <div className="bg-muted/50 border-border rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl">{classDescriptions[selectedClass].icon}</span>
              <span className="text-foreground text-lg font-medium">
                {classDescriptions[selectedClass].title}
              </span>
            </div>
            <p className="text-muted-foreground mb-2 text-sm">
              {classDescriptions[selectedClass].desc}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {classDescriptions[selectedClass].stats}
            </p>
          </div>

          {error && (
            <div className="border-destructive bg-destructive/20 text-destructive rounded-lg border p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="bg-primary text-primary-foreground w-full rounded-lg py-3 font-medium transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? '创建中...' : '创建角色'}
          </button>
        </form>
      </div>
    </div>
  )
}
