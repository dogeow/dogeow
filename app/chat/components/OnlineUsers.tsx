'use client'

import { useState, useMemo } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import useChatStore from '@/stores/chatStore'
import type { OnlineUser } from '@/types/chat'

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

interface UserProfilePopoverProps {
  user: OnlineUser
  children: React.ReactNode
  onMentionUser?: (username: string) => void
  onDirectMessage?: (userId: number) => void
  onBlockUser?: (userId: number) => void
  onReportUser?: (userId: number) => void
}

function UserProfilePopover({
  user,
  children,
  onMentionUser,
  onDirectMessage,
  onBlockUser,
  onReportUser,
}: UserProfilePopoverProps) {
  const formatJoinedDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if user is a moderator (simplified - would need proper role checking)
  const isModerator = (user: OnlineUser) => {
    // For demo purposes, assume users with certain email domains are moderators
    return user.email.includes('admin') || user.email.includes('mod')
  }

  // Check if user is an admin (simplified - would need proper role checking)
  const isAdmin = (user: OnlineUser) => {
    return user.email.includes('admin')
  }

  const getUserRole = (user: OnlineUser) => {
    if (isAdmin(user)) return 'admin'
    if (isModerator(user)) return 'moderator'
    return 'user'
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          {/* User Header */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold">{user.name}</h3>
                {isAdmin(user) && <Crown className="h-4 w-4 text-yellow-500" />}
                {isModerator(user) && !isAdmin(user) && (
                  <Shield className="h-4 w-4 text-blue-500" />
                )}
                {user.is_online && <Circle className="h-2 w-2 fill-green-500 text-green-500" />}
              </div>
              <div className="flex items-center space-x-2">
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <Badge variant="outline" className="text-xs">
                  {getUserRole(user)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* User Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span className="text-muted-foreground">Joined:</span>
              <span>{formatJoinedDate(user.joined_at)}</span>
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

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onDirectMessage?.(user.id)}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onMentionUser?.(user.name)}
              >
                <AtSign className="mr-2 h-4 w-4" />
                Mention
              </Button>
            </div>

            {/* Additional Actions */}
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onBlockUser?.(user.id)}
              >
                <UserX className="mr-2 h-4 w-4" />
                Block
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onReportUser?.(user.id)}
              >
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

export default function OnlineUsers({
  roomId,
  className = '',
  onMentionUser,
  onDirectMessage,
  onBlockUser,
  onReportUser,
}: OnlineUsersProps) {
  const { onlineUsers } = useChatStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')

  const roomUsers = useMemo(() => {
    return onlineUsers[roomId.toString()] || []
  }, [onlineUsers, roomId])

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if user is a moderator (simplified - would need proper role checking)
  const isModerator = (user: OnlineUser) => {
    // For demo purposes, assume users with certain email domains are moderators
    return user.email.includes('admin') || user.email.includes('mod')
  }

  // Check if user is an admin (simplified - would need proper role checking)
  const isAdmin = (user: OnlineUser) => {
    return user.email.includes('admin')
  }

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = roomUsers

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        user => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    switch (filterBy) {
      case 'online':
        filtered = filtered.filter(user => user.is_online)
        break
      case 'moderators':
        filtered = filtered.filter(user => isModerator(user))
        break
      // 'all' shows everyone
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'joined':
          return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
        case 'status':
          // Online users first, then by name
          if (a.is_online === b.is_online) {
            return a.name.localeCompare(b.name)
          }
          return a.is_online ? -1 : 1
        default:
          return 0
      }
    })

    return sorted
  }, [roomUsers, searchQuery, sortBy, filterBy])

  const onlineCount = roomUsers.filter(user => user.is_online).length
  const totalCount = roomUsers.length

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Online Users</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {onlineCount}/{totalCount}
          </Badge>
        </CardTitle>

        {/* Search and Filter Controls */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex space-x-2">
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="joined">Sort by Joined</SelectItem>
                <SelectItem value="status">Sort by Status</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="flex-1">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="online">Online Only</SelectItem>
                <SelectItem value="moderators">Moderators</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-1 p-4 pt-0">
            {filteredAndSortedUsers.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="text-muted-foreground mx-auto h-8 w-8" />
                <p className="text-muted-foreground mt-2 text-sm">
                  {searchQuery.trim() ? 'No users found' : 'No users online'}
                </p>
              </div>
            ) : (
              filteredAndSortedUsers.map(user => (
                <UserProfilePopover
                  key={user.id}
                  user={user}
                  onMentionUser={onMentionUser}
                  onDirectMessage={onDirectMessage}
                  onBlockUser={onBlockUser}
                  onReportUser={onReportUser}
                >
                  <div className="hover:bg-muted flex cursor-pointer items-center space-x-3 rounded-lg p-2 transition-colors">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online status indicator */}
                      <div className="absolute -right-0.5 -bottom-0.5">
                        <Circle
                          className={`border-background h-3 w-3 rounded-full border-2 ${
                            user.is_online
                              ? 'fill-green-500 text-green-500'
                              : 'fill-gray-400 text-gray-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        {isAdmin(user) && <Crown className="h-3 w-3 text-yellow-500" />}
                        {isModerator(user) && !isAdmin(user) && (
                          <Shield className="h-3 w-3 text-blue-500" />
                        )}
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

                    {/* Status badge and actions */}
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.is_online ? 'default' : 'secondary'} className="text-xs">
                        {user.is_online ? 'Online' : 'Away'}
                      </Badge>

                      {/* Quick actions dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onDirectMessage?.(user.id)}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Direct Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onMentionUser?.(user.name)}>
                            <AtSign className="mr-2 h-4 w-4" />
                            Mention User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onBlockUser?.(user.id)}>
                            <UserX className="mr-2 h-4 w-4" />
                            Block User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReportUser?.(user.id)}>
                            <Flag className="mr-2 h-4 w-4" />
                            Report User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </UserProfilePopover>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
