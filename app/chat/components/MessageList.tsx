'use client'

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/helpers'
import useChatStore from '@/app/chat/chatStore'
import type { ChatMessage } from '../types'
import { MessageInteractions, MessageSearch, MessageThread } from './MessageInteractions'
import { MentionHighlight, useMentionDetection } from './MentionHighlight'

interface MessageListProps {
  roomId: number
  className?: string
  onReply?: (message: ChatMessage) => void
}

interface MessageGroupProps {
  messages: ChatMessage[]
  user: ChatMessage['user']
  timestamp: string
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
          </div>
          <MessageInteractions message={message} onReply={onReply} onReact={onReact} />
          {/* Mock thread data - in real app this would come from message relationships */}
          <MessageThread
            replies={[]} // Would be populated with actual replies
          />
        </div>
      )}
    </div>
  )
}

// Message group component for consecutive messages from same user
function MessageGroup({
  messages,
  user,
  timestamp,
  onReply,
  onReact,
}: MessageGroupProps & {
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
}) {
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null)

  const handleMentionClick = (username: string) => {
    // In a real app, this could open a user profile or start a DM
    console.log('Clicked mention:', username)
  }

  // console.log('MessageGroup: messages', messages)

  return (
    <div className="group hover:bg-muted/50 flex gap-3 px-4 py-2">
      <Avatar name={user.name} className="mt-1 flex-shrink-0" />
      <div className="flex-1 space-y-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-muted-foreground text-xs">{formatMessageTime(timestamp)}</span>
        </div>
        <div className="space-y-2">
          {messages.map(message => (
            <MessageContent
              key={message.id}
              message={message}
              isSelected={selectedMessageId === message.id}
              onSelect={() => setSelectedMessageId(message.id)}
              onReply={onReply}
              onReact={onReact}
              onMentionClick={handleMentionClick}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Loading skeleton for messages
function MessageSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-2">
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

export function MessageList({ roomId, className, onReply }: MessageListProps) {
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

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true)
  const [, setHighlightedMessageId] = useState<number | null>(null)
  const previousMessageCountRef = useRef(0)

  // Handle message reactions
  const handleReact = useCallback((messageId: number, emoji: string) => {
    // In a real app, this would send a reaction to the server
    console.log('React to message', messageId, 'with', emoji)
    // TODO: Implement actual reaction functionality
  }, [])

  // Handle message search selection
  const handleMessageSelect = useCallback((messageId: number) => {
    setHighlightedMessageId(messageId)

    // Scroll to the message
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // Clear highlight after a few seconds
      setTimeout(() => setHighlightedMessageId(null), 3000)
    }
  }, [])

  // 移除useMemo，直接使用从store订阅的roomMessages
  // const roomMessages = useMemo(() => messages[roomKey] || [], [messages, roomKey])
  // const pagination = messagesPagination[roomKey]
  // const hasMoreMessages = pagination?.has_more || false

  // Debug: Log message data
  // console.log('MessageList: Room messages for', roomId, ':', {
  //   roomKey,
  //   messageCount: roomMessages.length,
  //   messages: roomMessages,
  //   pagination,
  //   isLoading
  // })

  // Debug: Log message changes
  useEffect(() => {
    console.log('🔥 MessageList: Messages changed for room', roomId, ':', {
      count: roomMessages.length,
      messages: roomMessages.map(m => ({
        id: m.id,
        message: m.message.substring(0, 50),
        user: m.user.name,
      })),
    })
  }, [roomMessages, roomId])

  // Debug: Log when messages object reference changes
  useEffect(() => {
    console.log('🔥 MessageList: messages object changed:', {
      roomKey,
      hasRoomMessages: !!messages[roomKey],
      roomMessageCount: messages[roomKey]?.length || 0,
      allRoomKeys: Object.keys(messages),
    })
  }, [messages, roomKey])

  // Debug: Log messages state changes
  useEffect(() => {
    console.log('MessageList: messages state changed:', {
      roomId,
      roomKey,
      allMessages: messages,
      roomMessages: roomMessages,
      roomMessagesLength: roomMessages.length,
    })
  }, [messages, roomId, roomKey, roomMessages])

  // Debug: Force re-render check
  useEffect(() => {
    console.log('MessageList: Component re-rendered, roomMessages count:', roomMessages.length)
  })

  // Load initial messages when room changes
  useEffect(() => {
    if (roomId) {
      // console.log('MessageList: Loading messages for room:', roomId)
      // console.log('MessageList: loadMessages function:', loadMessages)
      loadMessages(roomId)
        .then(() => {
          console.log('MessageList: loadMessages completed for room:', roomId)
        })
        .catch(error => {
          console.error('MessageList: loadMessages failed for room:', roomId, error)
        })
      setShouldScrollToBottom(true)
    }
  }, [roomId, loadMessages]) // 添加loadMessages依赖

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    if (shouldScrollToBottom && roomMessages.length > previousMessageCountRef.current) {
      const scrollArea = scrollAreaRef.current
      if (scrollArea) {
        const viewport = scrollArea.querySelector('[data-slot="scroll-area-viewport"]')
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight
        }
      }
      setShouldScrollToBottom(false)
    }
    previousMessageCountRef.current = roomMessages.length
  }, [roomMessages.length, shouldScrollToBottom])

  // Group messages by user and time
  const groupedMessages = useMemo(() => {
    return roomMessages.map(msg => ({
      type: 'messages',
      messages: [msg],
      user: msg.user,
      timestamp: msg.created_at,
    }))
  }, [roomMessages])

  // Show loading state for initial load
  if (isLoading && roomMessages.length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <MessageSkeleton key={i} />
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

      <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div>
          {/* Load more indicator */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading more messages...
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-0">
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
