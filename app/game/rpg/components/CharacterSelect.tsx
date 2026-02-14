'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { CreateCharacter } from './CreateCharacter'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'

interface Character {
  id: number
  name: string
  class: string
  level: number
  experience: number
  copper: number
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
    deleteCharacter,
  } = useGameStore()

  const [openCharacterId, setOpenCharacterId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const openCharacter = useMemo(
    () => characters?.find(c => c.id === openCharacterId),
    [characters, openCharacterId]
  )

  const currentTier = openCharacter?.difficulty_tier ?? 0

  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  const handleDifficultySelect = useCallback(
    (tier: number) => {
      if (openCharacterId != null) {
        setDifficultyForCharacter(openCharacterId, tier)
        setOpenCharacterId(null)
      }
    },
    [openCharacterId, setDifficultyForCharacter]
  )

  const handleSelectCharacter = useCallback(
    async (characterId: number) => {
      try {
        await selectCharacter(characterId)
      } catch (error) {
        console.error('选择角色失败:', error)
      }
    },
    [selectCharacter]
  )

  const handleDeleteConfirm = useCallback(async () => {
    const id = deleteConfirmId
    if (id == null) return
    try {
      await deleteCharacter(id)
      setDeleteConfirmId(null)
    } catch {
      // 错误已由 store 写入 error，对话框保持打开
    }
  }, [deleteConfirmId, deleteCharacter])

  const deleteConfirmCharacter = useMemo(
    () => characters?.find(c => c.id === deleteConfirmId),
    [characters, deleteConfirmId]
  )

  // 角色卡片渲染
  const renderCharacterCard = useCallback(
    (character: Character) => {
      const classInfo = CLASS_INFO[character.class as keyof typeof CLASS_INFO]
      const difficultyTier = character.difficulty_tier ?? 0
      return (
        <div
          key={character.id}
          className={`relative flex min-h-[180px] max-w-[200px] flex-1 flex-col rounded-lg border-2 p-3 sm:min-h-[200px] ${classInfo.color} cursor-pointer transition-transform hover:scale-[1.02]`}
          onClick={() => handleSelectCharacter(character.id)}
        >
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              setDeleteConfirmId(character.id)
            }}
            className="text-muted-foreground hover:text-destructive absolute top-2 right-2 rounded p-1 transition-colors"
            aria-label="删除角色"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden text-center">
            <div className="flex-shrink-0">
              <div className="text-xl sm:text-2xl">{classInfo.icon}</div>
              <h3 className="mt-1 truncate text-xs font-bold sm:text-sm">{character.name}</h3>
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
    },
    [handleSelectCharacter]
  )

  // 新角色按钮渲染
  const renderCreateCharacterBtn = useCallback(
    () => (
      <div
        onClick={onCreateCharacter}
        className="border-border hover:border-primary hover:bg-muted/50 flex min-h-[180px] max-w-[200px] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 transition-all sm:min-h-[200px]"
      >
        <div className="text-muted-foreground hover:text-foreground text-2xl sm:text-3xl">+</div>
        <div className="text-muted-foreground hover:text-foreground mt-1 text-xs">创建新角色</div>
      </div>
    ),
    [onCreateCharacter]
  )

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
        {!!error && (
          <div className="border-destructive bg-destructive/20 text-destructive mb-4 rounded-lg border p-3 text-sm">
            {error}
          </div>
        )}

        {/* 角色列表 */}
        {characters && characters.length > 0 ? (
          <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-4">
            {characters.map(renderCharacterCard)}

            {/* 创建新角色按钮 */}
            {characters.length < 3 && renderCreateCharacterBtn()}
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

      {/* 删除确认 */}
      <AlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={open => !open && setDeleteConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除角色</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmCharacter
                ? `确定要删除「${deleteConfirmCharacter.name}」吗？此操作不可恢复，该角色的装备、背包、技能与进度将一并清除。`
                : '确定要删除该角色吗？此操作不可恢复。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
            >
              确认删除
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
