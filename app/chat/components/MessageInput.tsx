// 2025-09-24 claude-4-sonnet 优化过本文件代码：「优化代码」

'use client'

import { useMemo, useCallback } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '@/hooks/useTranslation'
import useChatStore from '@/app/chat/chatStore'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import {
  UnreadMessageIndicator,
  useUnreadMessages,
  useScrollPosition,
} from './UnreadMessageIndicator'

// 导入重构后的组件和hooks
import {
  ReplyIndicator,
  MuteStatusAlert,
  FilePreview,
  MentionSuggestions,
  ActionButtons,
  useMessageInput,
  useMentions,
  useFileUpload,
  MAX_MESSAGE_LENGTH,
  type MessageInputProps,
} from './message-input'

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
  const { onlineUsers, muteUntil, muteReason, checkMuteStatus, messages } = useChatStore()

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

  // 使用语音输入hook
  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    transcript: voiceTranscript,
    startListening,
    stopListening,
  } = useVoiceInput({
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        // 当语音识别完成时，将文本添加到消息输入框
        const newMessage = message ? `${message} ${transcript}` : transcript
        setMessage(newMessage)
      }
    },
    language: 'zh-CN',
    continuous: false,
    interimResults: true,
  })

  // 处理语音输入切换
  const handleVoiceToggle = useCallback(() => {
    if (isVoiceListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isVoiceListening, stopListening, startListening])

  // 未读消息逻辑
  const roomMessages = messages[roomId.toString()] || []
  const { isAtBottom } = useScrollPosition(scrollContainerRef || { current: null })
  const unreadCount = useUnreadMessages(roomMessages, isAtBottom)

  // 处理文件上传按钮点击
  const handleFileUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [fileInputRef])

  // 处理文件输入变化
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      handleFileUpload(files)
      // 清空输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [handleFileUpload, fileInputRef]
  )

  // 处理消息输入变化
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      const cursorPosition = e.target.selectionStart

      handleInputChange(value)
      checkForMentions(value, cursorPosition)
    },
    [handleInputChange, checkForMentions]
  )

  // 处理提及选择
  const handleMentionSelect = useCallback(
    (suggestion: { id: number; name: string; email: string }) => {
      const result = insertMention(suggestion, message, setMessage)
      if (result && textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus()
          textareaRef.current?.setSelectionRange(result.newCursorPos, result.newCursorPos)
        }, 0)
      }
    },
    [insertMention, message, setMessage, textareaRef]
  )

  // 处理键盘快捷键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 处理@提及导航
      if (handleMentionNavigation(e.key)) {
        e.preventDefault()
        return
      }

      // 如果有提及建议且按下Enter或Tab
      if (showMentions && mentionSuggestions.length > 0 && (e.key === 'Enter' || e.key === 'Tab')) {
        e.preventDefault()
        handleMentionSelect(mentionSuggestions[selectedMentionIndex])
        return
      }

      // 按Enter发送消息（不按Shift）
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }

      // 按Escape取消回复
      if (e.key === 'Escape' && replyingTo && onCancelReply) {
        e.preventDefault()
        onCancelReply()
      }
    },
    [
      handleMentionNavigation,
      showMentions,
      mentionSuggestions,
      selectedMentionIndex,
      handleMentionSelect,
      handleSendMessage,
      replyingTo,
      onCancelReply,
    ]
  )

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [scrollContainerRef])

  return (
    <div
      className={`bg-background safe-area-inset-bottom relative border-t p-3 sm:p-4 ${className}`}
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
          isVoiceListening={isVoiceListening}
          isVoiceSupported={isVoiceSupported}
          onVoiceToggle={handleVoiceToggle}
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
