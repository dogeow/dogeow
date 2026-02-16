'use client'

import Image from 'next/image'
import { useState } from 'react'

/** 技能图标：有 skillId 时优先用 /game/rpg/skills/skill_{id}.png，加载失败则回退到 emoji/首字 */
export function SkillIcon({
  icon,
  name,
  skillId,
}: {
  icon?: string | null
  name: string
  skillId?: number
}) {
  const fallback = icon && icon.length <= 4 ? icon : name && name[0] ? name[0] : '?'
  const [useImg, setUseImg] = useState(!!skillId)
  const src = skillId != null ? `/game/rpg/skills/skill_${skillId}.png` : ''
  return (
    <span className="bg-muted relative flex h-8 w-8 items-center justify-center overflow-hidden rounded text-base sm:h-9 sm:w-9">
      {useImg && src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="36px"
          onError={() => setUseImg(false)}
        />
      ) : (
        fallback
      )}
    </span>
  )
}
