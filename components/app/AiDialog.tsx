'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { MessageSquarePlus, X } from 'lucide-react'
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
  /** panel: 固定面板，从 header 下方填满屏幕，header 仍可点击；dialog: 居中弹窗 */
  variant?: 'dialog' | 'panel'
}

export function AiDialog({ open, onOpenChange, variant = 'dialog' }: AiDialogProps) {
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

  useEffect(() => {
    if (chatMode !== 'knowledge') {
      setIsLoadingKnowledgeInitial(false)
      setKnowledgeInitialMessages([])
    }
  }, [chatMode])

  const knowledgeMessagesRef = useRef(knowledgeInitialMessages)
  const prevKnowledgeSubtitleRef = useRef(knowledgeSubtitle)

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
      const firstMessage = knowledgeMessagesRef.current[0]
      if (!firstMessage) return

      const updateTimeText = `\n\n<small class="text-muted-foreground">${knowledgeSubtitle}</small>`

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

  const { provider, setProvider } = aiChat

  const chatBody = (
    <>
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
          images={chatMode === 'ai' ? aiChat.images : []}
          isUploadingImages={chatMode === 'ai' ? aiChat.isUploadingImages : false}
          onImageSelect={chatMode === 'ai' ? aiChat.handleImageSelect : undefined}
          onRemoveImage={chatMode === 'ai' ? aiChat.removeImage : undefined}
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
    </>
  )

  if (variant === 'panel') {
    if (!open) return null

    const panelEl = (
      <div
        className="bg-background fixed inset-x-0 bottom-0 z-[29] flex flex-col overflow-hidden shadow-lg"
        style={{ top: 'var(--app-header-height, 50px)' }}
        role="dialog"
        aria-label={chatMode === 'knowledge' ? '知识库问答' : 'AI 助理'}
      >
        <div className="flex flex-none items-center justify-between border-b px-4 py-0">
          <div className="flex-1">
            <ChatHeader
              variant="panel"
              title={chatMode === 'knowledge' ? '知识库问答' : 'AI 助理'}
              hasMessages={hasMessages}
              isLoading={isLoading}
              onClear={handleClear}
              hideClear
              chatMode={chatMode}
              onChatModeChange={value => setChatMode(value as 'ai' | 'knowledge')}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onOpenChange(false)}
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {chatBody}
      </div>
    )

    return createPortal(panelEl, document.body)
  }

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
        {chatBody}
      </DialogContent>
    </Dialog>
  )
}
