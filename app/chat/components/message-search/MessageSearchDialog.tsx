'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ChatMessage } from '@/app/chat/types'
import { useMessageSearch } from '@/app/chat/hooks/message-search/useMessageSearch'

interface MessageSearchProps {
  messages: ChatMessage[]
  onMessageSelect?: (messageId: number) => void
}

/**
 * 消息搜索对话框
 */
export function MessageSearchDialog({ messages, onMessageSelect }: MessageSearchProps) {
  const {
    searchQuery,
    setSearchQuery,
    visibleMessages,
    isOpen,
    setIsOpen,
    handleMessageSelect,
    hasMore,
    loadMore,
  } = useMessageSearch(messages, onMessageSelect)

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    const escaped = query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')
    const regex = new RegExp(`(${escaped})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        <span key={index}>{part}</span>
      )
    )
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
              {visibleMessages.length > 0 ? (
                visibleMessages.map(message => (
                  <div
                    key={message.id}
                    onClick={() => handleMessageSelect(message.id)}
                    className="hover:bg-muted/50 cursor-pointer rounded-lg border p-3 transition-colors"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {highlightText(message.user.name, searchQuery)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(message.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {highlightText(message.message, searchQuery)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No messages found</p>
                </div>
              )}

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="outline" size="sm" onClick={loadMore}>
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
