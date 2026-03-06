'use client'

import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import useSWR from 'swr'
import { MessageSquarePlus, X } from 'lucide-react'
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

const docsFetcher = async (url: string) => {
  const res = await fetch(url)
  return res.json()
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
  const [chatMode, setChatMode] = useState<'ai' | 'knowledge'>('ai')

  const shouldFetchDocs = open && chatMode === 'knowledge'
  const { data: docsData } = useSWR(
    shouldFetchDocs ? '/api/knowledge/documents' : null,
    docsFetcher,
    { revalidateOnFocus: false }
  )

  const knowledgeInitialMessages = useMemo<ChatMessage[]>(() => {
    if (!shouldFetchDocs) return []
    if (!docsData) return []
    const hasDocs = docsData.success && docsData.documents?.length > 0
    return [
      {
        role: 'assistant' as const,
        content: hasDocs
          ? `你好！欢迎了解我的知识库。\n\n我会基于知识库内容为你解答。\n\n有什么想了解的吗？`
          : `你好！欢迎了解我的知识库。\n\n目前知识库中还没有文档。\n\n有什么想了解的吗？`,
      },
    ]
  }, [shouldFetchDocs, docsData])

  const aiChat = useAiChat({ open })
  const knowledgeChat = useKnowledgeChat({ open, initialMessages: knowledgeInitialMessages })
  const knowledgeIndexEnabled = open && chatMode === 'knowledge'
  const { updatedAt: knowledgeUpdatedAt } = useKnowledgeIndexStatus(knowledgeIndexEnabled)
  const knowledgeSubtitle = useMemo(() => {
    if (!knowledgeUpdatedAt) return undefined
    try {
      const date = new Date(knowledgeUpdatedAt)
      const text = formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
      return text.replace(/^大约\s*/, '')
    } catch {
      return undefined
    }
  }, [knowledgeUpdatedAt])

  const [lastKnowledgeSubtitle, setLastKnowledgeSubtitle] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (knowledgeSubtitle !== undefined) {
      queueMicrotask(() => setLastKnowledgeSubtitle(knowledgeSubtitle))
    }
  }, [knowledgeSubtitle])
  const headerSubtitle = knowledgeSubtitle ?? lastKnowledgeSubtitle
  const headerTitle = chatMode === 'knowledge' ? '知识库问答' : 'AI 助理'

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

  const { provider, setProvider, ollamaModels, isLoadingOllamaModels, supportsImages } = aiChat

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
          ollamaModels={ollamaModels}
          isLoadingOllamaModels={isLoadingOllamaModels}
          supportsImages={chatMode === 'ai' ? supportsImages : false}
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
          placeholder={chatMode === 'knowledge' ? '与知识库AI对话' : '与通用AI对话'}
        />
      </div>
    </>
  )

  if (!open) return null

  const panelEl = (
    <div
      className="bg-background fixed inset-x-0 bottom-0 z-[29] flex flex-col overflow-hidden shadow-lg"
      style={{ top: 'var(--app-header-height, 50px)' }}
      role="dialog"
      aria-label={headerTitle}
    >
      <div className="flex flex-none items-center justify-between border-b px-4 py-0">
        <div className="flex-1">
          <ChatHeader
            variant="panel"
            title={headerTitle}
            subtitle={headerSubtitle}
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
