import React from 'react'
import { Sparkles, Trash2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import Link from 'next/link'

interface ChatHeaderProps {
  title?: string
  subtitle?: string
  hasMessages: boolean
  isLoading: boolean
  onClear: () => void
  variant?: 'dialog' | 'page'
}

export const ChatHeader = React.memo<ChatHeaderProps>(
  ({ title = 'AI 助理', subtitle, hasMessages, isLoading, onClear, variant = 'page' }) => {
    if (variant === 'dialog') {
      return (
        <div className="!flex h-12 !flex-row items-center justify-between border-b px-4 py-0">
          <div className="m-0 flex min-w-0 flex-1 items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="h-4 w-4" />
            </div>
            <DialogTitle className="truncate text-base leading-none">{title}</DialogTitle>
          </div>
          <div className="flex shrink-0 items-center gap-1 pr-10">
            {hasMessages && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                disabled={isLoading}
                className="text-muted-foreground h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )
    }

    // page variant
    return (
      <div className="bg-background border-b px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/ai/knowledge" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">知识库问答</span>
              </Link>
            </Button>
            {hasMessages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }
)

ChatHeader.displayName = 'ChatHeader'
