import React from 'react'
import { Send, Square, Cpu, Sparkles, BookOpen } from 'lucide-react'
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
  chatMode?: 'ai' | 'knowledge'
  onChatModeChange?: (value: 'ai' | 'knowledge') => void
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
    chatMode,
    onChatModeChange,
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
        <div className="flex-none border-t p-2">
          <div className="flex items-end gap-2">
            <Textarea
              value={prompt}
              onChange={event => onPromptChange(event.target.value)}
              placeholder={placeholder || '输入消息...'}
              className="max-h-[80px] min-h-[48px] resize-none py-2.5"
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
                      className="border-border h-12 w-12 border-2 transition-all"
                      disabled={isLoading}
                    >
                      <Cpu
                        className={cn(
                          'h-5 w-5',
                          model === 'qwen2.5:0.5b'
                            ? 'text-primary'
                            : model === 'qwen3:0.6b'
                              ? 'text-blue-500'
                              : model === 'qwen3:8b'
                                ? 'text-purple-500'
                                : ''
                        )}
                      />
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
              {chatMode && onChatModeChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 border-2 transition-all"
                      disabled={isLoading}
                      aria-label={chatMode === 'knowledge' ? '知识库 AI' : '通用 AI'}
                    >
                      {chatMode === 'knowledge' ? (
                        <BookOpen className="h-5 w-5" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuRadioGroup value={chatMode} onValueChange={onChatModeChange}>
                      <DropdownMenuRadioItem
                        value="ai"
                        className={cn(
                          'cursor-pointer',
                          chatMode === 'ai' &&
                            'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>通用 AI</span>
                        </div>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="knowledge"
                        className={cn(
                          'cursor-pointer',
                          chatMode === 'knowledge' &&
                            'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>知识库 AI</span>
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
                className="h-12 w-12"
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
              className="max-h-[80px] min-h-[48px] resize-none py-2.5"
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
                      className="border-border h-12 w-12 border-2 transition-all"
                      disabled={isLoading}
                    >
                      <Cpu
                        className={cn(
                          'h-5 w-5',
                          model === 'qwen2.5:0.5b'
                            ? 'text-primary'
                            : model === 'qwen3:0.6b'
                              ? 'text-blue-500'
                              : model === 'qwen3:8b'
                                ? 'text-purple-500'
                                : ''
                        )}
                      />
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
              {chatMode && onChatModeChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 border-2 transition-all"
                      disabled={isLoading}
                      aria-label={chatMode === 'knowledge' ? '知识库 AI' : '通用 AI'}
                    >
                      {chatMode === 'knowledge' ? (
                        <BookOpen className="h-5 w-5" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuRadioGroup value={chatMode} onValueChange={onChatModeChange}>
                      <DropdownMenuRadioItem
                        value="ai"
                        className={cn(
                          'cursor-pointer',
                          chatMode === 'ai' &&
                            'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>通用 AI</span>
                        </div>
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem
                        value="knowledge"
                        className={cn(
                          'cursor-pointer',
                          chatMode === 'knowledge' &&
                            'bg-primary/10 ring-primary relative z-10 font-medium ring-2 ring-offset-1'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>知识库 AI</span>
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
                className="h-12 w-12"
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
