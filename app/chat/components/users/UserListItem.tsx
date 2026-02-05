import React, { useMemo, useCallback } from 'react'
import { Circle, Clock, Shield, Crown } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { UserAvatar } from './UserAvatar'
import { UserProfilePopover } from './UserProfilePopover'
import { userRoleUtils } from '@/app/chat/utils/users/userUtils'
import type { OnlineUser } from '@/app/chat/types'

interface UserListItemProps {
  user: OnlineUser
  onMentionUser?: (username: string) => void
  onDirectMessage?: (userId: number) => void
  onBlockUser?: (userId: number) => void
  onReportUser?: (userId: number) => void
}

/**
 * 优化的用户列表项组件
 * 使用 React.memo 避免不必要的重渲染，提升大量用户时的性能
 */
export const UserListItem = React.memo(function UserListItem({
  user,
  onMentionUser,
  onDirectMessage,
  onBlockUser,
  onReportUser,
}: UserListItemProps) {
  const { t } = useTranslation()
  const isAdmin = useMemo(() => userRoleUtils.isAdmin(user), [user])
  const isModerator = useMemo(() => userRoleUtils.isModerator(user), [user])

  const handleDirectMessage = useCallback(() => {
    onDirectMessage?.(user.id)
  }, [onDirectMessage, user.id])

  const handleMentionUser = useCallback(() => {
    onMentionUser?.(user.name)
  }, [onMentionUser, user.name])

  const handleBlockUser = useCallback(() => {
    onBlockUser?.(user.id)
  }, [onBlockUser, user.id])

  const handleReportUser = useCallback(() => {
    onReportUser?.(user.id)
  }, [onReportUser, user.id])

  return (
    <UserProfilePopover
      user={user}
      onMentionUser={onMentionUser}
      onDirectMessage={onDirectMessage}
      onBlockUser={onBlockUser}
      onReportUser={onReportUser}
    >
      <div className="bg-card hover:bg-muted/30 border-border flex cursor-pointer items-center space-x-3 rounded-xl border p-3 shadow-sm transition-colors">
        <div className="relative">
          <UserAvatar user={user} size="sm" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            {isAdmin && <Crown className="h-3 w-3 text-yellow-500" />}
            {isModerator && !isAdmin && <Shield className="h-3 w-3 text-blue-500" />}
            {user.is_online && <Circle className="h-2 w-2 fill-green-500 text-green-500" />}
          </div>
          <div className="text-muted-foreground flex items-center space-x-1 text-xs">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(user.joined_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </UserProfilePopover>
  )
})
