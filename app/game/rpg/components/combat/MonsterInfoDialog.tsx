'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useMonsterDrops } from '../../hooks/useMonsterDrops'
import type { CombatMonster } from '../../types'

type MonsterWithMeta = CombatMonster & { damage_taken?: number }

interface MonsterInfoDialogProps {
  monster: MonsterWithMeta | null
  onClose: () => void
}

export function MonsterInfoDialog({ monster, onClose }: MonsterInfoDialogProps) {
  const [viewingImage, setViewingImage] = useState<string | null>(null)
  const { data: compendiumMonsterDrops, isLoading } = useMonsterDrops(monster?.id)

  if (!monster) return null

  return (
    <>
      <Dialog open={!!monster && !viewingImage} onOpenChange={open => !open && onClose()}>
        <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
          {compendiumMonsterDrops ? (
            <div className="space-y-4">
              {/* 顶部：图片 + 属性 */}
              <div className="flex gap-4">
                {/* 左侧图片 */}
                <button
                  type="button"
                  className="relative h-[200px] w-[200px] shrink-0 cursor-zoom-in"
                  onClick={e => {
                    e.stopPropagation()
                    setViewingImage(`/game/rpg/monsters/monster_${monster.id}_origin.png`)
                  }}
                >
                  <Image
                    src={`/game/rpg/monsters/monster_${monster.id}_origin.png`}
                    alt=""
                    fill
                    className="object-contain"
                  />
                </button>
                {/* 右侧属性 */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold">{compendiumMonsterDrops.monster.name}</h3>
                    <p className="text-muted-foreground text-sm">
                      Lv.{compendiumMonsterDrops.monster.level} ·{' '}
                      {getMonsterTypeName(compendiumMonsterDrops.monster.type)}
                    </p>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p>生命: {compendiumMonsterDrops.monster.hp_base}</p>
                    <p>攻击: {compendiumMonsterDrops.monster.attack_base}</p>
                    <p>防御: {compendiumMonsterDrops.monster.defense_base}</p>
                    <p>经验: {compendiumMonsterDrops.monster.experience_base}</p>
                  </div>
                </div>
              </div>

              {/* 底部：可能掉落 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">可能掉落</h4>
                  {compendiumMonsterDrops.drop_rates && (
                    <span className="text-muted-foreground text-xs">
                      装备: {compendiumMonsterDrops.drop_rates.item}% | 金币:{' '}
                      {compendiumMonsterDrops.drop_rates.gold}% | 药水:{' '}
                      {compendiumMonsterDrops.drop_rates.potion}%
                    </span>
                  )}
                </div>
                {compendiumMonsterDrops.possible_items.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1">
                    {compendiumMonsterDrops.possible_items.map(item => (
                      <div key={item.id} className="bg-muted rounded p-1 text-center">
                        <span className="text-lg">{getItemEmoji(item.type)}</span>
                        <p className="truncate text-xs">{item.name}</p>
                        {item.drop_rate !== undefined && (
                          <p className="text-muted-foreground text-[10px]">{item.drop_rate}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">暂无物品掉落数据</p>
                )}
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">加载失败</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 查看大图 */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={e => e.stopPropagation()}>
            <Image
              src={viewingImage}
              alt=""
              width={800}
              height={800}
              className="max-h-[90vh] w-auto object-contain"
            />
            <button
              type="button"
              className="absolute -top-10 -right-10 cursor-pointer text-3xl text-white"
              onClick={() => setViewingImage(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function getMonsterTypeName(type: string): string {
  const names: Record<string, string> = {
    normal: '普通',
    elite: '精英',
    boss: 'BOSS',
  }
  return names[type] || type
}

function getItemEmoji(type: string): string {
  const emojis: Record<string, string> = {
    weapon: '⚔️',
    helmet: '🪖',
    armor: '🛡️',
    gloves: '🧤',
    boots: '👢',
    belt: '🎗️',
    ring: '💍',
    amulet: '📿',
    potion: '🧪',
    gem: '💎',
  }
  return emojis[type] || '📦'
}
