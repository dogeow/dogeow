'use client'

import { useMemo, useEffect, useState } from 'react'
import { useKnowledgeChat } from '@/app/ai/features/knowledge/hooks/useKnowledgeChat'
import { KnowledgeChatHeader } from '@/app/ai/features/knowledge/components'
import { ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'
import type { ChatMessage } from '@/app/ai/features/chat/types'

export default function AboutPage() {
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([])
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)

  // 加载初始欢迎消息
  useEffect(() => {
    const loadInitialMessage = async () => {
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

          setInitialMessages([welcomeMessage])
        } else {
          // 如果没有文档，显示默认欢迎消息
          setInitialMessages([
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
        // 即使出错也设置一个默认消息
        setInitialMessages([
          {
            role: 'assistant',
            content: '你好！欢迎了解我的知识库。有什么想了解的吗？',
          },
        ])
      } finally {
        setIsLoadingInitial(false)
      }
    }

    loadInitialMessage()
  }, [])

  const {
    prompt,
    setPrompt,
    messages,
    displayMessages,
    hasMessages,
    completion,
    isLoading,
    useContext,
    setUseContext,
    searchMethod,
    setSearchMethod,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
  } = useKnowledgeChat({ initialMessages })

  // 如果正在加载初始消息，显示加载状态
  if (isLoadingInitial) {
    return (
      <main className="flex h-screen flex-col">
        <div className="flex flex-1 items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex h-screen flex-col">
      <KnowledgeChatHeader
        variant="page"
        title="关于"
        hasMessages={hasMessages}
        isLoading={isLoading}
        useContext={useContext}
        onUseContextChange={setUseContext}
        searchMethod={searchMethod}
        onSearchMethodChange={setSearchMethod}
        onClear={handleClear}
        hideUseContext
        hideAiLink
        hideSearchMethod
        hideTitle
      />

      <ChatMessageList
        messages={messages}
        isLoading={isLoading}
        completion={completion}
        messagesEndRef={messagesEndRef}
        variant="page"
      />

      <ChatInput
        prompt={prompt}
        onPromptChange={setPrompt}
        onSend={handleSend}
        onStop={stop}
        isLoading={isLoading}
        variant="page"
        showHint
        placeholder="输入问题开始与我对话"
      />
    </main>
  )
}
