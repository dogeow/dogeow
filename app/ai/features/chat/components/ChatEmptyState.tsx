import React from 'react'
import { Sparkles } from 'lucide-react'

interface ChatEmptyStateProps {
  variant?: 'dialog' | 'page'
}

export const ChatEmptyState = React.memo<ChatEmptyStateProps>(({ variant = 'page' }) => {
  if (variant === 'dialog') {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Sparkles className="h-8 w-8" />
          </div>
          <p className="text-muted-foreground text-sm">输入问题开始与我对话</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="bg-muted text-muted-foreground mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Sparkles className="h-8 w-8" />
        </div>
        <p className="text-muted-foreground text-sm">输入问题开始与我对话</p>
      </div>
    </div>
  )
})

ChatEmptyState.displayName = 'ChatEmptyState'
