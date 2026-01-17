import React, { useMemo } from 'react'
import { ScrollArea } from '@/components/novel-editor/ui/scroll-area'
import { ChatMessageItem } from './ChatMessageItem'
import { ChatLoadingIndicator } from './ChatLoadingIndicator'
import { ChatEmptyState } from './ChatEmptyState'
import type { ChatMessage } from '../types'

interface ChatMessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
  completion?: string
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  variant?: 'dialog' | 'page'
}

export const ChatMessageList = React.memo<ChatMessageListProps>(
  ({ messages, isLoading, completion, messagesEndRef, variant = 'page' }) => {
    // 过滤掉 system 消息
    const displayMessages = useMemo(() => messages.filter(m => m.role !== 'system'), [messages])

    // 如果正在生成且最后一条是 assistant，不显示最后一条（用 completion 代替）
    const filteredMessages = useMemo(() => {
      return displayMessages.filter((msg, idx, arr) => {
        if (isLoading && idx === arr.length - 1 && msg.role === 'assistant') {
          return false
        }
        return true
      })
    }, [displayMessages, isLoading])

    const hasMessages = displayMessages.length > 0 || (isLoading && completion)

    const content = hasMessages ? (
      <div className={variant === 'dialog' ? 'space-y-2' : 'space-y-6'}>
        {/* 显示历史消息 */}
        {filteredMessages.map((msg, idx) => (
          <ChatMessageItem key={idx} message={msg} variant={variant} />
        ))}

        {/* 显示正在生成的回复 */}
        {isLoading && <ChatLoadingIndicator completion={completion} variant={variant} />}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} />
      </div>
    ) : (
      <ChatEmptyState variant={variant} />
    )

    if (variant === 'dialog') {
      return (
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-3 py-2 sm:px-4">{content}</div>
          </ScrollArea>
        </div>
      )
    }

    // page variant
    return (
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {hasMessages ? (
            <div className="mx-auto max-w-4xl px-4 py-6">{content}</div>
          ) : (
            <div className="flex h-full items-center justify-center">{content}</div>
          )}
        </ScrollArea>
      </div>
    )
  }
)

ChatMessageList.displayName = 'ChatMessageList'
