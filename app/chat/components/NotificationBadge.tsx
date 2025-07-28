'use client'

import { Bell, AtSign } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/helpers'

interface NotificationBadgeProps {
  count: number
  hasMentions?: boolean
  showIcon?: boolean
  variant?: 'default' | 'destructive' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animate?: boolean
}

export function NotificationBadge({
  count,
  hasMentions = false,
  showIcon = false,
  variant,
  size = 'md',
  className,
  animate = true,
}: NotificationBadgeProps) {
  if (count === 0) return null

  // Determine variant based on mentions if not explicitly set
  const badgeVariant = variant || (hasMentions ? 'destructive' : 'secondary')

  // Size classes
  const sizeClasses = {
    sm: 'h-4 px-1 text-xs',
    md: 'h-5 px-1.5 text-xs',
    lg: 'h-6 px-2 text-sm',
  }

  // Format count display
  const displayCount = count > 99 ? '99+' : count.toString()

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        sizeClasses[size],
        'flex items-center gap-1 font-medium',
        animate && 'animate-pulse',
        className
      )}
    >
      {showIcon && (hasMentions ? <AtSign className="h-3 w-3" /> : <Bell className="h-3 w-3" />)}
      {displayCount}
    </Badge>
  )
}

interface NotificationDotProps {
  visible: boolean
  hasMentions?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export function NotificationDot({
  visible,
  hasMentions = false,
  className,
  size = 'md',
  animate = true,
}: NotificationDotProps) {
  if (!visible) return null

  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  }

  return (
    <div
      className={cn(
        'rounded-full',
        sizeClasses[size],
        hasMentions ? 'bg-destructive' : 'bg-primary',
        animate && 'animate-pulse',
        className
      )}
    />
  )
}

interface NotificationIndicatorProps {
  count: number
  hasMentions?: boolean
  showCount?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
  children: React.ReactNode
}

export function NotificationIndicator({
  count,
  hasMentions = false,
  showCount = true,
  position = 'top-right',
  className,
  children,
}: NotificationIndicatorProps) {
  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  }

  return (
    <div className={cn('relative inline-block', className)}>
      {children}
      {count > 0 && (
        <div className={cn('absolute z-10', positionClasses[position])}>
          {showCount ? (
            <NotificationBadge count={count} hasMentions={hasMentions} size="sm" />
          ) : (
            <NotificationDot visible={true} hasMentions={hasMentions} size="sm" />
          )}
        </div>
      )}
    </div>
  )
}

interface UnreadMessageIndicatorProps {
  roomId: number
  className?: string
}

export function UnreadMessageIndicator({ className }: UnreadMessageIndicatorProps) {
  // This would typically use the chat store to get unread counts
  // For now, we'll use mock data
  const unreadCount = 0 // useChatStore(state => state.getRoomUnreadCount(roomId))
  const hasMentions = false // useChatStore(state => state.hasUnreadMentions(roomId))

  return (
    <NotificationIndicator
      count={unreadCount}
      hasMentions={hasMentions}
      className={className}
      position="top-right"
    >
      <Bell className="h-5 w-5" />
    </NotificationIndicator>
  )
}

interface MentionIndicatorProps {
  count: number
  className?: string
}

export function MentionIndicator({ count, className }: MentionIndicatorProps) {
  return (
    <NotificationIndicator
      count={count}
      hasMentions={true}
      showCount={false}
      className={className}
      position="top-right"
    >
      <AtSign className="h-4 w-4" />
    </NotificationIndicator>
  )
}
