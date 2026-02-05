import React, { useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAvatarImage } from '@/hooks/useAvatarImage'
import { AVATAR_CONFIGS } from '@/app/chat/utils/users/avatarConfig'
import { getInitials } from '@/app/chat/utils/users/userUtils'
import type { OnlineUser } from '@/app/chat/types'

interface UserAvatarProps {
  user: OnlineUser
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * 用户头像组件
 * 支持多种尺寸，自动生成用户名首字母作为fallback
 */
export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const config = AVATAR_CONFIGS[size]
  const initials = useMemo(() => getInitials(user.name), [user.name])

  const { src, onError, onLoad } = useAvatarImage({
    seed: user.name,
    fallbackInitials: initials,
  })

  return (
    <Avatar className={`${config.className} ${className}`}>
      {src && (
        <AvatarImage
          src={src}
          alt={`${user.name}'s avatar`}
          width={config.size.width}
          height={config.size.height}
          onError={onError}
          onLoad={onLoad}
        />
      )}
      <AvatarFallback className={config.textSize}>{initials}</AvatarFallback>
    </Avatar>
  )
}
