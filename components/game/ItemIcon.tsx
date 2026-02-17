'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { GameItem } from '@/app/game/rpg/types'
import { getItemIconFallback } from '@/app/game/rpg/utils/itemUtils'

/** 物品小图标：优先使用图片，加载失败则用 emoji */
export function ItemIcon({ item, className }: { item: GameItem; className?: string }) {
  const definitionId = item.definition?.id
  const fallback = getItemIconFallback(item)
  const [useImg, setUseImg] = useState(definitionId != null)
  const src = definitionId != null ? `/game/rpg/items/item_${definitionId}.png` : ''

  return (
    <span
      className={`relative inline-flex h-full w-full items-center justify-center ${className ?? ''}`}
    >
      {useImg && src ? (
        <Image
          src={src}
          alt=""
          fill
          className="object-contain"
          sizes="48px"
          onError={() => setUseImg(false)}
        />
      ) : (
        <span className="drop-shadow-sm">{fallback}</span>
      )}
    </span>
  )
}
