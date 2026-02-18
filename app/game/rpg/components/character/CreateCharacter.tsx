'use client'

import { useState, useCallback, memo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useGameStore } from '../../stores/gameStore'

interface CreateCharacterProps {
  onCreateSuccess?: () => void
  onBack?: () => void
}

const CLASS_OPTIONS = [
  {
    key: 'warrior',
    title: '战士',
    desc: '高生命值、高防御力，可以同时承受较多怪物的伤害',
    stats: '体力+3',
    icon: '⚔️',
  },
  {
    key: 'mage',
    title: '法师',
    desc: '多个群体伤害技能，但比较脆皮',
    stats: '能量+3',
    icon: '🔮',
  },
  {
    key: 'ranger',
    title: '游侠',
    desc: '身手矫健，躲避率高、暴击高',
    stats: '敏捷+3',
    icon: '🏹',
  },
] as const

type ClassKey = (typeof CLASS_OPTIONS)[number]['key']

const classDict = Object.fromEntries(CLASS_OPTIONS.map(opt => [opt.key, opt])) as Record<
  ClassKey,
  (typeof CLASS_OPTIONS)[number]
>

function CharacterForm({ onCreateSuccess, onBack }: CreateCharacterProps) {
  const { createCharacter, isLoading, error, fetchCharacters } = useGameStore()
  const [name, setName] = useState('')
  const [selectedClass, setSelectedClass] = useState<ClassKey>('warrior')

  const handleSetName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }, [])

  const handleSelectClass = useCallback((cls: ClassKey) => {
    setSelectedClass(cls)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = name.trim()
      if (!trimmed) return
      try {
        await createCharacter(trimmed, selectedClass)
        await fetchCharacters()
        onCreateSuccess?.()
      } catch (err) {
        // 错误会被全局 error 处理，保持简洁
      }
    },
    [name, selectedClass, createCharacter, fetchCharacters, onCreateSuccess]
  )

  const info = classDict[selectedClass]

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="bg-card border-border w-full max-w-md rounded-lg border p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors disabled:opacity-50"
              aria-label="返回选择角色"
            >
              <ArrowLeft className="h-5 w-5" />
              返回
            </button>
          ) : null}
          <h2 className="text-foreground flex-1 text-center text-2xl font-bold">创建角色</h2>
          {onBack ? <span className="w-14 shrink-0" aria-hidden /> : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-foreground mb-2 block text-sm font-medium" htmlFor="char-name">
              角色名称
            </label>
            <input
              id="char-name"
              type="text"
              value={name}
              onChange={handleSetName}
              placeholder="输入角色名称"
              maxLength={16}
              autoComplete="off"
              className="border-input bg-muted text-foreground placeholder:text-muted-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
              aria-label="角色名称"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-foreground mb-2 block text-sm font-medium">选择职业</label>
            <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="职业">
              {CLASS_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelectClass(opt.key)}
                  aria-pressed={selectedClass === opt.key}
                  aria-label={opt.title}
                  tabIndex={0}
                  className={`min-w-[calc(33.333%-8px)] flex-1 rounded-lg border-2 p-3 transition-all ${
                    selectedClass === opt.key
                      ? 'border-primary bg-primary/20'
                      : 'border-border bg-muted hover:border-muted-foreground/30'
                  } `}
                >
                  <div className="mb-2 text-3xl">{opt.icon}</div>
                  <div className="text-foreground text-sm font-medium">{opt.title}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-muted/50 border-border rounded-lg border p-4" aria-live="polite">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-2xl">{info.icon}</span>
              <span className="text-foreground text-lg font-medium">{info.title}</span>
            </div>
            <p className="text-muted-foreground mb-2 text-sm">{info.desc}</p>
            <p className="text-sm text-green-600 dark:text-green-400">{info.stats}</p>
          </div>

          {error && (
            <div
              className="border-destructive bg-destructive/20 text-destructive rounded-lg border p-3 text-sm"
              role="alert"
            >
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

export const CreateCharacter = memo(CharacterForm)
