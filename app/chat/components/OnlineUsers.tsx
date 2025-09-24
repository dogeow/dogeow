// 2025-09-24 claude-4-sonnet 优化过本文件代码：「优化代码」

'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAvatarImage } from '@/hooks/useAvatarImage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  Search,
  Filter,
  Shield,
  Circle,
  Clock,
  Calendar,
  AtSign,
  MessageCircle,
  UserX,
  Flag,
  Crown,
  MoreVertical,
} from 'lucide-react'
import useChatStore from '@/app/chat/chatStore'
import { useTranslation } from '@/hooks/useTranslation'
import type { OnlineUser } from '../types'

interface OnlineUsersProps {
  roomId: number
  className?: string
  onMentionUser?: (username: string) => void
  onDirectMessage?: (userId: number) => void
  onBlockUser?: (userId: number) => void
  onReportUser?: (userId: number) => void
}

type SortOption = 'name' | 'joined' | 'status'
type FilterOption = 'all' | 'online' | 'moderators'
type UserRole = 'admin' | 'moderator' | 'user'

/**
 * 用户角色判断工具函数
 * 提供判断用户是否为管理员、版主的方法
 */
const userRoleUtils = {
  isAdmin: (user: OnlineUser): boolean => {
    return user.email.includes('admin')
  },

  isModerator: (user: OnlineUser): boolean => {
    return user.email.includes('admin') || user.email.includes('mod')
  },

  getUserRole: (user: OnlineUser): UserRole => {
    if (userRoleUtils.isAdmin(user)) return 'admin'
    if (userRoleUtils.isModerator(user)) return 'moderator'
    return 'user'
  },
}

// 时间格式化工具函数
const formatJoinedDate = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  return date.toLocaleDateString()
}

// 获取用户名首字母
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Avatar 尺寸配置
const AVATAR_CONFIGS = {
  sm: {
    className: 'h-8 w-8',
    size: { width: 32, height: 32 },
    textSize: 'text-xs',
  },
  md: {
    className: 'h-10 w-10',
    size: { width: 40, height: 40 },
    textSize: '',
  },
  lg: {
    className: 'h-12 w-12',
    size: { width: 48, height: 48 },
    textSize: '',
  },
} as const

interface UserAvatarProps {
  user: OnlineUser
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * 用户头像组件
 * 支持多种尺寸，自动生成用户名首字母作为fallback
 */
function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
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
function UserProfilePopover({
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
      <PopoverContent className="w-80" align="start">
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

/**
 * 优化的用户列表项组件
 * 使用 React.memo 避免不必要的重渲染，提升大量用户时的性能
 */
interface UserListItemProps {
  user: OnlineUser
  onMentionUser?: (username: string) => void
  onDirectMessage?: (userId: number) => void
  onBlockUser?: (userId: number) => void
  onReportUser?: (userId: number) => void
}

const UserListItem = React.memo(function UserListItem({
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
      <div className="hover:bg-muted/30 group flex cursor-pointer items-center space-x-3 rounded-lg p-2 transition-colors">
        <div className="relative">
          <UserAvatar user={user} size="sm" />
          {/* 在线状态指示器 */}
          <div className="absolute -right-0.5 -bottom-0.5">
            <Circle
              className={`border-background h-2.5 w-2.5 rounded-full border-2 ${
                user.is_online ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'
              }`}
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            {isAdmin && <Crown className="h-3 w-3 text-yellow-500" />}
            {isModerator && !isAdmin && <Shield className="h-3 w-3 text-blue-500" />}
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

        {/* 状态徽章和操作 */}
        <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Badge
            variant={user.is_online ? 'default' : 'secondary'}
            className="px-1.5 py-0.5 text-xs"
          >
            {user.is_online ? t('status.online') : t('status.away')}
          </Badge>

          {/* 快捷操作下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-muted/50 h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDirectMessage}>
                <MessageCircle className="mr-2 h-4 w-4" />
                {t('chat.direct_message')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMentionUser}>
                <AtSign className="mr-2 h-4 w-4" />
                {t('chat.mention_user')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleBlockUser}>
                <UserX className="mr-2 h-4 w-4" />
                {t('chat.block_user')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReportUser}>
                <Flag className="mr-2 h-4 w-4" />
                {t('chat.report_user')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </UserProfilePopover>
  )
})

export default function OnlineUsers({
  roomId,
  className = '',
  onMentionUser,
  onDirectMessage,
  onBlockUser,
  onReportUser,
}: OnlineUsersProps) {
  const { t } = useTranslation()
  const { onlineUsers } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  const roomUsers = useMemo(() => {
    return onlineUsers[roomId.toString()] || []
  }, [onlineUsers, roomId])

  // 优化后的搜索过滤函数
  const filterUsers = useCallback((users: OnlineUser[], query: string) => {
    if (!query.trim()) return users

    const normalizedQuery = query.toLowerCase()
    return users.filter(
      user =>
        user.name.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery)
    )
  }, [])

  // 优化后的状态过滤函数
  const filterByStatus = useCallback((users: OnlineUser[], filter: FilterOption) => {
    switch (filter) {
      case 'online':
        return users.filter(user => user.is_online)
      case 'moderators':
        return users.filter(user => userRoleUtils.isModerator(user))
      default:
        return users
    }
  }, [])

  // 优化后的排序函数
  const sortUsers = useCallback((users: OnlineUser[], sortOption: SortOption) => {
    return [...users].sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'joined':
          return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
        case 'status':
          // 在线用户优先，然后按名字排序
          if (a.is_online === b.is_online) {
            return a.name.localeCompare(b.name)
          }
          return a.is_online ? -1 : 1
        default:
          return 0
      }
    })
  }, [])

  // 过滤和排序用户 - 重构为更清晰的处理链
  const filteredAndSortedUsers = useMemo(() => {
    // 确保 roomUsers 是数组
    if (!Array.isArray(roomUsers)) {
      console.warn('OnlineUsers: roomUsers is not an array:', roomUsers)
      return []
    }

    // 处理链：搜索过滤 -> 状态过滤 -> 排序
    const searchFiltered = filterUsers(roomUsers, searchQuery)
    const statusFiltered = filterByStatus(searchFiltered, filterBy)
    const sorted = sortUsers(statusFiltered, sortBy)

    return sorted
  }, [roomUsers, searchQuery, sortBy, filterBy, filterUsers, filterByStatus, sortUsers])

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* 搜索和筛选控件 */}
      <div className="bg-muted/20 border-b p-3">
        <div className="space-y-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder={t('chat.search_users', 'Search users...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>

          <div className="flex space-x-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="h-8 flex-1 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{t('chat.sort_by_name', 'Sort by Name')}</SelectItem>
                <SelectItem value="joined">{t('chat.sort_by_joined', 'Sort by Joined')}</SelectItem>
                <SelectItem value="status">{t('chat.sort_by_status', 'Sort by Status')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="h-8 flex-1 text-sm">
                <Filter className="mr-2 h-3 w-3" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('chat.all_users', 'All Users')}</SelectItem>
                <SelectItem value="online">{t('chat.online_only', 'Online Only')}</SelectItem>
                <SelectItem value="moderators">{t('chat.moderators', 'Moderators')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredAndSortedUsers.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="text-muted-foreground mx-auto h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">
                {searchQuery.trim()
                  ? t('chat.no_users_found', 'No users found')
                  : t('chat.no_users_online', 'No users online')}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAndSortedUsers.map(user => (
                <UserListItem
                  key={user.id}
                  user={user}
                  onMentionUser={onMentionUser}
                  onDirectMessage={onDirectMessage}
                  onBlockUser={onBlockUser}
                  onReportUser={onReportUser}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
