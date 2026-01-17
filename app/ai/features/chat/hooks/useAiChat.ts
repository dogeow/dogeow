'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { AI_SYSTEM_PROMPT, type ChatMessage } from '../types'

interface UseAiChatOptions {
  open?: boolean
}

interface UseAiChatReturn {
  prompt: string
  setPrompt: (value: string) => void
  messages: ChatMessage[]
  displayMessages: ChatMessage[]
  hasMessages: boolean
  completion: string | undefined
  isLoading: boolean
  stop: () => void
  handleSend: () => void
  handleClear: () => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const { open } = options

  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [completion, setCompletion] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 过滤掉 system 消息用于显示
  const displayMessages = messages.filter(m => m.role !== 'system')
  const hasMessages = displayMessages.length > 0

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, completion, isLoading])

  // 停止生成
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setCompletion('')
  }, [])

  // 清除对话
  const handleClear = useCallback(() => {
    stop()
    setMessages([])
    setCompletion('')
    setPrompt('')
  }, [stop])

  // 发送消息
  const handleSend = useCallback(async () => {
    if (!prompt.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim(),
    }

    // 添加用户消息到历史
    const newMessages: ChatMessage[] = [...messages, userMessage]
    setMessages(newMessages)
    setPrompt('')
    setIsLoading(true)
    setCompletion('')

    // 创建 abort controller
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // 准备消息列表（确保有 system 消息）
      const chatMessages: ChatMessage[] = newMessages.some(m => m.role === 'system')
        ? newMessages
        : [
            {
              role: 'system',
              content: AI_SYSTEM_PROMPT,
            },
            ...newMessages,
          ]

      // 调用 API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useChat: true,
          messages: chatMessages,
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // 读取流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue

          // 处理内容块: 0:"content"
          if (line.startsWith('0:')) {
            try {
              const content = JSON.parse(line.slice(2))
              accumulatedContent += content
              setCompletion(accumulatedContent)
            } catch (e) {
              console.warn('Failed to parse content chunk:', line)
            }
          }

          // 处理完成标记: d:{metadata}
          if (line.startsWith('d:')) {
            try {
              const metadata = JSON.parse(line.slice(2))
              // 流完成，将 accumulatedContent 添加到消息中
              if (accumulatedContent) {
                setMessages(prev => [
                  ...prev,
                  {
                    role: 'assistant',
                    content: accumulatedContent,
                  },
                ])
              }
              setCompletion('')
              setIsLoading(false)
              return
            } catch (e) {
              console.warn('Failed to parse metadata:', line)
            }
          }
        }
      }

      // 处理剩余缓冲区
      if (buffer.trim()) {
        if (buffer.startsWith('0:')) {
          try {
            const content = JSON.parse(buffer.slice(2))
            accumulatedContent += content
            setCompletion(accumulatedContent)
          } catch (e) {
            console.warn('Failed to parse remaining buffer:', buffer)
          }
        }
      }

      // 流结束，添加 assistant 消息
      if (accumulatedContent) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: accumulatedContent,
          },
        ])
      }
      setCompletion('')
      setIsLoading(false)
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 用户主动停止，不显示错误
        return
      }

      console.error('AI chat error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message.includes('fetch')
            ? 'AI服务暂时不可用，请确保Ollama服务正在运行'
            : error.message
          : 'AI服务发生未知错误'

      // 添加错误消息
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `错误: ${errorMessage}`,
        },
      ])
      setCompletion('')
      setIsLoading(false)
    } finally {
      abortControllerRef.current = null
    }
  }, [prompt, messages, isLoading])

  return {
    prompt,
    setPrompt,
    messages,
    displayMessages,
    hasMessages,
    completion: completion || undefined,
    isLoading,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
  }
}

// 默认导出作为备用
export default useAiChat
