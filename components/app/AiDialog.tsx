'use client'

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { useAiChat } from '@/app/ai/features/chat/hooks/useAiChat'
import { ChatHeader, ChatMessageList, ChatInput } from '@/app/ai/features/chat/components'

interface AiDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AiDialog({ open, onOpenChange }: AiDialogProps) {
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
  } = useAiChat({ open })

  // 当弹窗关闭时，可以选择保留或清空对话历史
  // 这里选择保留，用户下次打开时继续之前的对话

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!fixed !top-1/2 !left-1/2 flex h-[90vh] max-h-[90vh] w-full max-w-4xl !-translate-x-1/2 !-translate-y-1/2 flex-col gap-0 p-0">
        <DialogHeader className="p-0">
          <ChatHeader
            variant="dialog"
            hasMessages={hasMessages}
            isLoading={isLoading}
            onClear={handleClear}
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
          variant="dialog"
        />
      </DialogContent>
    </Dialog>
  )
}
