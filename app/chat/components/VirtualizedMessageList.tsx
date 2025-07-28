'use client'

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'

import { Skeleton } from '@/components/ui/skeleton'
import { VirtualScroll, useVirtualScroll } from '@/components/ui/virtual-scroll'
import { cn } from '@/lib/helpers'
import useChatStore from '@/stores/chatStore'
import type { ChatMessage } from '@/types/chat'
import { MessageInteractions, MessageSearch } from './MessageInteractions'
import { MentionHighlight, useMentionDetection } from './MentionHighlight'
import { NotificationBadge } from './NotificationBadge'

interface VirtualizedMessageListProps {
  roomId: number
  className?: string
  onReply?: (message: ChatMessage) => void
  containerHeight?: number
}

interface MessageItem {
  id: string | number
  type: 'message' | 'date-separator' | 'loading'
  data: ChatMessage | string
  height?: number
}

// Simple Avatar component
function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        'bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
        className
      )}
    >
      {initials}
    </div>
  )
}

// Format timestamp for display
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)

  if (isToday(date)) {
    return format(date, 'HH:mm')
  } else if (isYesterday(date)) {
    return `Yesterday ${format(date, 'HH:mm')}`
  } else {
    return format(date, 'MMM d, HH:mm')
  }
}

// Date separator component
function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
        {date}
      </div>
    </div>
  )
}

// Message content component with mention highlighting
function MessageContent({
  message,
  isSelected,
  onSelect,
  onReply,
  onReact,
  onMentionClick,
}: {
  message: ChatMessage
  isSelected: boolean
  onSelect: () => void
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
  onMentionClick: (username: string) => void
}) {
  const mentionInfo = useMentionDetection(message.message)

  return (
    <div
      data-message-id={message.id}
      className={cn(
        'text-sm leading-relaxed',
        isSelected && 'bg-primary/10 -mx-2 rounded px-2 py-1',
        mentionInfo.hasCurrentUserMention && 'bg-primary/5 border-l-primary -ml-2 border-l-2 pl-2'
      )}
      onClick={onSelect}
    >
      {message.message_type === 'system' ? (
        <span className="text-muted-foreground italic">{message.message}</span>
      ) : (
        <div className="space-y-1">
          <div className="flex items-start gap-2">
            <MentionHighlight
              text={message.message}
              onMentionClick={onMentionClick}
              className="flex-1"
            />
            {mentionInfo.hasCurrentUserMention && (
              <NotificationBadge
                count={1}
                hasMentions={true}
                showIcon={true}
                size="sm"
                className="flex-shrink-0"
              />
            )}
          </div>
          <MessageInteractions message={message} onReply={onReply} onReact={onReact} />
        </div>
      )}
    </div>
  )
}

// Single message component
function MessageItem({
  message,
  onReply,
  onReact,
  style,
}: {
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
  style: React.CSSProperties
}) {
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null)

  const handleMentionClick = (username: string) => {
    console.log('Clicked mention:', username)
  }

  return (
    <div className="group hover:bg-muted/50 flex gap-3 px-4 py-2" style={style}>
      <Avatar name={message.user.name} className="mt-1 flex-shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{message.user.name}</span>
          <span className="text-muted-foreground text-xs">
            {formatMessageTime(message.created_at)}
          </span>
        </div>
        <MessageContent
          message={message}
          isSelected={selectedMessageId === message.id}
          onSelect={() => setSelectedMessageId(message.id)}
          onReply={onReply}
          onReact={onReact}
          onMentionClick={handleMentionClick}
        />
      </div>
    </div>
  )
}

// Loading skeleton
function LoadingItem({ style }: { style: React.CSSProperties }) {
  return (
    <div className="flex gap-3 px-4 py-2" style={style}>
      <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    </div>
  )
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="text-muted-foreground mb-2">
        <svg
          className="mx-auto mb-4 h-12 w-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="mb-1 text-lg font-medium">No messages yet</h3>
      <p className="text-muted-foreground text-sm">Be the first to start the conversation!</p>
    </div>
  )
}

export function VirtualizedMessageList({
  roomId,
  className,
  onReply,
  containerHeight = 600,
}: VirtualizedMessageListProps) {
  const { messages, messagesPagination, isLoading, loadMessages, loadMoreMessages } = useChatStore()
  const previousMessageCountRef = useRef(0)

  const roomKey = roomId.toString()
  const roomMessages = useMemo(() => messages[roomKey] || [], [messages, roomKey])
  const pagination = messagesPagination[roomKey]
  const hasMoreMessages = pagination?.has_more || false

  // Virtual scroll hook
  const { scrollToIndex, scrollToBottom, scrollToItem, scrollToEnd } = useVirtualScroll({
    items: roomMessages,
    containerHeight,
    itemHeight: 80, // Average message height
  })

  // Handle message reactions
  const handleReact = useCallback((messageId: number, emoji: string) => {
    console.log('React to message', messageId, 'with', emoji)
  }, [])

  // Handle message search selection
  const handleMessageSelect = useCallback(
    (messageId: number) => {
      // Find message index and scroll to it
      const messageIndex = roomMessages.findIndex(msg => msg.id === messageId)
      if (messageIndex !== -1) {
        scrollToItem(messageIndex)
      }

      // Clear highlight after a few seconds
      setTimeout(() => {
        // This part of the logic was removed as per the edit hint
      }, 3000)
    },
    [roomMessages, scrollToItem]
  )

  // Load initial messages when room changes
  useEffect(() => {
    if (roomId) {
      loadMessages(roomId)
        .then(() => {
          console.log('VirtualizedMessageList: loadMessages completed for room:', roomId)
          // Scroll to bottom for initial load
          setTimeout(() => scrollToEnd(), 100)
        })
        .catch(error => {
          console.error('VirtualizedMessageList: loadMessages failed for room:', roomId, error)
        })
    }
  }, [roomId, loadMessages, scrollToEnd])

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (roomMessages.length > previousMessageCountRef.current) {
      scrollToEnd()
    }
    previousMessageCountRef.current = roomMessages.length
  }, [roomMessages.length, scrollToEnd])

  // Convert messages to virtual scroll items
  const virtualItems = useMemo((): MessageItem[] => {
    const items: MessageItem[] = []
    let currentDate = ''

    roomMessages.forEach(message => {
      const messageDate = format(new Date(message.created_at), 'yyyy-MM-dd')

      // Add date separator if date changed
      if (messageDate !== currentDate) {
        currentDate = messageDate
        const dateLabel = isToday(new Date(messageDate))
          ? 'Today'
          : isYesterday(new Date(messageDate))
            ? 'Yesterday'
            : format(new Date(messageDate), 'MMMM d, yyyy')

        items.push({
          id: `date-${messageDate}`,
          type: 'date-separator',
          data: dateLabel,
          height: 40,
        })
      }

      // Add message
      items.push({
        id: message.id,
        type: 'message',
        data: message,
        height: message.message_type === 'system' ? 60 : 80,
      })
    })

    // Add loading item if loading more
    if (isLoading && hasMoreMessages) {
      items.unshift({
        id: 'loading',
        type: 'loading',
        data: '', // No specific data for loading, just a placeholder
        height: 60,
      })
    }

    return items
  }, [roomMessages, isLoading, hasMoreMessages])

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasMoreMessages && !isLoading && pagination?.next_cursor) {
      loadMoreMessages(roomId)
    }
  }, [hasMoreMessages, isLoading, pagination?.next_cursor, loadMoreMessages, roomId])

  // Render virtual item
  const renderItem = useCallback(
    (item: MessageItem, _index: number, style: React.CSSProperties) => {
      switch (item.type) {
        case 'date-separator':
          return <DateSeparator date={item.data as string} />

        case 'loading':
          return <LoadingItem style={style} />

        case 'message':
          if (!item.data) return null
          return (
            <MessageItem
              message={item.data as ChatMessage}
              onReply={onReply}
              onReact={handleReact}
              style={style}
            />
          )

        default:
          return null
      }
    },
    [onReply, handleReact]
  )

  // Show loading state for initial load
  if (isLoading && roomMessages.length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-4 py-2">
              <Skeleton className="h-8 w-8 flex-shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show empty state
  if (!isLoading && roomMessages.length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Search functionality */}
      <div className="border-b p-2">
        <MessageSearch messages={roomMessages} onMessageSelect={handleMessageSelect} />
      </div>

      {/* Virtualized message list */}
      <div className="flex-1">
        <VirtualScroll
          items={virtualItems}
          itemHeight={item => item.height || 80} // Default to 80 if height is not set
          containerHeight={containerHeight - 60} // Account for search bar
          renderItem={renderItem}
          onLoadMore={handleLoadMore}
          hasMore={hasMoreMessages}
          loading={isLoading}
          scrollToIndex={scrollToIndex}
          scrollToBottom={scrollToBottom}
          overscan={3}
        />
      </div>
    </div>
  )
}
