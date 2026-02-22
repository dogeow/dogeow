import React from 'react'
import { User } from 'lucide-react'
import Image from 'next/image'
import type { ChatMessage } from '../types'
import { SimpleMarkdown } from './SimpleMarkdown'

interface ChatMessageItemProps {
  message: ChatMessage
  variant?: 'dialog' | 'page'
}

export const ChatMessageItem = React.memo<ChatMessageItemProps>(({ message, variant = 'page' }) => {
  const isUser = message.role === 'user'

  if (variant === 'dialog') {
    return (
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
        {/* 消息气泡 */}
        <div
          className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'} ${isUser ? 'max-w-[80%]' : 'max-w-full'} min-w-0`}
        >
          <div
            className={`rounded-xl px-3 py-2 break-words ${isUser ? '' : 'w-full'} ${
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
            }`}
          >
            <div
              className={
                isUser
                  ? '[&_.prose]:prose-invert [&_.prose_*]:!text-primary-foreground [&_.prose]:my-0 [&_.prose_p]:!my-0 [&_.prose_p]:!mt-0 [&_.prose_p]:!mb-0'
                  : '[&_.prose]:prose-neutral [&_.prose_*]:!text-foreground [&_.prose]:my-0 [&_.prose_p]:!my-0 [&_.prose_p]:!mt-0 [&_.prose_p]:!mb-0'
              }
            >
              <SimpleMarkdown content={message.content} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // page variant
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* 头像 */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${
          isUser ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Image
            src="/80.png"
            alt="DogeOW Logo"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* 消息气泡 */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isUser ? 'bg-muted text-foreground' : 'bg-muted text-foreground'
          }`}
        >
          <SimpleMarkdown
            content={message.content}
            className={isUser ? '[&_*]:text-foreground' : '[&_*]:text-foreground'}
          />
        </div>
      </div>
    </div>
  )
})

ChatMessageItem.displayName = 'ChatMessageItem'
