'use client'

import { useEffect, useState, useMemo } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MessageSquarePlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAiChat } from '@/app/ai/features/chat/hooks/useAiChat'
import { useKnowledgeChat } from '@/app/ai/features/knowledge/hooks/useKnowledgeChat'
import { useKnowledgeIndexStatus } from '@/app/ai/features/knowledge/hooks/useKnowledgeIndexStatus'
import { ChatHeader, ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'
import type { ChatMessage } from '@/app/ai/features/chat/types'

interface AiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
  const [chatMode, setChatMode] = useState<'ai' | 'knowledge'>('ai')
  const [knowledgeInitialMessages, setKnowledgeInitialMessages] = useState<ChatMessage[]>([])
  const [isLoadingKnowledgeInitial, setIsLoadingKnowledgeInitial] = useState(false)

  const aiChat = useAiChat({ open })
  const knowledgeChat = useKnowledgeChat({ open, initialMessages: knowledgeInitialMessages })
  const knowledgeIndexEnabled = open && chatMode === 'knowledge'
  const { updatedAt: knowledgeUpdatedAt } = useKnowledgeIndexStatus(knowledgeIndexEnabled)
  const knowledgeSubtitle = useMemo(() => {
    if (!knowledgeUpdatedAt) return undefined
    try {
      const date = new Date(knowledgeUpdatedAt)
      const now = Date.now()
      const diffMs = now - date.getTime()
      const oneDay = 24 * 60 * 60 * 1000
      const text =
        diffMs >= 0 && diffMs < oneDay
          ? formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
          : format(date, 'M月d日 HH:mm', { locale: zhCN })
      return `更新于 ${text}`
    } catch {
      return undefined
    }
  }, [knowledgeUpdatedAt])

  useEffect(() => {
    if (!open || knowledgeInitialMessages.length > 0 || isLoadingKnowledgeInitial) {
      return
    }

    const loadInitialMessage = async () => {
      setIsLoadingKnowledgeInitial(true)
      try {
        const response = await fetch('/api/knowledge/documents')
        const data = await response.json()

        // 构建更新时间文本
        const updateTimeText = knowledgeSubtitle
          ? `\n\n<small class="text-muted-foreground">${knowledgeSubtitle}</small>`
          : ''

        if (data.success && data.documents && data.documents.length > 0) {
          const welcomeMessage: ChatMessage = {
            role: 'assistant',
            content: `你好！欢迎了解我的知识库。
            
我会基于知识库内容为你解答。

有什么想了解的吗？${updateTimeText}`,
          }

          setKnowledgeInitialMessages([welcomeMessage])
        } else {
          setKnowledgeInitialMessages([
            {
              role: 'assistant',
              content: `你好！欢迎了解我的知识库。

目前知识库中还没有文档。

有什么想了解的吗？${updateTimeText}`,
            },
          ])
        }
      } catch (error) {
        console.error('加载初始消息失败:', error)
        const updateTimeText = knowledgeSubtitle
          ? `\n\n<small class="text-muted-foreground">${knowledgeSubtitle}</small>`
          : ''
        setKnowledgeInitialMessages([
          {
            role: 'assistant',
            content: `你好！欢迎了解我的知识库。有什么想了解的吗？${updateTimeText}`,
          },
        ])
      } finally {
        setIsLoadingKnowledgeInitial(false)
      }
    }

    loadInitialMessage()
  }, [open, knowledgeInitialMessages.length, isLoadingKnowledgeInitial, knowledgeSubtitle])

  // 当更新时间变化时，更新第一条消息
  useEffect(() => {
    if (
      chatMode === 'knowledge' &&
      knowledgeInitialMessages.length > 0 &&
      knowledgeInitialMessages[0]?.role === 'assistant' &&
      knowledgeSubtitle
    ) {
      setKnowledgeInitialMessages(prev => {
        const firstMessage = prev[0]
        if (!firstMessage) return prev

        // 检查是否已经包含更新时间
        const hasUpdateTime = firstMessage.content.includes('更新于')
        const updateTimeText = `\n\n<small class="text-muted-foreground">${knowledgeSubtitle}</small>`

        if (!hasUpdateTime) {
          return [
            {
              ...firstMessage,
              content: firstMessage.content + updateTimeText,
            },
            ...prev.slice(1),
          ]
        } else {
          // 如果已包含，则更新它
          const contentWithoutUpdateTime = firstMessage.content.replace(
            /\n\n<small class="text-muted-foreground">更新于.*?<\/small>/,
            ''
          )
          return [
            {
              ...firstMessage,
              content: contentWithoutUpdateTime + updateTimeText,
            },
            ...prev.slice(1),
          ]
        }
      })
    }
  }, [knowledgeSubtitle, chatMode])

  const activeChat = chatMode === 'knowledge' ? knowledgeChat : aiChat
  const {
    prompt,
    setPrompt,
    messages,
    hasMessages,
    completion,
    isLoading,
    model,
    setModel,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
  } = activeChat

  // 当弹窗关闭时，可以选择保留或清空对话历史
  // 这里选择保留，用户下次打开时继续之前的对话

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !top-1/2 !left-1/2 flex h-[90vh] max-h-[90vh] w-full max-w-4xl !-translate-x-1/2 !-translate-y-1/2 flex-col gap-0 p-0">
        <DialogHeader className="flex-none p-0">
          <ChatHeader
            variant="dialog"
            title={chatMode === 'knowledge' ? '知识库问答' : 'AI 助理'}
            hasMessages={hasMessages}
            isLoading={isLoading}
            onClear={handleClear}
            hideClear
            chatMode={chatMode}
            onChatModeChange={value => setChatMode(value as 'ai' | 'knowledge')}
          />
        </DialogHeader>

        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          completion={completion}
          messagesEndRef={messagesEndRef}
          variant="dialog"
        />

        <div className="relative flex-none p-2">
          {prompt.trim() && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClear}
              disabled={isLoading}
              className="absolute right-4 bottom-full mb-2 h-9 gap-1.5 rounded-full px-3 shadow-md"
            >
              <MessageSquarePlus className="h-4 w-4" />
              新会话
            </Button>
          )}
          <ChatInput
            prompt={prompt}
            onPromptChange={setPrompt}
            onSend={handleSend}
            onStop={stop}
            isLoading={isLoading}
            model={model}
            onModelChange={setModel}
            chatMode={chatMode}
            onChatModeChange={value => setChatMode(value as 'ai' | 'knowledge')}
            variant="dialog"
            placeholder={
              isLoadingKnowledgeInitial && chatMode === 'knowledge'
                ? '正在加载知识库...'
                : chatMode === 'knowledge'
                  ? '与知识库AI对话'
                  : '与通用AI对话'
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
