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

const MessageItem = React.memo(function MessageItem({
  message,
  onReply,
  onReact,
}: MessageItemProps) {
  const mentionInfo = useMentionDetection(message.message)
  const isImageUrl = useMemo(
    () => /^https?:\/\/\S+\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(message.message.trim()),
    [message.message]
  )

  return (
    <div
      className={cn(
        'group/message relative rounded-lg p-3 transition-colors',
        'md:pr-12',
        mentionInfo.hasCurrentUserMention
          ? 'bg-yellow-50 dark:bg-yellow-950/20'
          : 'hover:bg-muted/50'
      )}
    >
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
      <MessageInteractions message={message} onReply={onReply} onReact={onReact} />
    </div>
  )
})

const MessageGroup = React.memo(function MessageGroup({
  messages,
  user,
  timestamp,
  onReply,
  onReact,
}: MessageGroupProps) {
  const { t } = useTranslation()
  const formatTimestamp = useCallback(
    (date: Date) => {
      if (isToday(date)) return format(date, 'HH:mm')
      if (isYesterday(date)) return t('chat.yesterday', 'Yesterday')
      return format(date, 'MMM d')
    },
    [t]
  )

  return (
    <div className="group relative">
      <div className="mb-2 flex items-center gap-2">
        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.name}</span>
          <span className="text-muted-foreground text-xs">{formatTimestamp(timestamp)}</span>
        </div>
      </div>
      <div className="space-y-1">
        {messages.map(message => (
          <MessageItem key={message.id} message={message} onReply={onReply} onReact={onReact} />
        ))}
      </div>
    </div>
  )
})

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
  const roomKey = useMemo(() => roomId.toString(), [roomId])
  const isLoading = useChatStore(state => state.isLoading)
  const loadMessages = useChatStore(state => state.loadMessages)
  const messages = useChatStore(state => state.messages)
  const messagesForRoom = useMemo(() => messages[roomKey] || [], [messages, roomKey])

  const filteredMessages = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return messagesForRoom
    const query = searchQuery.toLowerCase().trim()
    return messagesForRoom.filter(
      m => m.message.toLowerCase().includes(query) || m.user.name.toLowerCase().includes(query)
    )
  }, [searchQuery, messagesForRoom])

  const previousMessageCountRef = useRef(0)
  const isUserScrollingRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  const stableLoadMessages = useCallback((id: number) => loadMessages(id), [loadMessages])

  const handleReact = useCallback((messageId: number, emoji: string) => {
    // TODO: Implement actual reaction functionality
    if (process.env.NODE_ENV === 'development') {
      // 可以根据需要打开调试日志
      console.log('React to message', messageId, 'with', emoji)
    }
  }, [])

  const getScrollContainer = useCallback(
    () => document.querySelector('.chat-messages-mobile') as HTMLDivElement | null,
    []
  )

  // 分组，优化分组逻辑与类型推断
  const groupedMessages = useMemo(() => {
    if (!filteredMessages.length) return []
    const groups: {
      messages: ChatMessage[]
      user: { id: number; name: string; email: string }
      timestamp: Date
    }[] = []

    let curGroup: (typeof groups)[number] | null = null
    for (const m of filteredMessages) {
      const curDate = new Date(m.created_at)
      const isNewGroup =
        !curGroup ||
        curGroup.user.id !== m.user.id ||
        Math.abs(curDate.getTime() - curGroup.timestamp.getTime()) > 5 * 60 * 1000

      if (isNewGroup) {
        curGroup = { messages: [m], user: m.user, timestamp: curDate }
        groups.push(curGroup)
      } else if (curGroup) {
        curGroup.messages.push(m)
      }
    }
    return groups
  }, [filteredMessages])

  // Debug log
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 MessageList: Messages changed for room', roomId, {
        count: filteredMessages.length,
        messages: filteredMessages.map(m => ({
          id: m.id,
          message: m.message.substring(0, 50),
          user: m.user.name,
        })),
      })
    }
  }, [filteredMessages, roomId])

  useEffect(() => {
    if (roomId) {
      stableLoadMessages(roomId).catch(error => {
        let errMsg: string
        if (error instanceof Error) errMsg = error.message
        else if (error && typeof error === 'object')
          errMsg = JSON.stringify({
            type: typeof error,
            message: (error as any).message || 'Unknown error',
            status: (error as any).status || 'No status',
            code: (error as any).code || 'No code',
          })
        else errMsg = String(error)
        console.error('Failed to load messages:', errMsg)
      })
    }
  }, [roomId, stableLoadMessages])

  useEffect(() => {
    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50

      if (scrollTop < lastScrollTopRef.current) {
        isUserScrollingRef.current = true
      } else if (isNearBottom) {
        isUserScrollingRef.current = false
      }
      lastScrollTopRef.current = scrollTop
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })

    const currentCount = filteredMessages.length
    const prevCount = previousMessageCountRef.current

    if (currentCount > prevCount && !isUserScrollingRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
          if (process.env.NODE_ENV === 'development') {
            console.log('🔥 MessageList: auto scroll to bottom', scrollContainer.scrollHeight)
          }
        }
      })
    }

    previousMessageCountRef.current = currentCount
    return () => scrollContainer.removeEventListener('scroll', handleScroll)
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
      {isLoading && (
        <div className="flex justify-center py-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('chat.loading_messages', 'Loading more messages...')}
          </div>
        </div>
      )}
      <div className="space-y-4">
        {groupedMessages.map((group, idx) => (
          <MessageGroup
            key={`group-${group.user.id}-${group.timestamp.getTime()}-${idx}`}
            messages={group.messages}
            user={group.user}
            timestamp={group.timestamp}
            onReply={onReply}
            onReact={handleReact}
          />
        ))}
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
