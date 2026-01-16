'use client'

import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'

import { cn } from '@/lib/helpers'
import useChatStore from '@/app/chat/chatStore'
import type { ChatMessage } from '../types'
import { MessageInteractions } from './MessageInteractions'
import { MentionHighlight, useMentionDetection } from './MentionHighlight'
import { useTranslation } from '@/hooks/useTranslation'
import ChatErrorBoundary from './ChatErrorBoundary'

interface MessageListProps {
  roomId: number
  className?: string
  onReply?: (message: ChatMessage) => void
  searchQuery?: string
}

interface MessageGroupProps {
  messages: ChatMessage[]
  user: { id: number; name: string; email: string }
  timestamp: Date
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
}

interface MessageItemProps {
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
}

function MessageItem({ message, onReply, onReact }: MessageItemProps) {
  const mentionInfo = useMentionDetection(message.message)
  const isImageUrl = useMemo(() => {
    const trimmed = message.message.trim()
    return /^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(trimmed)
  }, [message.message])

  return (
    <div
      className={cn(
        'group/message relative rounded-lg p-3 transition-colors',
        'md:pr-12', // Add right padding for desktop menu
        mentionInfo.hasCurrentUserMention
          ? 'bg-yellow-50 dark:bg-yellow-950/20'
          : 'hover:bg-muted/50'
      )}
    >
      {/* Message content */}
      <div className="prose prose-sm max-w-none">
        {isImageUrl ? (
          <img
            src={message.message.trim()}
            alt="uploaded"
            className="max-h-72 w-auto max-w-full rounded-lg"
            loading="lazy"
          />
        ) : (
          <MentionHighlight text={message.message} />
        )}
      </div>

      {/* Message interactions */}
      <MessageInteractions message={message} onReply={onReply} onReact={onReact} />
    </div>
  )
}

function MessageGroup({ messages, user, timestamp, onReply, onReact }: MessageGroupProps) {
  const { t } = useTranslation()

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return t('chat.yesterday', 'Yesterday')
    } else {
      return format(date, 'MMM d')
    }
  }

  return (
    <div className="group relative">
      {/* User info and timestamp */}
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.name}</span>
          <span className="text-muted-foreground text-xs">{formatTimestamp(timestamp)}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-1">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} onReply={onReply} onReact={onReact} />
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-muted-foreground mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium">{t('chat.no_messages', 'No messages yet')}</h3>
      <p className="text-muted-foreground text-sm">
        {t('chat.be_first_to_start', 'Be the first to start the conversation!')}
      </p>
    </div>
  )
}

function MessageListContent({ roomId, className, onReply, searchQuery }: MessageListProps) {
  const { t } = useTranslation()
  const roomKey = roomId.toString()

  // 使用具体的选择器来确保正确订阅消息变化
  const isLoading = useChatStore(state => state.isLoading)
  const loadMessages = useChatStore(state => state.loadMessages)

  // 稳定loadMessages函数引用
  const stableLoadMessages = useCallback(
    (roomId: number) => {
      return loadMessages(roomId)
    },
    [loadMessages]
  )

  // 直接订阅整个 messages 对象，然后在组件内部过滤
  const messages = useChatStore(state => state.messages)

  // 使用 useMemo 来获取当前房间的消息，避免无限循环
  const roomMessages = useMemo(() => {
    const roomMessages = messages[roomKey] || []

    return roomMessages
  }, [messages, roomKey])

  // 过滤消息基于搜索查询
  const filteredMessages = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === '') {
      return roomMessages
    }

    const query = searchQuery.toLowerCase().trim()
    return roomMessages.filter(
      message =>
        message.message.toLowerCase().includes(query) ||
        message.user.name.toLowerCase().includes(query)
    )
  }, [roomMessages, searchQuery])

  const previousMessageCountRef = useRef(0)
  const isUserScrollingRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  // Handle message reactions
  const handleReact = useCallback((messageId: number, emoji: string) => {
    // In a real app, this would send a reaction to the server
    console.log('React to message', messageId, 'with', emoji)
    // TODO: Implement actual reaction functionality
  }, [])

  // 获取滚动容器（由父组件控制）
  const getScrollContainer = useCallback(() => {
    return document.querySelector('.chat-messages-mobile') as HTMLDivElement | null
  }, [])

  // Group messages by user and time
  const groupedMessages = useMemo(() => {
    if (filteredMessages.length === 0) return []

    const groups: Array<{
      type: 'messages'
      messages: ChatMessage[]
      user: { id: number; name: string; email: string }
      timestamp: Date
    }> = []

    let currentGroup: (typeof groups)[0] | null = null

    filteredMessages.forEach(message => {
      const messageDate = new Date(message.created_at)
      const timeDiff = currentGroup
        ? Math.abs(messageDate.getTime() - currentGroup.timestamp.getTime())
        : Infinity

      // Start new group if:
      // 1. Different user
      // 2. More than 5 minutes apart
      // 3. First message
      if (!currentGroup || currentGroup.user.id !== message.user.id || timeDiff > 5 * 60 * 1000) {
        currentGroup = {
          type: 'messages',
          messages: [message],
          user: message.user,
          timestamp: messageDate,
        }
        groups.push(currentGroup)
      } else {
        currentGroup.messages.push(message)
      }
    })

    return groups
  }, [filteredMessages])

  // Debug: Log message data (only in development and with throttling)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 MessageList: Messages changed for room', roomId, ':', {
        count: filteredMessages.length,
        messages: filteredMessages.map(m => ({
          id: m.id,
          message: m.message.substring(0, 50),
          user: m.user.name,
        })),
      })
    }
  }, [filteredMessages, roomId]) // 恢复完整依赖，但使用useMemo优化filteredMessages

  // Load messages on mount
  useEffect(() => {
    if (roomId) {
      stableLoadMessages(roomId).catch(error => {
        // 安全地处理错误，避免直接输出复杂对象
        if (error instanceof Error) {
          console.error('Failed to load messages:', error.message)
        } else if (error && typeof error === 'object') {
          console.error('Failed to load messages:', {
            type: typeof error,
            message: error.message || 'Unknown error',
            status: error.status || 'No status',
            code: error.code || 'No code',
          })
        } else {
          console.error('Failed to load messages:', String(error))
        }
      })
    }
  }, [roomId, stableLoadMessages])

  // 监听滚动事件和新消息
  useEffect(() => {
    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return

    const currentCount = filteredMessages.length
    const previousCount = previousMessageCountRef.current

    // 滚动事件处理
    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop
      const scrollHeight = scrollContainer.scrollHeight
      const clientHeight = scrollContainer.clientHeight

      // 检测用户是否手动滚动（向上滚动查看历史消息）
      const isNearBottom = currentScrollTop + clientHeight >= scrollHeight - 50

      if (currentScrollTop < lastScrollTopRef.current) {
        // 用户向上滚动
        isUserScrollingRef.current = true
      } else if (isNearBottom) {
        // 用户滚动到底部附近
        isUserScrollingRef.current = false
      }

      lastScrollTopRef.current = currentScrollTop
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    if (currentCount > previousCount) {
      // New messages added, scroll to bottom
      console.log('🔥 MessageList: 检测到新消息，消息数量从', previousCount, '增加到', currentCount)
      console.log('🔥 MessageList: 用户是否在手动滚动:', isUserScrollingRef.current)

      // 只有在用户没有手动滚动时才自动滚动到底部
      if (!isUserScrollingRef.current) {
        // 立即滚动到底部，不等待状态更新
        requestAnimationFrame(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight
            console.log(
              '🔥 MessageList: 立即滚动到底部，scrollHeight:',
              scrollContainer.scrollHeight
            )
          }
        })
      } else {
        console.log('🔥 MessageList: 用户正在查看历史消息，不自动滚动')
      }
    }

    previousMessageCountRef.current = currentCount

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
    }
  }, [filteredMessages.length, getScrollContainer])

  if (filteredMessages.length === 0 && !isLoading) {
    return (
      <div className={cn('p-2', className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={cn('p-2', className)}>
      {/* Load more indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('chat.loading_messages', 'Loading more messages...')}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="space-y-4">
        {groupedMessages.map((group, index) => {
          if (group.type === 'messages' && group.messages && group.user) {
            return (
              <MessageGroup
                key={`group-${index}`}
                messages={group.messages}
                user={group.user}
                timestamp={group.timestamp!}
                onReply={onReply}
                onReact={handleReact}
              />
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

export function MessageList({ roomId, className, onReply, searchQuery }: MessageListProps) {
  return (
    <ChatErrorBoundary>
      <MessageListContent
        roomId={roomId}
        className={className}
        onReply={onReply}
        searchQuery={searchQuery}
      />
    </ChatErrorBoundary>
  )
}
