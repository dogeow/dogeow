'use client'

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { format, isToday, isYesterday } from 'date-fns'

import { Skeleton } from '@/components/ui/skeleton'
import { VirtualScroll, useVirtualScroll } from '@/components/ui/virtual-scroll'
import { cn } from '@/lib/helpers'
import useChatStore from '@/app/chat/chatStore'
import type { ChatMessage } from '../types'
import { MessageInteractions, MessageSearch } from './MessageInteractions'
import { MentionHighlight, useMentionDetection } from './MentionHighlight'

// 常量定义
const DEFAULT_CONTAINER_HEIGHT = 600
const DEFAULT_MESSAGE_HEIGHT = 80
const SYSTEM_MESSAGE_HEIGHT = 60
const DATE_SEPARATOR_HEIGHT = 40
const LOADING_ITEM_HEIGHT = 60
const SEARCH_BAR_HEIGHT = 60
const SCROLL_DELAY = 100
const HIGHLIGHT_DURATION = 3000
const LOADING_SKELETON_COUNT = 5

interface VirtualizedMessageListProps {
  /** 房间ID */
  roomId: number
  /** 自定义CSS类名 */
  className?: string
  /** 回复消息的回调函数 */
  onReply?: (message: ChatMessage) => void
  /** 容器高度，默认为600px */
  containerHeight?: number
}

interface MessageItem {
  /** 项目唯一标识符 */
  id: string | number
  /** 项目类型 */
  type: 'message' | 'date-separator' | 'loading'
  /** 项目数据 */
  data: ChatMessage | string
  /** 项目高度，用于虚拟滚动 */
  height?: number
}

/**
 * 简单的头像组件
 * 根据用户名生成首字母缩写
 */
const Avatar = React.memo(({ name, className }: { name: string; className?: string }) => {
  const initials = useMemo(() => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [name])

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
})
Avatar.displayName = 'Avatar'

/**
 * 格式化消息时间戳显示
 * 根据时间显示不同的格式：今天显示时间，昨天显示"昨天+时间"，其他显示日期+时间
 */
function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp)

  if (isToday(date)) {
    return format(date, 'HH:mm')
  } else if (isYesterday(date)) {
    return `昨天 ${format(date, 'HH:mm')}`
  } else {
    return format(date, 'MMM d, HH:mm')
  }
}

/**
 * 日期分隔符组件
 * 用于在消息列表中分隔不同日期的消息
 */
const DateSeparator = React.memo(({ date }: { date: string }) => {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs font-medium">
        {date}
      </div>
    </div>
  )
})
DateSeparator.displayName = 'DateSeparator'

/**
 * 消息内容组件，支持提及高亮
 * 处理系统消息和普通消息的不同显示方式
 */
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
        </div>
      )}
    </div>
  )
}

/**
 * 单个消息组件
 * 包含用户头像、用户名、时间戳和消息内容
 */
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
    console.log('点击提及:', username)
  }

  return (
    <div className="group hover:bg-muted/50 flex gap-3 px-4 py-2 md:pr-12" style={style}>
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

/**
 * 加载骨架屏组件
 * 在消息加载时显示占位符
 */
const LoadingItem = React.memo(({ style }: { style: React.CSSProperties }) => {
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
})
LoadingItem.displayName = 'LoadingItem'

/**
 * 空状态组件
 * 当没有消息时显示的占位内容
 */
const EmptyState = React.memo(() => {
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
      <h3 className="mb-1 text-lg font-medium">暂无消息</h3>
      <p className="text-muted-foreground text-sm">成为第一个开始对话的人吧！</p>
    </div>
  )
})
EmptyState.displayName = 'EmptyState'

/**
 * 虚拟化消息列表组件
 * 使用虚拟滚动技术优化大量消息的渲染性能
 * 支持消息搜索、分页加载、提及高亮等功能
 */
export function VirtualizedMessageList({
  roomId,
  className,
  onReply,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
}: VirtualizedMessageListProps) {
  const { messages, messagesPagination, isLoading, loadMessages, loadMoreMessages } = useChatStore()
  const previousMessageCountRef = useRef(0)

  // 获取当前房间的消息和分页信息
  const roomKey = roomId.toString()
  const roomMessages = useMemo(() => messages[roomKey] || [], [messages, roomKey])
  const pagination = messagesPagination[roomKey]
  const hasMoreMessages = pagination?.has_more || false

  // 虚拟滚动钩子，用于优化大量消息的渲染性能
  const { scrollToIndex, scrollToBottom, scrollToItem, scrollToEnd } = useVirtualScroll({
    items: roomMessages,
    containerHeight,
    itemHeight: DEFAULT_MESSAGE_HEIGHT, // 平均消息高度
  })

  // 处理消息反应
  const handleReact = useCallback((messageId: number, emoji: string) => {
    try {
      console.log('对消息', messageId, '添加反应:', emoji)
      // TODO: 实现实际的反应功能
    } catch (error) {
      console.error('添加消息反应失败:', error)
    }
  }, [])

  // 处理消息搜索选择
  const handleMessageSelect = useCallback(
    (messageId: number) => {
      try {
        // 查找消息索引并滚动到该位置
        const messageIndex = roomMessages.findIndex(msg => msg.id === messageId)
        if (messageIndex !== -1) {
          scrollToItem(messageIndex)
        } else {
          console.warn('未找到消息ID:', messageId)
        }

        // 几秒后清除高亮
        setTimeout(() => {
          // 此部分逻辑已根据编辑提示移除
        }, HIGHLIGHT_DURATION)
      } catch (error) {
        console.error('滚动到消息失败:', error)
      }
    },
    [roomMessages, scrollToItem]
  )

  // 当房间变化时加载初始消息
  useEffect(() => {
    if (roomId) {
      loadMessages(roomId)
        .then(() => {
          console.log('VirtualizedMessageList: 房间', roomId, '的消息加载完成')
          // 初始加载时滚动到底部
          setTimeout(() => scrollToEnd(), SCROLL_DELAY)
        })
        .catch(error => {
          console.error('VirtualizedMessageList: 房间', roomId, '的消息加载失败:', error)
        })
    }
  }, [roomId, loadMessages, scrollToEnd])

  // 新消息时自动滚动到底部
  useEffect(() => {
    if (roomMessages.length > previousMessageCountRef.current) {
      scrollToEnd()
    }
    previousMessageCountRef.current = roomMessages.length
  }, [roomMessages.length, scrollToEnd])

  // 将消息转换为虚拟滚动项目
  const virtualItems = useMemo((): MessageItem[] => {
    const items: MessageItem[] = []
    let currentDate = ''

    roomMessages.forEach(message => {
      const messageDate = format(new Date(message.created_at), 'yyyy-MM-dd')

      // 如果日期改变，添加日期分隔符
      if (messageDate !== currentDate) {
        currentDate = messageDate
        const dateLabel = isToday(new Date(messageDate))
          ? '今天'
          : isYesterday(new Date(messageDate))
            ? '昨天'
            : format(new Date(messageDate), 'MMMM d, yyyy')

        items.push({
          id: `date-${messageDate}`,
          type: 'date-separator',
          data: dateLabel,
          height: DATE_SEPARATOR_HEIGHT,
        })
      }

      // 添加消息
      items.push({
        id: message.id,
        type: 'message',
        data: message,
        height: message.message_type === 'system' ? SYSTEM_MESSAGE_HEIGHT : DEFAULT_MESSAGE_HEIGHT,
      })
    })

    // 如果正在加载更多消息，添加加载项
    if (isLoading && hasMoreMessages) {
      items.unshift({
        id: 'loading',
        type: 'loading',
        data: '', // 加载项没有特定数据，只是占位符
        height: LOADING_ITEM_HEIGHT,
      })
    }

    return items
  }, [roomMessages, isLoading, hasMoreMessages])

  // 处理加载更多消息
  const handleLoadMore = useCallback(() => {
    try {
      if (hasMoreMessages && !isLoading && pagination?.next_cursor) {
        loadMoreMessages(roomId)
      }
    } catch (error) {
      console.error('加载更多消息失败:', error)
    }
  }, [hasMoreMessages, isLoading, pagination?.next_cursor, loadMoreMessages, roomId])

  // 渲染虚拟项目
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

  // 显示初始加载状态
  if (isLoading && roomMessages.length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex-1 space-y-4 p-4">
          {Array.from({ length: LOADING_SKELETON_COUNT }).map((_, i) => (
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

  // 显示空状态
  if (!isLoading && roomMessages.length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <EmptyState />
      </div>
    )
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* 搜索功能 */}
      <div className="border-b p-2">
        <MessageSearch messages={roomMessages} onMessageSelect={handleMessageSelect} />
      </div>

      {/* 虚拟化消息列表 */}
      <div className="flex-1 px-4">
        <VirtualScroll
          items={virtualItems}
          itemHeight={item => item.height || DEFAULT_MESSAGE_HEIGHT} // 如果未设置高度，默认为80
          containerHeight={containerHeight - SEARCH_BAR_HEIGHT} // 考虑搜索栏的高度
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

VirtualizedMessageList.displayName = 'VirtualizedMessageList'
