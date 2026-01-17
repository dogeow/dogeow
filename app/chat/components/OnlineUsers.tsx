// 2025-09-24 claude-4-sonnet 优化过本文件代码：「优化代码」

'use client'

import React, { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Search, Filter } from 'lucide-react'
import useChatStore from '@/app/chat/chatStore'
import { useTranslation } from '@/hooks/useTranslation'
import { UserListItem } from './users/components/UserListItem'
import {
  filterUsers,
  filterByStatus,
  sortUsers,
  type SortOption,
  type FilterOption,
} from './users/utils/filterUtils'
import type { OnlineUser } from '../types'

interface OnlineUsersProps {
  roomId: number
  className?: string
  onMentionUser?: (username: string) => void
  onDirectMessage?: (userId: number) => void
  onBlockUser?: (userId: number) => void
  onReportUser?: (userId: number) => void
}

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
  }, [roomUsers, searchQuery, sortBy, filterBy])

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
