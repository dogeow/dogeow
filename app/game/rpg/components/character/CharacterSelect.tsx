'use client'

import Image from 'next/image'
import { gameAsset } from '@/lib/helpers/assets'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useGameStore } from '../../stores/gameStore'
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
  gender?: 'male' | 'female'
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
  warrior: { name: '战士', icon: '⚔️', color: '', male: 'warrior-man', female: 'warrior-female' },
  mage: { name: '法师', icon: '🔮', color: '', male: 'wizard-man', female: 'wizard-female' },
  ranger: { name: '弓手', icon: '🏹', color: '', male: 'ranger-man', female: 'ranger-female' },
}

export const DIFFICULTY_OPTIONS: { tier: number; label: string }[] = [
  { tier: 0, label: '普通' },
  { tier: 1, label: '困难' },
  { tier: 2, label: '高手' },
  { tier: 3, label: '大师' },
  ...Array.from({ length: 6 }, (_, i) => ({ tier: i + 4, label: `痛苦${i + 1}` })),
]

export const DIFFICULTY_COLORS: Record<number, string> = {
  0: 'bg-green-600', // 普通 - 绿色
  1: 'bg-blue-600', // 困难 - 蓝色
  2: 'bg-yellow-600', // 高手 - 黄色
  3: 'bg-orange-600', // 大师 - 橙色
  4: 'bg-red-600', // 痛苦1 - 红色
  5: 'bg-rose-700', // 痛苦2
  6: 'bg-pink-700', // 痛苦3
  7: 'bg-fuchsia-700', // 痛苦4
  8: 'bg-purple-800', // 痛苦5
  9: 'bg-violet-900', // 痛苦6
}

export function CharacterSelect({ onBack, onCreateCharacter }: CharacterSelectProps) {
  const {
    characters,
    isLoading,
    error,
    selectCharacter,
    setDifficultyForCharacter,
    deleteCharacter,
  } = useGameStore()

  const [openCharacterId, setOpenCharacterId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [isDeleteMode, setIsDeleteMode] = useState(false)

  const openCharacter = useMemo(
    () => characters?.find(c => c.id === openCharacterId),
    [characters, openCharacterId]
  )

  const currentTier = openCharacter?.difficulty_tier ?? 0

  // 不在选择页重复拉取：角色列表由 page 初次认证后拉取，创建/删除后各自会调 fetchCharacters
  // 原 useEffect 会导致：fetchCharacters 置 isLoading→页面显示加载并卸载本组件→请求完成后再次挂载又拉取→死循环

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
      if (isDeleteMode) {
        setDeleteConfirmId(characterId)
        setIsDeleteMode(false)
        return
      }
      // 关闭难度选择面板
      if (openCharacterId != null) {
        setOpenCharacterId(null)
        return
      }
      try {
        await selectCharacter(characterId)
      } catch (error) {
        console.error('选择角色失败:', error)
      }
    },
    [selectCharacter, isDeleteMode, openCharacterId]
  )

  const handleDeleteConfirm = useCallback(async () => {
    const id = deleteConfirmId
    if (id == null) return
    try {
      await deleteCharacter(id)
      setDeleteConfirmId(null)
      setIsDeleteMode(false)
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
      const gender = character.gender ?? 'male'
      const avatarKey = gender === 'female' ? classInfo.female : classInfo.male
      const avatarUrl = gameAsset(`/game/rpg/avatar/${avatarKey}.png`)

      const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteConfirmId(character.id)
        setIsDeleteMode(false)
      }

      return (
        <div
          key={character.id}
          className={`relative flex min-h-[180px] max-w-[200px] flex-1 flex-col rounded-lg border-2 p-3 sm:min-h-[200px] ${classInfo.color} cursor-pointer transition-transform hover:scale-[1.02]`}
          onClick={() => handleSelectCharacter(character.id)}
        >
          <div className="flex min-h-0 flex-1 flex-col items-center justify-between overflow-hidden text-center">
            <div className="flex-shrink-0">
              <div className="relative mx-auto mb-2 h-20 w-20 overflow-hidden rounded-full">
                <Image
                  src={avatarUrl}
                  alt={`${character.name} avatar`}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="mt-1 truncate text-sm font-bold">{character.name}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {classInfo.name} · Lv.{character.level}
              </p>
              {character.is_fighting && (
                <div className="text-sm text-yellow-600 dark:text-yellow-400">战斗中</div>
              )}
            </div>
            {isDeleteMode ? (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="bg-destructive w-full flex-shrink-0 rounded px-2 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                删除
              </button>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  setOpenCharacterId(character.id)
                }}
                className={`${DIFFICULTY_COLORS[difficultyTier] || 'bg-green-600'} w-full flex-shrink-0 rounded px-2 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90`}
              >
                {DIFFICULTY_OPTIONS.find(o => o.tier === difficultyTier)?.label ?? '普通'}
              </button>
            )}
          </div>
        </div>
      )
    },
    [handleSelectCharacter, isDeleteMode]
  )

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground text-sm">加载角色列表中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-base font-bold">选择角色</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDeleteMode(!isDeleteMode)}
              disabled={!characters || characters.length === 0}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              {isDeleteMode ? '取消删除' : '删除角色'}
            </button>
            <button
              onClick={onCreateCharacter}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm transition-colors"
            >
              创建角色
            </button>
          </div>
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
        onOpenChange={open => {
          if (!open) {
            setDeleteConfirmId(null)
            setIsDeleteMode(false)
          }
        }}
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
            <SheetTitle className="text-foreground text-sm">选择难度</SheetTitle>
          </SheetHeader>
          <div className="max-h-[60vh] overflow-y-auto pb-8">
            {DIFFICULTY_OPTIONS.map(({ tier, label }) => {
              const colorClass = DIFFICULTY_COLORS[tier] || 'bg-green-600'
              const isSelected = tier === currentTier
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => handleDifficultySelect(tier)}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-colors ${
                    isSelected ? `${colorClass} text-white` : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <span className={isSelected ? 'text-sm text-white' : 'text-sm'}>{label}</span>
                  {isSelected && <span>✓</span>}
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
