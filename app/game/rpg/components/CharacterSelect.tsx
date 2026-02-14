'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '../stores/gameStore'
import { CreateCharacter } from './CreateCharacter'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

interface Character {
  id: number
  name: string
  class: string
  level: number
  experience: number
  gold: number
  is_fighting: boolean
  difficulty_tier?: number
}

interface CharacterSelectProps {
  onBack: () => void
  onCreateCharacter: () => void
}

const CLASS_INFO = {
  warrior: { name: '战士', icon: '⚔️', color: 'bg-red-500/20 border-red-500' },
  mage: { name: '法师', icon: '🔮', color: 'bg-blue-500/20 border-blue-500' },
  ranger: { name: '弓手', icon: '🏹', color: 'bg-green-500/20 border-green-500' },
}

const DIFFICULTY_OPTIONS: { tier: number; label: string }[] = [
  { tier: 0, label: '普通' },
  { tier: 1, label: '困难' },
  { tier: 2, label: '高手' },
  { tier: 3, label: '大师' },
  ...Array.from({ length: 6 }, (_, i) => ({ tier: i + 4, label: `痛苦${i + 1}` })),
]

export function CharacterSelect({ onBack, onCreateCharacter }: CharacterSelectProps) {
  const {
    characters,
    isLoading,
    error,
    fetchCharacters,
    selectCharacter,
    setDifficultyForCharacter,
  } = useGameStore()
  const [openCharacterId, setOpenCharacterId] = useState<number | null>(null)

  const openCharacter = characters?.find(c => c.id === openCharacterId)
  const currentTier = openCharacter?.difficulty_tier ?? 0

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  const handleDifficultySelect = (tier: number) => {
    if (openCharacterId != null) {
      setDifficultyForCharacter(openCharacterId, tier)
      setOpenCharacterId(null)
    }
  }

  const handleSelectCharacter = async (characterId: number) => {
    try {
      await selectCharacter(characterId)
    } catch (error) {
      console.error('选择角色失败:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">加载角色列表中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background text-foreground min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">选择角色</h1>
          <button
            onClick={onBack}
            className="bg-muted hover:bg-secondary rounded-lg px-4 py-2 transition-colors"
          >
            返回
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="border-destructive bg-destructive/20 text-destructive mb-4 rounded-lg border p-3 text-sm">
            {error}
          </div>
        )}

        {/* 角色列表 */}
        {characters && characters.length > 0 ? (
          <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-4">
            {characters.map(character => {
              const classInfo = CLASS_INFO[character.class as keyof typeof CLASS_INFO]
              const difficultyTier = character.difficulty_tier ?? 0
              return (
                <div
                  key={character.id}
                  className={`flex min-h-[180px] max-w-[200px] flex-1 flex-col rounded-lg border-2 p-3 sm:min-h-[200px] ${classInfo.color} cursor-pointer transition-transform hover:scale-[1.02]`}
                  onClick={() => handleSelectCharacter(character.id)}
                >
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden text-center">
                    <div className="flex-shrink-0">
                      <div className="text-xl sm:text-2xl">{classInfo.icon}</div>
                      <h3 className="mt-1 truncate text-xs font-bold sm:text-sm">
                        {character.name}
                      </h3>
                      <p className="text-muted-foreground text-xs">{classInfo.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setOpenCharacterId(character.id)
                      }}
                      className="border-border bg-card text-foreground hover:bg-muted w-full flex-shrink-0 rounded border px-2 py-1.5 text-xs transition-colors"
                    >
                      {DIFFICULTY_OPTIONS.find(o => o.tier === difficultyTier)?.label ?? '普通'}
                    </button>
                    <div className="text-muted-foreground flex-shrink-0 text-xs">
                      <div>Lv.{character.level}</div>
                      {character.is_fighting && (
                        <div className="text-yellow-600 dark:text-yellow-400">战斗中</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 创建新角色按钮 */}
            {characters.length < 3 && (
              <div
                onClick={onCreateCharacter}
                className="border-border hover:border-primary hover:bg-muted/50 flex min-h-[180px] max-w-[200px] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 transition-all sm:min-h-[200px]"
              >
                <div className="text-muted-foreground hover:text-foreground text-2xl sm:text-3xl">
                  +
                </div>
                <div className="text-muted-foreground hover:text-foreground mt-1 text-xs">
                  创建新角色
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">👤</div>
            <p className="text-muted-foreground mb-6">还没有角色，创建一个开始冒险吧！</p>
            <CreateCharacter />
          </div>
        )}

        {/* 提示信息 */}
        {characters && characters.length > 0 && (
          <div className="bg-muted/50 text-muted-foreground mt-6 rounded-lg p-4 text-sm">
            <p>提示：每个账号最多可以创建3个角色。点击角色卡片进入游戏。</p>
          </div>
        )}
      </div>

      {/* 难度选择 - 底部弹出 */}
      <Sheet
        open={openCharacterId !== null}
        onOpenChange={open => !open && setOpenCharacterId(null)}
      >
        <SheetContent side="bottom" className="border-border bg-card rounded-t-xl">
          <SheetHeader>
            <SheetTitle className="text-foreground">选择难度</SheetTitle>
          </SheetHeader>
          <div className="max-h-[60vh] overflow-y-auto pb-8">
            {DIFFICULTY_OPTIONS.map(({ tier, label }) => (
              <button
                key={tier}
                type="button"
                onClick={() => handleDifficultySelect(tier)}
                className={`text-foreground flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors ${
                  tier === currentTier
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'hover:bg-muted'
                }`}
              >
                <span>{label}</span>
                {tier === currentTier && (
                  <span className="text-green-600 dark:text-green-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
