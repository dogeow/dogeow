'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getRpgMonsterImageUrl } from '../../utils/assetUrls'

import { type MonsterType } from '../../types'

/** 怪物类型边框颜色 */
const MONSTER_TYPE_BORDER_COLORS: Record<MonsterType, string> = {
  normal: 'border-gray-400',
  elite: 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.9)]',
  boss: 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,1.0)]',
}

/** 怪物图标：优先使用后端返回的 icon 文件名，缺失时再回退旧的 monster_{id}.png。 */
export function MonsterIcon({
  monsterId,
  icon,
  name,
  size = 'md',
  monsterType = 'normal',
}: {
  monsterId?: number
  icon?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg'
  monsterType?: MonsterType
}) {
  const fallback = name && name[0] ? name[0] : '?'
  const src = getRpgMonsterImageUrl(icon, monsterId)
  const [useImg, setUseImg] = useState(true)
  const sizeClass =
    size === 'sm'
      ? 'h-12 w-12 text-lg'
      : size === 'lg'
        ? 'h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl'
        : 'h-14 w-14 text-xl sm:h-16 sm:w-16 sm:text-2xl'
  const borderColorClass = MONSTER_TYPE_BORDER_COLORS[monsterType]
  return (
    <span
      className={`bg-destructive/20 relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${borderColorClass} ${sizeClass}`}
    >
      {useImg && src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes={size === 'sm' ? '48px' : size === 'lg' ? '96px' : '64px'}
          onError={() => setUseImg(false)}
        />
      ) : (
        fallback
      )}
    </span>
  )
}
