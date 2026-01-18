'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { useAiChat } from '@/app/ai/features/chat/hooks/useAiChat'
import { useKnowledgeChat } from '@/app/ai/features/knowledge/hooks/useKnowledgeChat'
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

  useEffect(() => {
    if (!open || knowledgeInitialMessages.length > 0 || isLoadingKnowledgeInitial) {
      return
    }

    const loadInitialMessage = async () => {
      setIsLoadingKnowledgeInitial(true)
      try {
        const response = await fetch('/api/knowledge/documents')
        const data = await response.json()

        if (data.success && data.documents && data.documents.length > 0) {
          const docList = data.documents
            .map(
              (doc: { title: string; slug: string }, index: number) => `${index + 1}. ${doc.title}`
            )
            .join('\n')

          const welcomeMessage: ChatMessage = {
            role: 'assistant',
            content: `你好！欢迎了解我的知识库。

我的知识库目前包含 ${data.documents.length} 个文档：

${docList}

你可以随时问我关于这些文档的问题，我会基于知识库内容为你解答。

有什么想了解的吗？`,
          }

          setKnowledgeInitialMessages([welcomeMessage])
        } else {
          setKnowledgeInitialMessages([
            {
              role: 'assistant',
              content: `你好！欢迎了解我的知识库。

目前知识库中还没有文档。

有什么想了解的吗？`,
            },
          ])
        }
      } catch (error) {
        console.error('加载初始消息失败:', error)
        setKnowledgeInitialMessages([
          {
            role: 'assistant',
            content: '你好！欢迎了解我的知识库。有什么想了解的吗？',
          },
        ])
      } finally {
        setIsLoadingKnowledgeInitial(false)
      }
    }

    loadInitialMessage()
  }, [open, knowledgeInitialMessages.length, isLoadingKnowledgeInitial])

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
        <DialogHeader className="p-0">
          <ChatHeader
            variant="dialog"
            title={chatMode === 'knowledge' ? '知识库问答' : 'AI 助理'}
            hasMessages={hasMessages}
            isLoading={isLoading}
            onClear={handleClear}
            hideClear
          />
        </DialogHeader>

        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          completion={completion}
          messagesEndRef={messagesEndRef}
          variant="dialog"
        />

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
      </DialogContent>
    </Dialog>
  )
}
