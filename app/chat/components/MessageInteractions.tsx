'use client'

import React, { useState } from 'react'
import {
  Copy,
  MoreHorizontal,
  Reply,
  Smile,
  Search,
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Frown,
} from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
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

// Common emoji reactions
const EMOJI_REACTIONS = [
  { emoji: '👍', label: 'Like', icon: ThumbsUp },
  { emoji: '❤️', label: 'Love', icon: Heart },
  { emoji: '😂', label: 'Laugh', icon: Laugh },
  { emoji: '😢', label: 'Sad', icon: Frown },
  { emoji: '😠', label: 'Angry', icon: Angry },
]

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

// Emoji picker component
function EmojiPicker({ onEmojiSelect }: { onEmojiSelect: (emoji: string) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2 p-2">
      {EMOJI_REACTIONS.map(({ emoji, label, icon: Icon }) => (
        <TooltipProvider key={emoji}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onEmojiSelect(emoji)}
                className="hover:bg-muted flex items-center justify-center rounded p-2 transition-colors"
              >
                <Icon className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
  const [showReactions, setShowReactions] = useState(false)

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
    setShowReactions(false)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Message reactions */}
      <MessageReactions reactions={reactions} onReact={handleReact} />

      {/* Interaction buttons - shown on hover */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {/* React button */}
        <DropdownMenu open={showReactions} onOpenChange={setShowReactions}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Smile className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-auto p-0">
            <EmojiPicker onEmojiSelect={handleReact} />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reply button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onReply?.(message)}
              >
                <Reply className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reply</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyMessage}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Message
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onReply?.(message)}>
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
