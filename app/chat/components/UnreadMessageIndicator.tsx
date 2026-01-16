'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/helpers'

interface UnreadMessageIndicatorProps {
  unreadCount: number
  onScrollToBottom: () => void
  className?: string
}

/**
 * 未读消息指示器组件
 */
export const UnreadMessageIndicator: React.FC<UnreadMessageIndicatorProps> = React.memo(
  ({ unreadCount, onScrollToBottom, className }) => {
    const isVisible = unreadCount > 0
    const animationKey = unreadCount

    const handleClick = useCallback(() => {
      onScrollToBottom()
    }, [onScrollToBottom])

    if (!isVisible) return null

    return (
      <div
        className={cn(
          'absolute top-4 right-4 z-50 transition-all duration-300',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          className
        )}
      >
        <Button
          key={animationKey}
          onClick={handleClick}
          className={cn(
            'bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-full shadow-lg',
            'h-10 px-4 text-sm font-medium',
            'animate-[pulse_3s_ease-in-out_1]'
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
)
UnreadMessageIndicator.displayName = 'UnreadMessageIndicator'

// Hook to track scroll position and calculate unread messages
export function useUnreadMessages(
  messages: Array<{ id?: number }>,
  isAtBottom: boolean,
  lastReadMessageId?: number
) {
  const [unreadCount, setUnreadCount] = useState(0)
  const prevMessagesLengthRef = useRef(messages.length)
  const lastReadMessageIdRef = useRef<number | undefined>(lastReadMessageId)

  // 更新最后已读消息ID
  useEffect(() => {
    if (lastReadMessageId !== undefined) {
      lastReadMessageIdRef.current = lastReadMessageId
    }
  }, [lastReadMessageId])

  useEffect(() => {
    const prevMsgLen = prevMessagesLengthRef.current
    const currMsgLen = messages.length

    // 如果有新消息且用户不在底部
    if (currMsgLen > prevMsgLen && !isAtBottom) {
      const newMsgsCount = currMsgLen - prevMsgLen
      setUnreadCount(prev => prev + newMsgsCount)
    }
    // 如果用户在底部，清除未读计数
    if (isAtBottom) {
      setUnreadCount(0)
    }
    prevMessagesLengthRef.current = currMsgLen
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

    container.addEventListener('scroll', handleScroll, { passive: true }) // 更优地监听
    // 初始检查
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [containerRef])

  return { isAtBottom, isNearBottom }
}
