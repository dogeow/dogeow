'use client'

import Image from 'next/image'
import { useState } from 'react'

export function MapCardMonsterAvatar({ monsterId, name }: { monsterId: number; name: string }) {
  const [useImg, setUseImg] = useState(true)
  return (
    <span
      className="bg-muted/80 relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 text-[10px] font-medium"
      title={name}
    >
      {useImg ? (
        <Image
          src={`/game/rpg/monsters/monster_${monsterId}.png`}
          alt=""
          fill
          className="object-cover"
          sizes="24px"
          onError={() => setUseImg(false)}
        />
      ) : (
        (name?.[0] ?? '?')
      )}
    </span>
  )
}
