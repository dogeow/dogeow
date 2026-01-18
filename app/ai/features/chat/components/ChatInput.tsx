import React from 'react'
import { Send, Square, Cpu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'

interface ChatInputProps {
  prompt: string
  onPromptChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  isLoading: boolean
  model?: string
  onModelChange?: (value: string) => void
  variant?: 'dialog' | 'page'
  placeholder?: string
}

export const ChatInput = React.memo<ChatInputProps>(
  ({
    prompt,
    onPromptChange,
    onSend,
    onStop,
    isLoading,
    model,
    onModelChange,
    variant = 'page',
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
              className="max-h-[60px] min-h-[44px] resize-none py-2"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <div className="flex gap-2">
              {model && onModelChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        'h-[44px] w-[44px] border-2 transition-all',
                        model === 'qwen2.5:0.5b'
                          ? 'border-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                          : model === 'qwen3:0.6b'
                            ? 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                            : model === 'qwen3:8b'
                              ? 'border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                              : 'border-border'
                      )}
                      disabled={isLoading}
                    >
                      <Cpu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
                      <DropdownMenuRadioItem
                        value="qwen2.5:0.5b"
                        className={cn(
                          'cursor-pointer',
                          model === 'qwen2.5:0.5b' &&
                            'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                        )}
                      >
                        <div className="flex flex-col">
                          <span>快速</span>
                          <span className="text-muted-foreground text-xs">qwen2.5:0.5b</span>
                        </div>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="qwen3:0.6b"
                        className={cn(
                          'cursor-pointer',
                          model === 'qwen3:0.6b' &&
                            'relative z-10 bg-blue-500/10 font-medium ring-2 ring-blue-500 ring-offset-1'
                        )}
                      >
                        <div className="flex flex-col">
                          <span>中等</span>
                          <span className="text-muted-foreground text-xs">qwen3:0.6b</span>
                        </div>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="qwen3:8b"
                        className={cn(
                          'cursor-pointer',
                          model === 'qwen3:8b' &&
                            'relative z-10 bg-purple-500/10 font-medium ring-2 ring-purple-500 ring-offset-1'
                        )}
                      >
                        <div className="flex flex-col">
                          <span>慢速</span>
                          <span className="text-muted-foreground text-xs">qwen3:8b</span>
                        </div>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                onClick={isLoading && onStop ? onStop : onSend}
                disabled={isLoading ? false : !prompt.trim()}
                size="icon"
                className="h-[44px] w-[44px]"
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
              className="max-h-[60px] min-h-[44px] resize-none py-2"
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <div className="flex gap-2">
              {model && onModelChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn(
                        'h-[44px] w-[44px] border-2 transition-all',
                        model === 'qwen2.5:0.5b'
                          ? 'border-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                          : model === 'qwen3:0.6b'
                            ? 'border-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                            : model === 'qwen3:8b'
                              ? 'border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                              : 'border-border'
                      )}
                      disabled={isLoading}
                    >
                      <Cpu className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuRadioGroup value={model} onValueChange={onModelChange}>
                      <DropdownMenuRadioItem
                        value="qwen2.5:0.5b"
                        className={cn(
                          'cursor-pointer',
                          model === 'qwen2.5:0.5b' &&
                            'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                        )}
                      >
                        <div className="flex flex-col">
                          <span>快速</span>
                          <span className="text-muted-foreground text-xs">qwen2.5:0.5b</span>
                        </div>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="qwen3:0.6b"
                        className={cn(
                          'cursor-pointer',
                          model === 'qwen3:0.6b' &&
                            'relative z-10 bg-blue-500/10 font-medium ring-2 ring-blue-500 ring-offset-1'
                        )}
                      >
                        <div className="flex flex-col">
                          <span>中等</span>
                          <span className="text-muted-foreground text-xs">qwen3:0.6b</span>
                        </div>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="qwen3:8b"
                        className={cn(
                          'cursor-pointer',
                          model === 'qwen3:8b' &&
                            'relative z-10 bg-purple-500/10 font-medium ring-2 ring-purple-500 ring-offset-1'
                        )}
                      >
                        <div className="flex flex-col">
                          <span>慢速</span>
                          <span className="text-muted-foreground text-xs">qwen3:8b</span>
                        </div>
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                onClick={isLoading && onStop ? onStop : onSend}
                disabled={isLoading ? false : !prompt.trim()}
                size="icon"
                className="h-[44px] w-[44px]"
              >
                {isLoading ? <Square className="h-5 w-5" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'
