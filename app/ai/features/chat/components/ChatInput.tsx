import React from 'react'
import { Send, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ChatInputProps {
  prompt: string
  onPromptChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isLoading: boolean
  variant?: 'dialog' | 'page'
  showHint?: boolean
  placeholder?: string
}

export const ChatInput = React.memo<ChatInputProps>(
  ({
    prompt,
    onPromptChange,
    onSend,
    onStop,
    isLoading,
    variant = 'page',
    showHint = false,
    placeholder,
  }) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault()
        if (prompt.trim() && !isLoading) {
          onSend()
        }
      }
    }

    if (variant === 'dialog') {
      return (
        <div className="border-t p-2">
          <div className="flex items-end gap-2">
            <Textarea
              value={prompt}
              onChange={event => onPromptChange(event.target.value)}
              placeholder={placeholder || '输入消息...'}
              className="[field-sizing:fixed] h-[60px] max-h-[60px] min-h-[60px] resize-none overflow-y-auto"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={isLoading && onStop ? onStop : onSend}
                disabled={isLoading ? false : !prompt.trim()}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      )
    }

    // page variant
    return (
      <div className="bg-background border-t p-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-2">
            <Textarea
              value={prompt}
              onChange={event => onPromptChange(event.target.value)}
              placeholder={placeholder || '输入消息...'}
              className="min-h-[60px] resize-none"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={isLoading && onStop ? onStop : onSend}
                disabled={isLoading ? false : !prompt.trim()}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          {showHint && (
            <p className="text-muted-foreground mt-2 text-center text-xs">
              按 Enter 发送，Shift + Enter 换行
            </p>
          )}
        </div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
