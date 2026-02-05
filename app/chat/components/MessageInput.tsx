// 2025-09-24 claude-4-sonnet 优化过本文件代码：「优化代码」

'use client'

import { useMemo, useCallback, useEffect, useRef } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/hooks/useTranslation'
import useChatStore from '@/app/chat/chatStore'
import {
  UnreadMessageIndicator,
  useUnreadMessages,
  useScrollPosition,
} from './UnreadMessageIndicator'

// 导入重构后的组件和hooks
import { ReplyIndicator } from './message-input/ReplyIndicator'
import { MuteStatusAlert } from './message-input/MuteStatusAlert'
import { FilePreview } from './message-input/FilePreview'
import { MentionSuggestions } from './message-input/MentionSuggestions'
import { ActionButtons } from './message-input/ActionButtons'
import { useMessageInput } from '@/app/chat/hooks/message-input/useMessageInput'
import { useMentions } from '@/app/chat/hooks/message-input/useMentions'
import { useFileUpload } from '@/app/chat/hooks/message-input/useFileUpload'
import { useMessageInputHandlers } from '@/app/chat/hooks/message-input/useMessageInputHandlers'
import { MAX_MESSAGE_LENGTH } from '@/app/chat/utils/message-input/constants'
import type { MessageInputProps } from '@/app/chat/types/messageInput'
import type { ChatMessage } from '@/app/chat/types'

export function MessageInput({
  roomId,
  replyingTo,
  onCancelReply,
  className = '',
  sendMessage,
  isConnected,
  scrollContainerRef,
}: MessageInputProps) {
  const { t } = useTranslation()
  const { onlineUsers, muteUntil, muteReason, checkMuteStatus, refreshMuteStatus, messages } =
    useChatStore()
  const inputContainerRef = useRef<HTMLDivElement>(null)

  // 使用自定义hooks管理状态和逻辑
  const {
    message,
    setMessage,
    isSending,
    isEmojiPickerOpen,
    setIsEmojiPickerOpen,
    textareaRef,
    fileInputRef,
    canSend,
    handleInputChange,
    insertEmoji,
    handleSendMessage,
  } = useMessageInput({
    roomId,
    sendMessage,
    isConnected,
    replyingTo,
    onCancelReply,
  })

  // 获取在线用户用于@提及
  const roomUsers = useMemo(() => {
    return onlineUsers[roomId.toString()] || []
  }, [onlineUsers, roomId])

  // 使用提及功能hook
  const {
    showMentions,
    mentionSuggestions,
    selectedMentionIndex,
    checkForMentions,
    insertMention,
    handleMentionNavigation,
  } = useMentions(roomUsers)

  // 使用文件上传hook
  const { uploadedFiles, handleFileUpload, removeFile } = useFileUpload()

  // 未读消息逻辑
  const roomMessages = messages[roomId.toString()] || []
  const { isAtBottom } = useScrollPosition(scrollContainerRef || { current: null })
  const unreadCount = useUnreadMessages(roomMessages, isAtBottom)

  // 处理文件上传按钮点击
  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [fileInputRef])

  const {
    handleFileInputChange,
    handleTextareaChange,
    handleMentionSelect,
    handleKeyDown,
    scrollToBottom,
  } = useMessageInputHandlers({
    roomId,
    message,
    handleInputChange,
    setMessage,
    replyTarget: (replyingTo ?? null) as ChatMessage | null,
    onCancelReply,
    mentionSuggestions,
    selectedMentionIndex,
    showMentions,
    checkForMentions,
    insertMention,
    handleMentionNavigation,
    handleSendMessage,
    sendMessage,
    isConnected,
    checkMuteStatus,
    muteUntil,
    t,
    fileInputRef,
    textareaRef,
    scrollContainerRef,
    handleFileUpload,
    inputContainerRef,
  })

  useEffect(() => {
    refreshMuteStatus()
  }, [refreshMuteStatus, muteUntil])

  return (
    <div
      ref={inputContainerRef}
      className={`bg-background safe-area-inset-bottom relative p-3 sm:p-4 ${className}`}
    >
      {/* 静音状态提示 */}
      {checkMuteStatus() && <MuteStatusAlert muteUntil={muteUntil} muteReason={muteReason} />}

      {/* 回复指示器 */}
      {replyingTo && onCancelReply && (
        <ReplyIndicator replyingTo={replyingTo} onCancel={onCancelReply} />
      )}

      {/* 已上传文件预览 */}
      <FilePreview files={uploadedFiles} onRemove={removeFile} />

      <div className="relative flex gap-3 sm:gap-4">
        <div className="relative min-w-0 flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              replyingTo
                ? t('chat.reply_to', 'Reply to {name}...').replace('{name}', replyingTo.user.name)
                : t('chat.type_message', 'Type a message...')
            }
            disabled={isSending || !isConnected}
            className="max-h-[120px] min-h-[40px] resize-none text-sm"
            rows={1}
            aria-label={t('chat.message_input', 'Message input')}
            aria-describedby="message-help-text"
            aria-invalid={message.length > MAX_MESSAGE_LENGTH}
            maxLength={MAX_MESSAGE_LENGTH}
          />

          {/* @提及建议 */}
          <MentionSuggestions
            suggestions={mentionSuggestions}
            selectedIndex={selectedMentionIndex}
            onSelect={handleMentionSelect}
          />
        </div>

        {/* 操作按钮 */}
        <ActionButtons
          onFileUpload={handleFileUploadClick}
          onSend={handleSendMessage}
          canSend={canSend}
          isSending={isSending}
          isConnected={isConnected}
          isEmojiPickerOpen={isEmojiPickerOpen}
          onEmojiPickerChange={setIsEmojiPickerOpen}
          onEmojiSelect={insertEmoji}
        />
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label={t('chat.file_input', 'File input')}
      />

      {/* 未读消息指示器 */}
      <UnreadMessageIndicator
        unreadCount={unreadCount}
        onScrollToBottom={scrollToBottom}
        className="absolute -top-12 right-0"
      />
    </div>
  )
}
