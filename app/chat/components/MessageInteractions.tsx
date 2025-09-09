'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Copy, MoreVertical, Reply, Search, Heart, ThumbsUp, Laugh } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/helpers'
import type { ChatMessage } from '../types'

interface MessageInteractionsProps {
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  onReact?: (messageId: number, emoji: string) => void
  className?: string
}

interface MessageSearchProps {
  messages: ChatMessage[]
  onMessageSelect?: (messageId: number) => void
}

interface EmojiReaction {
  emoji: string
  label: string
  count: number
  userReacted: boolean
}

// Message reactions component
function MessageReactions({
  reactions,
  onReact,
}: {
  reactions: EmojiReaction[]
  onReact: (emoji: string) => void
}) {
  if (reactions.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {reactions.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => onReact(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors',
            'hover:bg-muted border',
            reaction.userReacted
              ? 'bg-primary/10 border-primary/20 text-primary'
              : 'bg-muted/50 border-border'
          )}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  )
}

// Message search dialog
export function MessageSearch({ messages, onMessageSelect }: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredMessages = React.useMemo(() => {
    if (!searchQuery.trim()) return []

    return messages
      .filter(
        message =>
          message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          message.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 50) // Limit results
  }, [messages, searchQuery])

  const handleMessageSelect = (messageId: number) => {
    onMessageSelect?.(messageId)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Search className="mr-2 h-4 w-4" />
          Search Messages
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full"
          />

          {searchQuery.trim() && (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {filteredMessages.length > 0 ? (
                filteredMessages.map(message => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageSelect(message.id)}
                    className="hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-colors"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium">{message.user.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{message.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No messages found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main message interactions component
export function MessageInteractions({
  message,
  onReply,
  onReact,
  className,
}: MessageInteractionsProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const messageRef = useRef<HTMLDivElement>(null)

  // Get reactions from message data - if no reactions exist, show empty array
  const reactions: EmojiReaction[] = message.reactions || []

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.message)
      // Could show a toast notification here
    } catch (error) {
      console.error('Failed to copy message:', error)
    }
  }

  const handleReact = (emoji: string) => {
    onReact?.(message.id, emoji)
  }

  // Long press handlers for mobile
  const handleTouchStart = () => {
    if (window.innerWidth > 768) return // Only on mobile

    longPressTimer.current = setTimeout(() => {
      setShowMobileMenu(true)
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms long press
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return (
    <div
      ref={messageRef}
      className={cn('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {/* Message reactions */}
      <MessageReactions reactions={reactions} onReact={handleReact} />

      {/* Desktop: Right-side vertical menu - shown on hover */}
      <div className="absolute top-0 -right-8 hidden opacity-0 transition-opacity group-hover:opacity-100 md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hover:bg-muted/80 h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="left" className="w-48">
            <DropdownMenuItem onClick={() => onReact?.(message.id, '👍')}>
              <ThumbsUp className="mr-2 h-4 w-4" />
              点赞
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReact?.(message.id, '❤️')}>
              <Heart className="mr-2 h-4 w-4" />
              爱心
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReact?.(message.id, '😂')}>
              <Laugh className="mr-2 h-4 w-4" />
              大笑
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onReply?.(message)}>
              <Reply className="mr-2 h-4 w-4" />
              回复
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyMessage}>
              <Copy className="mr-2 h-4 w-4" />
              复制消息
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: Long press menu overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 md:hidden">
          <div className="bg-background mx-4 w-full max-w-sm rounded-lg p-4 shadow-lg">
            <div className="mb-4 text-center">
              <p className="text-muted-foreground text-sm">选择操作</p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReact?.(message.id, '👍')
                  setShowMobileMenu(false)
                }}
                className="flex items-center gap-2"
              >
                <ThumbsUp className="h-4 w-4" />
                点赞
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReact?.(message.id, '❤️')
                  setShowMobileMenu(false)
                }}
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                爱心
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReact?.(message.id, '😂')
                  setShowMobileMenu(false)
                }}
                className="flex items-center gap-2"
              >
                <Laugh className="h-4 w-4" />
                大笑
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onReply?.(message)
                  setShowMobileMenu(false)
                }}
                className="flex items-center gap-2"
              >
                <Reply className="h-4 w-4" />
                回复
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyMessage}
                className="flex flex-1 items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                复制
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileMenu(false)}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Message thread component for replies
export function MessageThread({ replies }: { replies: ChatMessage[] }) {
  if (replies.length === 0) return null

  return (
    <div className="border-muted mt-2 ml-8 space-y-2 border-l-2 pl-4">
      <div className="text-muted-foreground mb-2 text-xs">
        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
      </div>
      {replies.slice(0, 3).map(reply => (
        <div key={reply.id} className="text-sm">
          <span className="font-medium">{reply.user.name}:</span>{' '}
          <span className="text-muted-foreground">{reply.message}</span>
        </div>
      ))}
      {replies.length > 3 && (
        <button className="text-primary text-xs hover:underline">
          View {replies.length - 3} more replies
        </button>
      )}
    </div>
  )
}
