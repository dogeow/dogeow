import React, { useMemo, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { Shield, Circle, Calendar, AtSign, MessageCircle, UserX, Flag, Crown } from 'lucide-react'
import { UserAvatar } from './UserAvatar'
import { userRoleUtils, formatJoinedDate } from '../utils/userUtils'
import type { OnlineUser } from '../../types'

interface UserProfilePopoverProps {
  user: OnlineUser
  children: React.ReactNode
  onMentionUser?: (username: string) => void
  onDirectMessage?: (userId: number) => void
  onBlockUser?: (userId: number) => void
  onReportUser?: (userId: number) => void
}

/**
 * 用户详情弹出框组件
 * 显示用户的详细信息和操作选项
 */
export function UserProfilePopover({
  user,
  children,
  onMentionUser,
  onDirectMessage,
  onBlockUser,
  onReportUser,
}: UserProfilePopoverProps) {
  const userRole = useMemo(() => userRoleUtils.getUserRole(user), [user])
  const isAdmin = useMemo(() => userRoleUtils.isAdmin(user), [user])
  const isModerator = useMemo(() => userRoleUtils.isModerator(user), [user])
  const joinedDateFormatted = useMemo(() => formatJoinedDate(user.joined_at), [user.joined_at])

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
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 max-w-[calc(100vw-2rem)]" align="start">
        <div className="space-y-4">
          {/* 用户头部信息 */}
          <div className="flex items-center space-x-3">
            <UserAvatar user={user} size="lg" />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{user.name}</h3>
                {isAdmin && <Crown className="h-4 w-4 text-yellow-500" />}
                {isModerator && !isAdmin && <Shield className="h-4 w-4 text-blue-500" />}
                {user.is_online && <Circle className="h-2 w-2 fill-green-500 text-green-500" />}
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <Badge variant="outline" className="text-xs">
                  {userRole}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* 用户详细信息 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">Joined:</span>
              <span>{joinedDateFormatted}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Circle
                className={`h-4 w-4 ${user.is_online ? 'text-green-500' : 'text-gray-400'}`}
              />
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={user.is_online ? 'default' : 'secondary'}>
                {user.is_online ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* 操作按钮 */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleDirectMessage}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleMentionUser}>
                <AtSign className="mr-2 h-4 w-4" />
                Mention
              </Button>
            </div>

            {/* 其他操作 */}
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={handleBlockUser}>
                <UserX className="mr-2 h-4 w-4" />
                Block
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={handleReportUser}>
                <Flag className="mr-2 h-4 w-4" />
                Report
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
