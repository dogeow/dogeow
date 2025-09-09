'use client'

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'

import { cn } from '@/lib/helpers'
import useChatStore from '@/app/chat/chatStore'
import type { ChatMessage } from '../types'
import { MessageInteractions } from './MessageInteractions'
import { MentionHighlight, useMentionDetection } from './MentionHighlight'
import { useTranslation } from '@/hooks/useTranslation'

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
        <MentionHighlight text={message.message} />
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

export function MessageList({ roomId, className, onReply, searchQuery }: MessageListProps) {
  const { t } = useTranslation()
  const roomKey = roomId.toString()

  // 使用具体的选择器来确保正确订阅消息变化
  const messages = useChatStore(state => state.messages)
  const isLoading = useChatStore(state => state.isLoading)
  const loadMessages = useChatStore(state => state.loadMessages)

  // 直接订阅当前房间的消息，确保组件重新渲染
  const roomMessages = useChatStore(state => {
    const messages = state.messages[roomKey] || []
    console.log(
      '🔥 MessageList: Store selector called for room',
      roomKey,
      '- Messages count:',
      messages.length
    )
    return messages
  })

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

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const previousMessageCountRef = useRef(0)
  const isUserScrollingRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  // Handle message reactions
  const handleReact = useCallback((messageId: number, emoji: string) => {
    // In a real app, this would send a reaction to the server
    console.log('React to message', messageId, 'with', emoji)
    // TODO: Implement actual reaction functionality
  }, [])

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollArea = e.currentTarget
    const currentScrollTop = scrollArea.scrollTop
    const scrollHeight = scrollArea.scrollHeight
    const clientHeight = scrollArea.clientHeight

    // 检测用户是否手动滚动（向上滚动查看历史消息）
    const isNearBottom = currentScrollTop + clientHeight >= scrollHeight - 50

    if (currentScrollTop < lastScrollTopRef.current) {
      // 用户向上滚动
      isUserScrollingRef.current = true
      setShouldScrollToBottom(false)
    } else if (isNearBottom) {
      // 用户滚动到底部附近
      isUserScrollingRef.current = false
      setShouldScrollToBottom(true)
    }

    lastScrollTopRef.current = currentScrollTop
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

  // Debug: Log message data
  useEffect(() => {
    console.log('🔥 MessageList: Messages changed for room', roomId, ':', {
      count: filteredMessages.length,
      messages: filteredMessages.map(m => ({
        id: m.id,
        message: m.message.substring(0, 50),
        user: m.user.name,
      })),
    })
  }, [filteredMessages, roomId])

  // Debug: Log when messages object reference changes
  useEffect(() => {
    console.log('🔥 MessageList: Messages object reference changed for room', roomId)
  }, [messages, roomId])

  // Load messages on mount
  useEffect(() => {
    if (roomId) {
      console.log('🔥 MessageList: Loading messages for room', roomId)
      loadMessages(roomId).catch(error => {
        console.error('Failed to load messages:', error)
      })
    }
  }, [roomId, loadMessages])

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (shouldScrollToBottom && scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      // 使用 requestAnimationFrame 确保 DOM 更新完成后再滚动
      requestAnimationFrame(() => {
        scrollArea.scrollTop = scrollArea.scrollHeight
        console.log('🔥 MessageList: 滚动到底部，scrollHeight:', scrollArea.scrollHeight)
      })
    }
  }, [filteredMessages, shouldScrollToBottom])

  // Track message count changes
  useEffect(() => {
    const currentCount = filteredMessages.length
    const previousCount = previousMessageCountRef.current

    if (currentCount > previousCount) {
      // New messages added, scroll to bottom
      console.log('🔥 MessageList: 检测到新消息，消息数量从', previousCount, '增加到', currentCount)
      console.log('🔥 MessageList: 用户是否在手动滚动:', isUserScrollingRef.current)

      // 只有在用户没有手动滚动时才自动滚动到底部
      if (!isUserScrollingRef.current) {
        setShouldScrollToBottom(true)

        // 立即滚动到底部，不等待状态更新
        if (scrollAreaRef.current) {
          requestAnimationFrame(() => {
            const scrollArea = scrollAreaRef.current
            if (scrollArea) {
              scrollArea.scrollTop = scrollArea.scrollHeight
              console.log('🔥 MessageList: 立即滚动到底部，scrollHeight:', scrollArea.scrollHeight)
            }
          })
        }
      } else {
        console.log('🔥 MessageList: 用户正在查看历史消息，不自动滚动')
      }
    }

    previousMessageCountRef.current = currentCount
  }, [filteredMessages.length])

  if (filteredMessages.length === 0 && !isLoading) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div className="p-2">
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
            {(() => {
              console.log('🔥 MessageList: Rendering messages:', {
                roomId,
                roomKey,
                roomMessagesCount: roomMessages.length,
                groupedMessagesCount: groupedMessages.length,
                isLoading,
              })
              return groupedMessages.map((group, index) => {
                if (group.type === 'messages' && group.messages && group.user) {
                  console.log('🔥 MessageList: Rendering group', index, ':', {
                    messageCount: group.messages.length,
                    firstMessage: group.messages[0]?.message.substring(0, 50),
                  })
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
              })
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
