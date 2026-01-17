'use client'

import { useMemo } from 'react'
import { useKnowledgeChat } from '@/app/ai/features/knowledge/hooks/useKnowledgeChat'
import { KnowledgeChatHeader } from '@/app/ai/features/knowledge/components'
import { ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'

export default function KnowledgePage() {
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
  } = useKnowledgeChat()

  const subtitle = useMemo(() => {
    if (isLoading) return '搜索知识库并生成回答...'
    if (hasMessages) return `${displayMessages.length} 条消息`
    return '基于知识库回答问题'
  }, [isLoading, hasMessages, displayMessages.length])

  return (
    <main className="flex h-screen flex-col">
      <KnowledgeChatHeader
        variant="page"
        subtitle={subtitle}
        hasMessages={hasMessages}
        isLoading={isLoading}
        useContext={useContext}
        onUseContextChange={setUseContext}
        searchMethod={searchMethod}
        onSearchMethodChange={setSearchMethod}
        onClear={handleClear}
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
        placeholder={useContext ? '基于知识库提问...' : '提问...'}
      />
    </main>
  )
}
