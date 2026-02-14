'use client'

import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { CreateCharacter } from './CreateCharacter'

interface Character {
  id: number
  name: string
  class: string
  level: number
  experience: number
  gold: number
  is_fighting: boolean
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

export function CharacterSelect({ onBack, onCreateCharacter }: CharacterSelectProps) {
  const { characters, isLoading, error, fetchCharacters, selectCharacter } = useGameStore()

  // 组件挂载时获取角色列表
  useEffect(() => {
    fetchCharacters()
  }, [fetchCharacters])

  const handleSelectCharacter = async (characterId: number) => {
    try {
      await selectCharacter(characterId)
    } catch (error) {
      console.error('选择角色失败:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-400">加载角色列表中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 text-white">
      <div className="mx-auto max-w-4xl">
        {/* 头部 */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">选择角色</h1>
          <button
            onClick={onBack}
            className="rounded-lg bg-gray-700 px-4 py-2 transition-colors hover:bg-gray-600"
          >
            返回
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500 bg-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* 角色列表 */}
        {characters && characters.length > 0 ? (
          <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-3">
            {characters.map(character => {
              const classInfo = CLASS_INFO[character.class as keyof typeof CLASS_INFO]
              return (
                <div
                  key={character.id}
                  className={`aspect-square max-w-[200px] min-w-[calc(33.333%-8px)] flex-1 rounded-lg border-2 p-2 ${classInfo.color} cursor-pointer transition-transform hover:scale-105`}
                  onClick={() => handleSelectCharacter(character.id)}
                >
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="text-lg sm:text-xl md:text-2xl">{classInfo.icon}</div>
                    <h3 className="mt-1 text-xs font-bold sm:text-sm">{character.name}</h3>
                    <p className="text-xs text-gray-400">{classInfo.name}</p>
                    <div className="mt-auto space-y-0 text-xs text-gray-400">
                      <div>Lv.{character.level}</div>
                      {character.is_fighting && <div className="text-yellow-400">战斗中</div>}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* 创建新角色按钮 */}
            {characters.length < 3 && (
              <div
                onClick={onCreateCharacter}
                className="aspect-square cursor-pointer rounded-lg border-2 border-dashed border-gray-600 p-2 transition-all hover:border-blue-500 hover:bg-gray-800/50"
              >
                <div className="flex h-full flex-col items-center justify-center text-center text-gray-400 hover:text-white">
                  <div className="text-2xl sm:text-3xl">+</div>
                  <div className="mt-1 text-xs">创建新角色</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">👤</div>
            <p className="mb-6 text-gray-400">还没有角色，创建一个开始冒险吧！</p>
            <CreateCharacter />
          </div>
        )}

        {/* 提示信息 */}
        {characters && characters.length > 0 && (
          <div className="mt-6 rounded-lg bg-gray-800/50 p-4 text-sm text-gray-400">
            <p>提示：每个账号最多可以创建3个角色。点击角色卡片进入游戏。</p>
          </div>
        )}
      </div>
    </div>
  )
}
