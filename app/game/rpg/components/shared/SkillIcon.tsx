'use client'

import Image from 'next/image'
import { useState } from 'react'
import { gameAsset } from '@/lib/helpers/assets'

/** 技能图标：优先使用数据库里的 icon 文件名，其次回退到旧的 skill_{id}.png。 */
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
  const iconFile = icon && /\.(png|jpe?g|webp|gif|svg)$/i.test(icon) ? icon : null
  const [preferIconFile, setPreferIconFile] = useState(iconFile != null)
  const [useIdFallback, setUseIdFallback] = useState(skillId != null)
  const src =
    preferIconFile && iconFile
      ? gameAsset(iconFile.startsWith('/') ? iconFile : `/game/rpg/skills/${iconFile}`)
      : useIdFallback && skillId != null
        ? gameAsset(`/game/rpg/skills/skill_${skillId}.png`)
        : ''
  return (
    <span className="bg-muted relative flex h-8 w-8 items-center justify-center overflow-hidden rounded text-base sm:h-9 sm:w-9">
      {src ? (
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover"
          sizes="36px"
          onError={() => {
            if (preferIconFile) {
              setPreferIconFile(false)
              return
            }
            setUseIdFallback(false)
          }}
        />
      ) : (
        fallback
      )}
    </span>
  )
}
