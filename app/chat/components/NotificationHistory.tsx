'use client'

import { useState, useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import {
  Bell,
  BellOff,
  Hash,
  AtSign,
  UserPlus,
  UserMinus,
  X,
  Check,
  CheckCheck,
  Trash2,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'
import useChatStore from '@/app/chat/chatStore'

interface NotificationItem {
  id: string
  type: 'message' | 'mention' | 'user-joined' | 'user-left'
  roomId: number
  roomName: string
  title: string
  content: string
  timestamp: string
  isRead: boolean
  messageId?: number
  userId?: number
  userName?: string
}

interface NotificationHistoryProps {
  className?: string
}

// Mock notification data - in real app this would come from the store
const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'mention',
    roomId: 1,
    roomName: 'General',
    title: 'John mentioned you',
    content: '@currentuser can you help with this issue?',
    timestamp: new Date().toISOString(),
    isRead: false,
    messageId: 123,
    userName: 'John',
  },
  {
    id: '2',
    type: 'message',
    roomId: 2,
    roomName: 'Development',
    title: 'New message in Development',
    content: 'Alice: The new feature is ready for testing',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    userName: 'Alice',
  },
  {
    id: '3',
    type: 'user-joined',
    roomId: 1,
    roomName: 'General',
    title: 'User joined',
    content: 'Bob joined the room',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: true,
    userId: 456,
    userName: 'Bob',
  },
  {
    id: '4',
    type: 'mention',
    roomId: 3,
    roomName: 'Design',
    title: 'Sarah mentioned you',
    content: '@currentuser what do you think about this design?',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isRead: true,
    messageId: 789,
    userName: 'Sarah',
  },
]

function getNotificationIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'mention':
      return <AtSign className="h-4 w-4 text-blue-500" />
    case 'message':
      return <Hash className="h-4 w-4 text-green-500" />
    case 'user-joined':
      return <UserPlus className="h-4 w-4 text-emerald-500" />
    case 'user-left':
      return <UserMinus className="h-4 w-4 text-orange-500" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInMinutes < 24 * 60) {
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ago`
  } else if (isToday(date)) {
    return format(date, 'HH:mm')
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`
  } else {
    return format(date, 'MMM d, HH:mm')
  }
}

interface NotificationItemProps {
  notification: NotificationItem
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDelete: (id: string) => void
  onNavigate: (roomId: number, messageId?: number) => void
}

function NotificationItemComponent({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onNavigate,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id)
    }
    onNavigate(notification.roomId, notification.messageId)
  }

  return (
    <div
      className={cn(
        'group hover:bg-muted/50 cursor-pointer border-b p-3 transition-colors',
        !notification.isRead && 'bg-primary/5 border-l-primary border-l-4'
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.type)}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{notification.title}</p>
                {!notification.isRead && (
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                )}
              </div>
              <p className="text-muted-foreground mt-1 text-sm">{notification.content}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  #{notification.roomName}
                </Badge>
                <span className="text-muted-foreground text-xs">
                  {formatNotificationTime(notification.timestamp)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {notification.isRead ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={e => {
                    e.stopPropagation()
                    onMarkAsUnread(notification.id)
                  }}
                  title="Mark as unread"
                >
                  <Check className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={e => {
                    e.stopPropagation()
                    onMarkAsRead(notification.id)
                  }}
                  title="Mark as read"
                >
                  <CheckCheck className="h-3 w-3" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-6 w-6 p-0"
                onClick={e => {
                  e.stopPropagation()
                  onDelete(notification.id)
                }}
                title="Delete notification"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationHistory({ className }: NotificationHistoryProps) {
  const { setCurrentRoom, joinRoom, rooms } = useChatStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions'>('all')

  // Filter notifications based on selected filter
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => !n.isRead)
        break
      case 'mentions':
        filtered = filtered.filter(n => n.type === 'mention')
        break
      default:
        // Show all notifications
        break
    }

    // Sort by timestamp (newest first)
    return filtered.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [notifications, filter])

  const unreadCount = notifications.filter(n => !n.isRead).length
  const mentionCount = notifications.filter(n => n.type === 'mention' && !n.isRead).length

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const handleMarkAsUnread = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: false } : n)))
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const handleClearAll = () => {
    setNotifications([])
  }

  const handleNavigateToRoom = async (roomId: number, messageId?: number) => {
    try {
      const room = rooms.find(r => r.id === roomId)
      if (room) {
        await joinRoom(roomId)
        setCurrentRoom(room)

        // If there's a specific message, we could scroll to it
        if (messageId) {
          // This would be handled by the MessageList component
          setTimeout(() => {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
            if (messageElement) {
              messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 100)
        }
      }
    } catch (error) {
      console.error('Failed to navigate to room:', error)
    }
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 px-1.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filter === 'all'}
                onCheckedChange={() => setFilter('all')}
              >
                All notifications
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === 'unread'}
                onCheckedChange={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === 'mentions'}
                onCheckedChange={() => setFilter('mentions')}
              >
                Mentions ({mentionCount})
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <BellOff className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all as read
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleClearAll}
                className="text-destructive focus:text-destructive"
                disabled={notifications.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'hover:bg-muted/50 flex-1 px-4 py-2 text-sm font-medium transition-colors',
            filter === 'all' && 'bg-muted text-foreground border-b-primary border-b-2'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={cn(
            'hover:bg-muted/50 flex-1 px-4 py-2 text-sm font-medium transition-colors',
            filter === 'unread' && 'bg-muted text-foreground border-b-primary border-b-2'
          )}
        >
          Unread
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {unreadCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setFilter('mentions')}
          className={cn(
            'hover:bg-muted/50 flex-1 px-4 py-2 text-sm font-medium transition-colors',
            filter === 'mentions' && 'bg-muted text-foreground border-b-primary border-b-2'
          )}
        >
          Mentions
          {mentionCount > 0 && (
            <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">
              {mentionCount}
            </Badge>
          )}
        </button>
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1">
        {filteredNotifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <Bell className="text-muted-foreground/50 mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-medium">No notifications</h3>
            <p className="text-muted-foreground text-sm">
              {filter === 'unread'
                ? "You're all caught up!"
                : filter === 'mentions'
                  ? 'No mentions yet'
                  : 'Notifications will appear here'}
            </p>
          </div>
        ) : (
          <div>
            {filteredNotifications.map(notification => (
              <NotificationItemComponent
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onMarkAsUnread={handleMarkAsUnread}
                onDelete={handleDelete}
                onNavigate={handleNavigateToRoom}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
