'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getRpgMonsterImageUrl } from '../../utils/assetUrls'

export function MapCardMonsterAvatar({
  monsterId,
  icon,
  name,
}: {
  monsterId: number
  icon?: string | null
  name: string
}) {
  const [useImg, setUseImg] = useState(true)
  const src = getRpgMonsterImageUrl(icon, monsterId)
  return (
    <span
      className="bg-muted/80 relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 text-[10px] font-medium"
      title={name}
    >
      {useImg ? (
        <Image
          src={src}
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
