'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useCompletion } from 'ai/react'
import { Sparkles, Send, Square, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/novel-editor/ui/scroll-area'
import MarkdownPreview from '@/components/novel-editor/markdown-preview'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const AI_SYSTEM_PROMPT = '你是一个有用的AI助理，请用中文回答问题，必要时给出步骤和示例。'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: AI_SYSTEM_PROMPT },
  ])
  const messagesRef = useRef<ChatMessage[]>(messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 同步 messages 到 ref
  const updateMessages = useCallback((newMessages: ChatMessage[]) => {
    messagesRef.current = newMessages
    setMessages(newMessages)
  }, [])

  const { completion, complete, isLoading, stop, setCompletion } = useCompletion({
    api: '/api/generate',
    onResponse: response => {
      if (response.status === 429) {
        toast.error('今日请求已达上限，请稍后再试')
      }
    },
    onError: error => {
      console.error('AI API Error:', error)
      toast.error(error.message)
    },
    onFinish: (prompt, completion) => {
      // 保存助手回复到对话历史
      const currentMessages = messagesRef.current
      updateMessages([...currentMessages, { role: 'assistant', content: completion }])
    },
  })

  const handleSend = useCallback(async () => {
    const text = prompt.trim()
    if (!text) {
      toast.error('请输入内容')
      return
    }

    // 添加用户消息到历史
    const currentMessages = messagesRef.current
    const newMessages: ChatMessage[] = [...currentMessages, { role: 'user', content: text }]
    updateMessages(newMessages)

    // 清空输入框
    setPrompt('')
    setCompletion('') // 清空之前的 completion

    try {
      // 使用 chat 模式，发送完整对话历史
      await complete(text, {
        body: {
          useChat: true,
          messages: newMessages,
        },
      })
    } catch {
      // 交由 onError 处理
      // 如果失败，移除刚添加的用户消息
      updateMessages(currentMessages)
    }
  }, [complete, prompt, updateMessages, setCompletion])

  const handleClear = useCallback(() => {
    setPrompt('')
    setCompletion('')
    // 重置对话历史，只保留 system 消息
    const resetMessages = [{ role: 'system' as const, content: AI_SYSTEM_PROMPT }]
    updateMessages(resetMessages)
  }, [setCompletion, updateMessages])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 当消息或 completion 更新时滚动到底部
  useEffect(() => {
    if (open) {
      scrollToBottom()
    }
  }, [messages, completion, scrollToBottom, open])

  // 当弹窗关闭时，可以选择保留或清空对话历史
  // 这里选择保留，用户下次打开时继续之前的对话

  const displayMessages = messages.filter(m => m.role !== 'system')
  const hasMessages = displayMessages.length > 0 || (isLoading && completion)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !top-1/2 !left-1/2 flex h-[90vh] max-h-[90vh] w-full max-w-4xl !-translate-x-1/2 !-translate-y-1/2 flex-col gap-0 p-0">
        <DialogHeader className="!flex h-12 !flex-row items-center justify-between border-b px-4 py-0">
          <div className="m-0 flex min-w-0 flex-1 items-center gap-3">
            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="h-4 w-4" />
            </div>
            <DialogTitle className="truncate text-base leading-none">AI 助理</DialogTitle>
          </div>
          <div className="flex shrink-0 items-center gap-1 pr-10">
            {hasMessages && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClear}
                disabled={isLoading}
                className="text-muted-foreground h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 消息区域 */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-3 py-2 sm:px-4">
              {hasMessages ? (
                <div className="space-y-2">
                  {/* 显示历史消息 */}
                  {displayMessages
                    .filter((msg, idx, arr) => {
                      // 如果正在生成且最后一条是 assistant，不显示最后一条（用 completion 代替）
                      if (isLoading && idx === arr.length - 1 && msg.role === 'assistant') {
                        return false
                      }
                      return true
                    })
                    .map((msg, idx) => {
                      const isUser = msg.role === 'user'
                      return (
                        <div
                          key={idx}
                          className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {/* 消息气泡 */}
                          <div
                            className={`flex w-full flex-col ${isUser ? 'items-end' : 'items-start'} ${isUser ? 'max-w-[80%]' : 'max-w-full'} min-w-0`}
                          >
                            <div
                              className={`rounded-xl px-3 py-2 break-words ${isUser ? '' : 'w-full'} ${
                                isUser
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <div
                                className={
                                  isUser
                                    ? '[&_.prose]:prose-invert [&_.prose_*]:!text-primary-foreground [&_.prose]:my-0 [&_.prose_p]:!my-0 [&_.prose_p]:!mt-0 [&_.prose_p]:!mb-0'
                                    : '[&_.prose]:prose-neutral [&_.prose_*]:!text-foreground [&_.prose]:my-0 [&_.prose_p]:!my-0 [&_.prose_p]:!mt-0 [&_.prose_p]:!mb-0'
                                }
                              >
                                <MarkdownPreview content={msg.content} />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                  {/* 显示正在生成的回复 */}
                  {isLoading && (
                    <div className="flex w-full justify-start">
                      <div className="flex w-full min-w-0 flex-col items-start">
                        {completion ? (
                          <>
                            <div className="bg-muted text-foreground w-full rounded-xl px-3 py-2 break-words">
                              <div className="[&_.prose]:prose-neutral [&_.prose_*]:!text-foreground [&_.prose]:my-0 [&_.prose_p]:!my-0 [&_.prose_p]:!mt-0 [&_.prose_p]:!mb-0">
                                <MarkdownPreview content={completion} />
                              </div>
                            </div>
                            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                              <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
                              <span>正在输入...</span>
                            </div>
                          </>
                        ) : (
                          <div className="bg-muted text-foreground w-full rounded-xl px-3 py-2 break-words">
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1">
                                <div
                                  className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                                  style={{ animationDelay: '0ms' }}
                                />
                                <div
                                  className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                                  style={{ animationDelay: '150ms' }}
                                />
                                <div
                                  className="bg-muted-foreground/50 h-2 w-2 animate-bounce rounded-full"
                                  style={{ animationDelay: '300ms' }}
                                />
                              </div>
                              <span className="text-muted-foreground text-sm">正在思考...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 滚动锚点 */}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex h-[400px] items-center justify-center">
                  <div className="text-center">
                    <div className="bg-muted text-muted-foreground mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <p className="text-muted-foreground text-sm">输入问题开始与 AI 对话</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* 输入区域（固定在底部） */}
        <div className="border-t p-2">
          <div className="flex items-end gap-2">
            <Textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              placeholder="输入消息..."
              className="[field-sizing:fixed] h-[60px] max-h-[60px] min-h-[60px] resize-none overflow-y-auto"
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
                  event.preventDefault()
                  if (prompt.trim() && !isLoading) {
                    handleSend()
                  }
                }
              }}
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSend}
                disabled={isLoading || !prompt.trim()}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                {isLoading ? (
                  <Square className="h-5 w-5" onClick={stop} />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
