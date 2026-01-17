'use client'

import { useMemo } from 'react'
import { useAiChat } from '@/app/ai/features/chat/hooks/useAiChat'
import { ChatHeader, ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'

export default function AiPage() {
  const {
    prompt,
    setPrompt,
    messages,
    displayMessages,
    hasMessages,
    completion,
    isLoading,
    stop,
    handleSend,
    handleClear,
    messagesEndRef,
  } = useAiChat()

  const subtitle = useMemo(() => {
    if (isLoading) return '生成中...'
    if (hasMessages) return `${displayMessages.length} 条消息`
    return '开始对话'
  }, [isLoading, hasMessages, displayMessages.length])

  return (
    <main className="flex h-screen flex-col">
      <ChatHeader
        variant="page"
        subtitle={subtitle}
        hasMessages={hasMessages}
        isLoading={isLoading}
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
      />
    </main>
  )
}
