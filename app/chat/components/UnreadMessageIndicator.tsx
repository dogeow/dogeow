'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface UnreadMessageIndicatorProps {
  unreadCount: number
  onScrollToBottom: () => void
  className?: string
}

export function UnreadMessageIndicator({
  unreadCount,
  onScrollToBottom,
  className,
}: UnreadMessageIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldAnimate, setShouldAnimate] = useState(false)

  // 当未读消息数量变化时显示指示器
  useEffect(() => {
    if (unreadCount > 0) {
      setIsVisible(true)
      setShouldAnimate(true)

      // 3秒后停止动画
      const timer = setTimeout(() => {
        setShouldAnimate(false)
      }, 3000)

      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
      setShouldAnimate(false)
    }
  }, [unreadCount])

  if (!isVisible || unreadCount === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'absolute top-4 right-4 z-50 transition-all duration-300',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className
      )}
    >
      <Button
        onClick={onScrollToBottom}
        className={cn(
          'bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-full shadow-lg',
          'h-10 px-4 text-sm font-medium',
          shouldAnimate && 'animate-pulse'
        )}
        size="sm"
      >
        <MessageSquare className="h-4 w-4" />
        <span>{unreadCount}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Hook to track scroll position and calculate unread messages
export function useUnreadMessages(
  messages: unknown[],
  isAtBottom: boolean,
  lastReadMessageId?: number
) {
  const [unreadCount, setUnreadCount] = useState(0)
  const previousMessageCountRef = useRef(0)
  const lastReadMessageIdRef = useRef(lastReadMessageId)

  useEffect(() => {
    // 更新最后已读消息ID
    if (lastReadMessageId !== undefined) {
      lastReadMessageIdRef.current = lastReadMessageId
    }
  }, [lastReadMessageId])

  useEffect(() => {
    const currentMessageCount = messages.length
    const previousMessageCount = previousMessageCountRef.current

    // 如果有新消息且用户不在底部
    if (currentMessageCount > previousMessageCount && !isAtBottom) {
      const newMessagesCount = currentMessageCount - previousMessageCount
      setUnreadCount(prev => prev + newMessagesCount)
    }

    // 如果用户在底部，清除未读计数
    if (isAtBottom) {
      setUnreadCount(0)
    }

    previousMessageCountRef.current = currentMessageCount
  }, [messages.length, isAtBottom])

  return unreadCount
}

// Hook to detect if user is at bottom of scroll container
export function useScrollPosition(containerRef: React.RefObject<HTMLElement | null>) {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isNearBottom, setIsNearBottom] = useState(true)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = 100 // 距离底部100px内认为是在底部

      const atBottom = scrollTop + clientHeight >= scrollHeight - threshold
      const nearBottom = scrollTop + clientHeight >= scrollHeight - threshold * 2

      setIsAtBottom(atBottom)
      setIsNearBottom(nearBottom)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })

    // 初始检查
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [containerRef])

  return { isAtBottom, isNearBottom }
}
