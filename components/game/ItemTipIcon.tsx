'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { GameItem, ItemQuality } from '@/app/game/rpg/types'
import { QUALITY_COLORS } from '@/app/game/rpg/types'
import { getItemIconFallback } from '@/app/game/rpg/utils/itemUtils'

/** 物品详情中的大图标 */
export function ItemTipIcon({ item, className }: { item: GameItem; className?: string }) {
  const definitionId = item.definition?.id
  const fallback = getItemIconFallback(item)
  const [useImg, setUseImg] = useState(definitionId != null)
  const src = definitionId != null ? `/game/rpg/items/item_${definitionId}.png` : ''

  return (
    <span
      className={`relative inline-flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-lg border-2 shadow-sm ${className ?? ''}`}
      style={{ borderColor: QUALITY_COLORS[item.quality as ItemQuality] }}
    >
      {useImg && src ? (
        <Image
          src={src}
          alt=""
          fill
          className="rounded-md object-contain p-1"
          sizes="100px"
          onError={() => setUseImg(false)}
        />
      ) : (
        <span className="text-5xl drop-shadow-sm">{fallback}</span>
      )}
    </span>
  )
}
