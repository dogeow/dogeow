'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MessageSquarePlus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

  // 只在 open 且 chatMode === 'knowledge' 且未加载过时加载初始消息，避免死循环
  useEffect(() => {
    if (
      !open ||
      chatMode !== 'knowledge' ||
      isLoadingKnowledgeInitial ||
      knowledgeInitialMessages.length > 0
    ) {
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
            content: `你好！欢迎了解我的知识库。\n\n我会基于知识库内容为你解答。\n\n有什么想了解的吗？${updateTimeText}`,
          }
          setKnowledgeInitialMessages([welcomeMessage])
        } else {
          setKnowledgeInitialMessages([
            {
              role: 'assistant',
              content: `你好！欢迎了解我的知识库。\n\n目前知识库中还没有文档。\n\n有什么想了解的吗？${updateTimeText}`,
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
  }, [
    open,
    chatMode,
    isLoadingKnowledgeInitial,
    knowledgeSubtitle,
    knowledgeInitialMessages.length,
  ])

  // 切换 tab 时重置 loading 状态，切换到 knowledge 时清空初始消息（防止死循环）
  useEffect(() => {
    if (chatMode !== 'knowledge') {
      setIsLoadingKnowledgeInitial(false)
      setKnowledgeInitialMessages([])
    }
  }, [chatMode])

  // 当更新时间变化时，更新第一条消息（使用 ref 跟踪避免无限循环）
  const knowledgeMessagesRef = useRef(knowledgeInitialMessages)
  const prevKnowledgeSubtitleRef = useRef(knowledgeSubtitle)

  // 同步 ref
  if (knowledgeInitialMessages !== knowledgeMessagesRef.current) {
    knowledgeMessagesRef.current = knowledgeInitialMessages
  }
  if (knowledgeSubtitle !== prevKnowledgeSubtitleRef.current) {
    prevKnowledgeSubtitleRef.current = knowledgeSubtitle
  }

  useEffect(() => {
    if (
      chatMode === 'knowledge' &&
      knowledgeInitialMessages.length > 0 &&
      knowledgeInitialMessages[0]?.role === 'assistant' &&
      knowledgeSubtitle
    ) {
      // 使用 ref 检查内容是否真的变化了
      const firstMessage = knowledgeMessagesRef.current[0]
      if (!firstMessage) return

      const hasUpdateTime = firstMessage.content.includes('更新于')
      const updateTimeText = `\n\n<small class="text-muted-foreground">${knowledgeSubtitle}</small>`

      // 只有当内容确实需要更新时才更新状态
      const contentWithoutUpdateTime = firstMessage.content.replace(
        /\n\n<small class="text-muted-foreground">更新于.*?<\/small>/,
        ''
      )
      const newContent = contentWithoutUpdateTime + updateTimeText

      if (newContent !== firstMessage.content) {
        setKnowledgeInitialMessages(prev => [
          {
            ...prev[0],
            content: newContent,
          },
          ...prev.slice(1),
        ])
      }
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

  // provider 和 setProvider 始终从 aiChat 获取（知识库模式不支持 provider）
  const { provider, setProvider } = aiChat

  // 当弹窗关闭时，可以选择保留或清空对话历史
  // 这里选择保留，用户下次打开时继续之前的对话

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !top-1/2 !left-1/2 flex h-[90vh] max-h-[90vh] w-full max-w-4xl !-translate-x-1/2 !-translate-y-1/2 flex-col gap-0 p-0">
        <DialogHeader className="flex-none p-0">
          <DialogTitle className="sr-only">
            {chatMode === 'knowledge' ? '知识库问答' : 'AI 助理'}
          </DialogTitle>
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
          {(chatMode === 'knowledge' ? knowledgeChat.hasMessages : aiChat.hasMessages) && (
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
            provider={provider}
            onProviderChange={setProvider}
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
