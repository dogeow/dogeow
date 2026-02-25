import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { toast } from '@/components/ui/use-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { useTranslation } from '@/hooks/useTranslation'
import useChatStore from '@/app/chat/chatStore'
import {
  MAX_MESSAGE_LENGTH,
  MAX_TEXTAREA_HEIGHT,
  TYPING_TIMEOUT,
  DEBOUNCE_DELAY,
} from '@/app/chat/utils/message-input/constants'
import { getDraftKey } from '@/app/chat/utils/message-input/utils'
import type { MessageInputProps } from '@/app/chat/types/messageInput'

export function useMessageInput({
  roomId,
  sendMessage,
  isConnected,
  replyingTo,
  onCancelReply,
}: Pick<
  MessageInputProps,
  'roomId' | 'sendMessage' | 'isConnected' | 'replyingTo' | 'onCancelReply'
>) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const activeRoomIdRef = useRef<number | null>(null)
  const latestMessageRef = useRef('')

  const { currentRoom, checkMuteStatus, muteUntil } = useChatStore()
  const storage = typeof window !== 'undefined' ? window.localStorage : null

  // 防抖消息用于自动保存
  const draftPayload = useMemo(() => ({ roomId, message }), [roomId, message])
  const debouncedDraftPayload = useDebounce(draftPayload, DEBOUNCE_DELAY)

  // 自动调整文本框高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
    }
  }, [])

  // 处理输入指示器
  const handleTypingIndicator = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      // TODO: 通过WebSocket发送输入开始事件
    }

    // 清除现有超时
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // 设置新超时以停止输入指示器
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      // TODO: 通过WebSocket发送输入停止事件
    }, TYPING_TIMEOUT)
  }, [isTyping])

  // 处理消息输入变化
  const handleInputChange = useCallback(
    (value: string) => {
      // 强制字符限制
      if (value.length <= MAX_MESSAGE_LENGTH) {
        setMessage(value)
        adjustTextareaHeight()
        handleTypingIndicator()
      }
    },
    [adjustTextareaHeight, handleTypingIndicator]
  )

  // 插入表情
  const insertEmoji = useCallback(
    (emoji: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.slice(0, start) + emoji + message.slice(end)

      setMessage(newMessage)
      setIsEmojiPickerOpen(false)

      // 重新聚焦并设置光标位置
      setTimeout(() => {
        textarea.focus()
        const newCursorPos = start + emoji.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    },
    [message]
  )

  // 验证消息
  const validateMessage = useCallback(
    (msg: string): string | null => {
      const trimmed = msg.trim()

      if (!trimmed) {
        return t('chat.message_cannot_be_empty', 'Message cannot be empty')
      }

      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        return t('chat.message_too_long', 'Message cannot exceed {count} characters').replace(
          '{count}',
          MAX_MESSAGE_LENGTH.toString()
        )
      }

      // 检查是否只包含空白字符
      if (!trimmed.replace(/\s/g, '')) {
        return t('chat.message_only_whitespace', 'Message cannot contain only whitespace')
      }

      return null
    },
    [t]
  )

  // 清除草稿
  const clearDraft = useCallback(() => {
    if (!storage) return

    const draftKey = getDraftKey(roomId)
    storage.removeItem(draftKey)
  }, [roomId, storage])

  // 发送消息
  const handleSendMessage = useCallback(async () => {
    // 检查用户是否被静音
    const isCurrentlyMuted = checkMuteStatus()
    if (isCurrentlyMuted) {
      const muteMessage = muteUntil
        ? `您在此房间被静音直到 ${new Date(muteUntil).toLocaleString()}`
        : '您在此房间被静音'

      toast.error(muteMessage)
      return
    }

    // 防止重复发送
    if (isSending) {
      console.warn('Message sending already in progress')
      return
    }

    const validationError = validateMessage(message)
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (!isConnected) {
      toast.error(t('chat.not_connected', 'Not connected to chat server'))
      return
    }

    if (!currentRoom) {
      toast.error(t('chat.no_room_selected', 'No room selected'))
      return
    }

    setIsSending(true)

    try {
      let messageToSend = message.trim()

      // 如果回复消息则添加回复前缀
      if (replyingTo) {
        messageToSend = `@${replyingTo.user.name} ${messageToSend}`
      }

      const result = await sendMessage(roomId.toString(), messageToSend)

      if (result.success) {
        setMessage('')
        adjustTextareaHeight()
        clearDraft()

        // 清除回复状态
        if (onCancelReply) {
          onCancelReply()
        }

        // 重新聚焦到输入框
        setTimeout(() => {
          textareaRef.current?.focus()
        }, 100)
      } else {
        toast.error(result.errorMessage ?? t('chat.failed_to_send', 'Failed to send message'))
      }
    } catch (error) {
      console.error('发送消息错误:', error)

      // 根据错误类型提供更具体的错误信息
      let errorMessage = t('chat.failed_to_send', 'Failed to send message')
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = t('chat.network_error', 'Network error. Please check your connection.')
        } else if (error.message.includes('timeout')) {
          errorMessage = t('chat.timeout_error', 'Request timeout. Please try again.')
        }
      }

      toast.error(errorMessage)
    } finally {
      setIsSending(false)
      setIsTyping(false)

      // 清除输入超时
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [
    message,
    validateMessage,
    isSending,
    isConnected,
    currentRoom,
    replyingTo,
    t,
    sendMessage,
    roomId,
    adjustTextareaHeight,
    clearDraft,
    onCancelReply,
    checkMuteStatus,
    muteUntil,
  ])

  // 计算是否可以发送
  const canSend = useMemo(() => {
    const isCurrentlyMuted = checkMuteStatus()
    return message.trim().length > 0 && !isSending && isConnected && !isCurrentlyMuted
  }, [message, isSending, isConnected, checkMuteStatus])

  useEffect(() => {
    latestMessageRef.current = message
  }, [message])

  // 房间切换时保存当前草稿并加载目标房间草稿
  useEffect(() => {
    if (!currentRoom || !storage) return

    const previousRoomId = activeRoomIdRef.current
    if (previousRoomId === roomId) return

    if (previousRoomId !== null) {
      const previousDraftKey = getDraftKey(previousRoomId)
      const previousMessage = latestMessageRef.current

      if (previousMessage.trim()) {
        storage.setItem(previousDraftKey, previousMessage)
      } else {
        storage.removeItem(previousDraftKey)
      }
    }

    activeRoomIdRef.current = roomId

    const draftKey = getDraftKey(roomId)
    const savedDraft = storage.getItem(draftKey)
    setMessage(savedDraft ?? '')
  }, [currentRoom, roomId, storage])

  // 自动保存草稿
  useEffect(() => {
    if (!currentRoom || !storage) return

    const { roomId: draftRoomId, message: draftMessage } = debouncedDraftPayload
    if (activeRoomIdRef.current !== draftRoomId) return

    const draftKey = getDraftKey(draftRoomId)
    if (draftMessage.trim()) {
      storage.setItem(draftKey, draftMessage)
      return
    }

    storage.removeItem(draftKey)
  }, [debouncedDraftPayload, currentRoom, storage])

  // 挂载时和回复时自动聚焦
  useEffect(() => {
    try {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    } catch (error) {
      console.warn('Failed to focus textarea:', error)
    }
  }, [replyingTo])

  // 消息变化时调整高度
  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  // 卸载时清理
  useEffect(() => {
    return () => {
      try {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
      } catch (error) {
        console.warn('Error during cleanup:', error)
      }
    }
  }, [])

  return {
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
    adjustTextareaHeight,
  }
}
