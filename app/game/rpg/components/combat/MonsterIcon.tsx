'use client'

import Image from 'next/image'
import { useState } from 'react'

/** 怪物图标：有 monsterId 时优先用 /game/rpg/monsters/monster_{id}.png，失败则回退到首字；父组件用 key={monsterId} 以便切换怪物时重置 */
export function MonsterIcon({
  monsterId,
  name,
  size = 'md',
}: {
  monsterId?: number
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const fallback = name && name[0] ? name[0] : '?'
  const src = monsterId != null ? `/game/rpg/monsters/monster_${monsterId}.png` : ''
  const [useImg, setUseImg] = useState(true)
  const sizeClass =
    size === 'sm'
      ? 'h-12 w-12 text-lg'
      : size === 'lg'
        ? 'h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl'
        : 'h-14 w-14 text-xl sm:h-16 sm:w-16 sm:text-2xl'
  return (
    <span
      className={`bg-destructive/20 relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClass}`}
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
