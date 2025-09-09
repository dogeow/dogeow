'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, Smile, Paperclip, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import useChatStore from '@/app/chat/chatStore'
import { toast } from '@/components/ui/use-toast'
import { useDebounce } from 'use-debounce'
import Image from 'next/image'
import { useTranslation } from '@/hooks/useTranslation'
import {
  UnreadMessageIndicator,
  useUnreadMessages,
  useScrollPosition,
} from './UnreadMessageIndicator'

interface MessageInputProps {
  roomId: number
  replyingTo?: {
    id: number
    user: { name: string }
    message: string
  } | null
  onCancelReply?: () => void
  className?: string
  sendMessage: (roomId: string, message: string) => Promise<boolean>
  isConnected: boolean
  scrollContainerRef?: React.RefObject<HTMLElement>
}

interface MentionSuggestion {
  id: number
  name: string
  email: string
}

interface UploadedFile {
  file: File
  preview: string
  type: 'image' | 'file'
}

// Constants
const MAX_MESSAGE_LENGTH = 1000
const TYPING_TIMEOUT = 3000 // 3秒
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_MENTION_SUGGESTIONS = 5
const MAX_TEXTAREA_HEIGHT = 120 // 最大高度约5行
const DEBOUNCE_DELAY = 1000

// 表情选择器的常用表情
const COMMON_EMOJIS = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '🙃',
  '😉',
  '😌',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😙',
  '😚',
  '😋',
  '😛',
  '😝',
  '😜',
  '🤪',
  '🤨',
  '🧐',
  '🤓',
  '😎',
  '🤩',
  '🥳',
  '😏',
  '😒',
  '😞',
  '😔',
  '😟',
  '😕',
  '🙁',
  '☹️',
  '😣',
  '😖',
  '😫',
  '😩',
  '🥺',
  '😢',
  '😭',
  '😤',
  '😠',
  '😡',
  '🤬',
  '👍',
  '👎',
  '👌',
  '✌️',
  '🤞',
  '🤟',
  '🤘',
  '👏',
  '🙌',
  '👐',
  '🤝',
  '🙏',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
] as const

// Utility functions
const validateFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE
}

const isImageFile = (file: File): boolean => {
  return ALLOWED_IMAGE_TYPES.includes(file.type)
}

const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file as data URL'))
      }
    }
    reader.onerror = () => reject(new Error('File reading failed'))
    reader.readAsDataURL(file)
  })
}

const getDraftKey = (roomId: number): string => `chat-draft-${roomId}`

const truncateMessage = (message: string, maxLength: number = 50): string => {
  return message.length > maxLength ? `${message.slice(0, maxLength)}...` : message
}

const sanitizeFileName = (fileName: string): string => {
  // 移除潜在的危险字符
  return fileName.replace(/[^\w\s.-]/g, '').trim()
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

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
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mentionListRef = useRef<HTMLDivElement>(null)

  const { currentRoom, onlineUsers, muteUntil, muteReason, checkMuteStatus, messages } =
    useChatStore()

  // 防抖消息用于自动保存
  const [debouncedMessage] = useDebounce(message, DEBOUNCE_DELAY)

  // 未读消息逻辑
  const roomMessages = messages[roomId.toString()] || []
  const { isAtBottom } = useScrollPosition(scrollContainerRef || { current: null })
  const unreadCount = useUnreadMessages(roomMessages, isAtBottom)

  // 获取在线用户用于@提及 - 使用 useMemo 优化性能
  const roomUsers = useMemo(() => {
    return onlineUsers[roomId.toString()] || []
  }, [onlineUsers, roomId])

  // 过滤用户用于@提及建议 - 使用 useMemo 优化性能
  const mentionSuggestions: MentionSuggestion[] = useMemo(() => {
    if (!mentionQuery.trim()) return []

    const query = mentionQuery.toLowerCase()
    return roomUsers
      .filter(
        user => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      )
      .slice(0, MAX_MENTION_SUGGESTIONS)
  }, [roomUsers, mentionQuery])

  // 自动调整文本框高度 - 优化性能
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
    }
  }, [])

  // 处理输入指示器 - 优化性能
  const handleTypingIndicator = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      // TODO: 通过WebSocket发送输入开始事件
      // 这将在后端添加输入指示器时实现
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

  // 检查@提及 - 使用 useCallback 优化性能
  const checkForMentions = useCallback((text: string, cursorPos: number) => {
    const beforeCursor = text.slice(0, cursorPos)
    const mentionMatch = beforeCursor.match(/@(\w*)$/)

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
      setMentionPosition(mentionMatch.index || 0)
      setShowMentions(true)
      setSelectedMentionIndex(0)
    } else {
      setShowMentions(false)
      setMentionQuery('')
    }
  }, [])

  // 处理消息输入变化 - 使用 useCallback 优化性能
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      const cursorPosition = e.target.selectionStart

      // 强制字符限制
      if (value.length <= MAX_MESSAGE_LENGTH) {
        setMessage(value)
        adjustTextareaHeight()

        // 处理输入指示器
        handleTypingIndicator()

        // 检查@提及触发
        checkForMentions(value, cursorPosition)
      }
    },
    [adjustTextareaHeight, handleTypingIndicator, checkForMentions]
  )

  // 将提及插入消息 - 使用 useCallback 优化性能
  const insertMention = useCallback(
    (user: MentionSuggestion) => {
      const beforeMention = message.slice(0, mentionPosition)
      const afterMention = message.slice(mentionPosition + mentionQuery.length + 1) // +1 表示@符号
      const newMessage = `${beforeMention}@${user.name} ${afterMention}`

      setMessage(newMessage)
      setShowMentions(false)
      setMentionQuery('')

      // 重新聚焦到文本框
      setTimeout(() => {
        textareaRef.current?.focus()
        const newCursorPos = beforeMention.length + user.name.length + 2 // +2 表示@和空格
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
      }, 0)
    },
    [message, mentionPosition, mentionQuery]
  )

  // 处理文件上传 - 优化错误处理和性能
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length === 0) return

      // 检查文件数量限制
      const maxFiles = 5
      if (files.length > maxFiles) {
        toast.error(
          t('chat.too_many_files', 'Too many files. Maximum {count} files allowed.').replace(
            '{count}',
            maxFiles.toString()
          )
        )
        return
      }

      const newFiles: UploadedFile[] = []
      const errors: string[] = []

      for (const file of files) {
        // 检查文件大小
        if (!validateFileSize(file)) {
          errors.push(
            t('chat.file_too_large', 'File {name} is too large. Maximum size is {size}.')
              .replace('{name}', sanitizeFileName(file.name))
              .replace('{size}', formatFileSize(MAX_FILE_SIZE))
          )
          continue
        }

        // 检查文件名
        const sanitizedName = sanitizeFileName(file.name)
        if (!sanitizedName) {
          errors.push(
            t('chat.invalid_filename', 'Invalid filename: {name}').replace('{name}', file.name)
          )
          continue
        }

        try {
          if (isImageFile(file)) {
            const preview = await createFilePreview(file)
            newFiles.push({
              file,
              preview,
              type: 'image',
            })
          } else {
            newFiles.push({
              file,
              preview: '',
              type: 'file',
            })
          }
        } catch (error) {
          console.error('Error processing file:', file.name, error)
          errors.push(
            t('chat.file_processing_error', 'Error processing file {name}').replace(
              '{name}',
              sanitizeFileName(file.name)
            )
          )
        }
      }

      // 显示错误信息
      if (errors.length > 0) {
        errors.forEach(error => toast.error(error))
      }

      // 添加成功处理的文件
      if (newFiles.length > 0) {
        setUploadedFiles(prev => {
          const totalFiles = prev.length + newFiles.length
          if (totalFiles > maxFiles) {
            toast.error(
              t(
                'chat.file_limit_reached',
                'File limit reached. Maximum {count} files allowed.'
              ).replace('{count}', maxFiles.toString())
            )
            return prev
          }
          return [...prev, ...newFiles]
        })
      }

      // 清空输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [t]
  )

  // 移除已上传文件 - 使用 useCallback 优化性能
  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 插入表情 - 使用 useCallback 优化性能
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

  // 发送前验证消息 - 使用 useCallback 优化性能
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

  // 发送消息时清除草稿 - 使用 useCallback 优化性能
  const clearDraft = useCallback(() => {
    const draftKey = getDraftKey(roomId)
    localStorage.removeItem(draftKey)
  }, [roomId])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef?.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [scrollContainerRef])

  // 发送消息 - 使用 useCallback 优化性能
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

      // TODO: 处理文件上传
      // 目前我们只发送文本消息
      // 文件上传需要后端API更改以处理multipart/form-data
      if (uploadedFiles.length > 0) {
        toast.info(t('chat.file_upload_coming_soon', 'File upload feature coming soon!'))
        // 在实际实现中，您需要先上传文件，然后在消息中包含文件URL
      }

      console.log('🔥 发送消息调试信息:', {
        messageToSend,
        currentRoom: currentRoom?.id,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
      })

      const success = await sendMessage(roomId.toString(), messageToSend)

      console.log('🔥 发送消息结果:', { success })

      if (success) {
        setMessage('')
        setUploadedFiles([])
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
        toast.error(t('chat.failed_to_send', 'Failed to send message'))
      }
    } catch (error) {
      console.error('🔥 发送消息错误:', error)

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
    uploadedFiles,
    t,
    sendMessage,
    roomId,
    adjustTextareaHeight,
    clearDraft,
    onCancelReply,
    checkMuteStatus,
    muteUntil,
  ])

  // 处理键盘快捷键 - 使用 useCallback 优化性能
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 处理@提及导航
      if (showMentions && mentionSuggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedMentionIndex(prev => (prev < mentionSuggestions.length - 1 ? prev + 1 : 0))
          return
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedMentionIndex(prev => (prev > 0 ? prev - 1 : mentionSuggestions.length - 1))
          return
        }

        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault()
          insertMention(mentionSuggestions[selectedMentionIndex])
          return
        }

        if (e.key === 'Escape') {
          e.preventDefault()
          setShowMentions(false)
          return
        }
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
      showMentions,
      mentionSuggestions,
      selectedMentionIndex,
      insertMention,
      handleSendMessage,
      replyingTo,
      onCancelReply,
    ]
  )

  // 自动保存草稿 - 优化性能
  useEffect(() => {
    if (debouncedMessage && currentRoom) {
      const draftKey = getDraftKey(roomId)
      localStorage.setItem(draftKey, debouncedMessage)
    }
  }, [debouncedMessage, roomId, currentRoom])

  // 挂载时加载草稿 - 优化性能
  useEffect(() => {
    if (currentRoom && !message) {
      const draftKey = getDraftKey(roomId)
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft) {
        setMessage(savedDraft)
      }
    }
  }, [currentRoom, roomId, message])

  // 挂载时和回复时自动聚焦 - 添加错误处理
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

  // 卸载时清理输入超时和草稿 - 添加错误处理
  useEffect(() => {
    return () => {
      try {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }
        // 清理草稿（可选，根据需求决定）
        // clearDraft()
      } catch (error) {
        console.warn('Error during cleanup:', error)
      }
    }
  }, [])

  // 计算是否可以发送 - 使用 useMemo 优化性能
  const canSend = useMemo(() => {
    // 检查静音状态
    const isCurrentlyMuted = checkMuteStatus()

    return (
      (message.trim().length > 0 || uploadedFiles.length > 0) &&
      !isSending &&
      isConnected &&
      !isCurrentlyMuted
    )
  }, [message, uploadedFiles.length, isSending, isConnected, checkMuteStatus])

  return (
    <div
      className={`bg-background safe-area-inset-bottom relative border-t p-3 pb-6 sm:p-4 ${className}`}
    >
      {/* 静音状态提示 */}
      {checkMuteStatus() && (
        <div className="mb-3 rounded border border-yellow-400 bg-yellow-100 px-4 py-3 text-yellow-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">您在此房间被静音</p>
              {muteUntil && (
                <p className="mt-1 text-sm">静音时间：{new Date(muteUntil).toLocaleString()}</p>
              )}
              {muteReason && <p className="mt-1 text-sm">原因：{muteReason}</p>}
            </div>
          </div>
        </div>
      )}

      {/* 回复指示器 */}
      {replyingTo && (
        <div className="bg-muted/50 mb-3 flex items-center justify-between rounded-md p-2 sm:p-3">
          <div className="min-w-0 flex-1 text-sm">
            <span className="text-muted-foreground">Replying to </span>
            <span className="font-medium">{replyingTo.user.name}</span>
            <span className="text-muted-foreground">: </span>
            <span className="text-muted-foreground block truncate">
              {truncateMessage(replyingTo.message)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
            className="ml-2 h-6 w-6 flex-shrink-0 p-0"
            aria-label={t('chat.cancel_reply', 'Cancel reply')}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* 已上传文件预览 */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative flex-shrink-0">
              {file.type === 'image' ? (
                <div className="relative">
                  <Image
                    src={file.preview}
                    alt={file.file.name}
                    width={80}
                    height={80}
                    className="h-16 w-16 rounded-md object-cover sm:h-20 sm:w-20"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 sm:h-6 sm:w-6"
                    aria-label={t('chat.remove_file', 'Remove file')}
                  >
                    <X className="h-2 w-2 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              ) : (
                <div className="bg-muted flex h-16 w-16 flex-col items-center justify-center rounded-md sm:h-20 sm:w-20">
                  <Paperclip className="h-4 w-4 sm:h-6 sm:w-6" />
                  <span className="w-full truncate px-1 text-center text-xs">{file.file.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 sm:h-6 sm:w-6"
                    aria-label={t('chat.remove_file', 'Remove file')}
                  >
                    <X className="h-2 w-2 sm:h-3 sm:w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="relative flex gap-1 sm:gap-2">
        <div className="relative min-w-0 flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              replyingTo
                ? t('chat.reply_to', 'Reply to {name}...').replace('{name}', replyingTo.user.name)
                : t('chat.type_message', 'Type a message...')
            }
            disabled={isSending || !isConnected}
            className="chat-input-mobile max-h-[120px] min-h-[40px] resize-none pr-2 text-sm sm:pr-3"
            rows={1}
            aria-label={t('chat.message_input', 'Message input')}
            aria-describedby="message-help-text"
            aria-invalid={message.length > MAX_MESSAGE_LENGTH}
            maxLength={MAX_MESSAGE_LENGTH}
          />

          {/* @提及建议 */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div
              ref={mentionListRef}
              className="bg-background absolute bottom-full left-0 z-50 mb-1 w-full max-w-xs rounded-md border shadow-lg"
              role="listbox"
              aria-label={t('chat.mention_suggestions', 'Mention suggestions')}
            >
              {mentionSuggestions.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={`hover:bg-muted focus:ring-primary flex w-full items-center gap-2 px-3 py-2 text-left focus:ring-2 focus:outline-none ${
                    index === selectedMentionIndex ? 'bg-muted' : ''
                  }`}
                  role="option"
                  aria-selected={index === selectedMentionIndex}
                  aria-label={`${t('chat.mention_user', 'Mention')} ${user.name}`}
                >
                  <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-muted-foreground text-xs">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* 状态信息 */}
          <div className="mt-1 text-xs">
            <div className="text-muted-foreground" id="message-help-text">
              {!isConnected && (
                <span className="text-destructive" role="status" aria-live="polite">
                  {t('chat.disconnected', 'Disconnected')}
                </span>
              )}
              {isTyping && isConnected && (
                <span className="text-muted-foreground" role="status" aria-live="polite">
                  {t('chat.typing', 'Typing...')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 - 优化移动端按钮大小 */}
        <div className="flex flex-shrink-0 gap-1">
          {/* 文件上传按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !isConnected}
            className="h-9 w-9 touch-manipulation p-0 sm:h-10 sm:w-10"
            aria-label={t('chat.upload_file', 'Upload file')}
            title={t('chat.upload_file', 'Upload file')}
          >
            <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>

          {/* 表情选择器 */}
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSending || !isConnected}
                className="h-9 w-9 touch-manipulation p-0 sm:h-10 sm:w-10"
                aria-label={t('chat.select_emoji', 'Select emoji')}
                title={t('chat.select_emoji', 'Select emoji')}
              >
                <Smile className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-2 sm:w-96"
              role="dialog"
              aria-label={t('chat.emoji_picker', 'Emoji picker')}
            >
              <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
                {COMMON_EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => insertEmoji(emoji)}
                    className="hover:bg-muted focus:ring-primary touch-manipulation rounded p-2 text-lg focus:ring-2 focus:outline-none"
                    aria-label={`${t('chat.insert_emoji', 'Insert emoji')}: ${emoji}`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* 发送按钮 */}
          <Button
            onClick={handleSendMessage}
            disabled={!canSend}
            size="sm"
            className="h-9 touch-manipulation px-2 sm:h-10 sm:px-3"
            aria-label={
              isSending ? t('chat.sending', 'Sending...') : t('chat.send_message', 'Send message')
            }
            title={
              isSending ? t('chat.sending', 'Sending...') : t('chat.send_message', 'Send message')
            }
          >
            {isSending ? (
              <Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" aria-hidden="true" />
            ) : (
              <Send className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
        aria-label={t('chat.file_input', 'File input')}
      />

      {/* 键盘快捷键提示 - 仅在桌面端显示 */}
      <div className="text-muted-foreground mt-2 hidden text-xs lg:block">
        Press <kbd className="bg-muted rounded px-1">Enter</kbd> to send,
        <kbd className="bg-muted ml-1 rounded px-1">Shift+Enter</kbd> for new line
        {replyingTo && (
          <>
            , <kbd className="bg-muted rounded px-1">Esc</kbd> to cancel reply
          </>
        )}
        {showMentions && (
          <>
            , <kbd className="bg-muted rounded px-1">↑↓</kbd> to navigate mentions,
            <kbd className="bg-muted ml-1 rounded px-1">Tab</kbd> to select
          </>
        )}
      </div>

      {/* 未读消息指示器 - 显示在发送按钮上方 */}
      <UnreadMessageIndicator
        unreadCount={unreadCount}
        onScrollToBottom={scrollToBottom}
        className="absolute -top-12 right-0"
      />
    </div>
  )
}
