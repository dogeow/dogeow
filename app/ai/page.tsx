'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useCompletion } from 'ai/react'
import { Sparkles, Send, Square, Trash2, Bot, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/novel-editor/ui/scroll-area'
import MarkdownPreview from '@/components/novel-editor/markdown-preview'

const AI_SYSTEM_PROMPT = '你是一个有用的AI助理，请用中文回答问题，必要时给出步骤和示例。'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export default function AiPage() {
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
    scrollToBottom()
  }, [messages, completion, scrollToBottom])

  const displayMessages = messages.filter(m => m.role !== 'system')
  const hasMessages = displayMessages.length > 0 || (isLoading && completion)

  return (
    <main className="flex h-screen flex-col">
      {/* 顶部标题栏 */}
      <div className="bg-background border-b px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">AI 助理</h1>
            <p className="text-muted-foreground text-xs">
              {isLoading
                ? '生成中...'
                : hasMessages
                  ? `${displayMessages.length} 条消息`
                  : '开始对话'}
            </p>
          </div>
          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isLoading}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 消息区域 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-4xl px-4 py-6">
            {hasMessages ? (
              <div className="space-y-6">
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
                        className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {/* 头像 */}
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            isUser
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>

                        {/* 消息气泡 */}
                        <div
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isUser ? 'bg-muted text-foreground' : 'bg-muted text-foreground'
                            }`}
                          >
                            <MarkdownPreview
                              content={msg.content}
                              className={isUser ? '[&_*]:text-foreground' : '[&_*]:text-foreground'}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                {/* 显示正在生成的回复 */}
                {isLoading && completion && (
                  <div className="flex gap-3">
                    <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex max-w-[75%] flex-col items-start">
                      <div className="bg-muted text-foreground rounded-2xl px-4 py-2.5">
                        <MarkdownPreview content={completion} />
                      </div>
                      <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
                        <span>正在输入...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 滚动锚点 */}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
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
      <div className="bg-background border-t p-4">
        <div className="mx-auto max-w-4xl">
          <div className="flex gap-2">
            <Textarea
              value={prompt}
              onChange={event => setPrompt(event.target.value)}
              placeholder="输入消息..."
              className="min-h-[60px] resize-none"
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
          <p className="text-muted-foreground mt-2 text-center text-xs">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>
    </main>
  )
}
