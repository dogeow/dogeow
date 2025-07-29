'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, Smile, Paperclip, X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import useChatStore from '@/app/chat/chatStore'
import { toast } from '@/components/ui/use-toast'
import { useDebounce } from 'use-debounce'
import Image from 'next/image'
import { useTranslation } from '@/hooks/useTranslation'

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

const MAX_MESSAGE_LENGTH = 1000
const TYPING_TIMEOUT = 3000 // 3 seconds
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// Common emojis for the emoji picker
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
]

export function MessageInput({
  roomId,
  replyingTo,
  onCancelReply,
  className = '',
  sendMessage,
  isConnected,
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

  const { currentRoom, onlineUsers } = useChatStore()

  // Debounce message for auto-save
  const [debouncedMessage] = useDebounce(message, 1000)

  // Get online users for mentions
  const roomUsers = onlineUsers[roomId.toString()] || []

  // Filter users for mention suggestions
  const mentionSuggestions: MentionSuggestion[] = roomUsers
    .filter(
      user =>
        user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(mentionQuery.toLowerCase())
    )
    .slice(0, 5) // Limit to 5 suggestions

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px` // Max height of ~5 lines
    }
  }, [])

  // Handle message input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart

    // Enforce character limit
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setMessage(value)
      adjustTextareaHeight()

      // Handle typing indicators
      handleTypingIndicator()

      // Check for mention trigger
      checkForMentions(value, cursorPosition)
    }
  }

  // Check for @ mentions
  const checkForMentions = (text: string, cursorPos: number) => {
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
  }

  // Insert mention into message
  const insertMention = (user: MentionSuggestion) => {
    const beforeMention = message.slice(0, mentionPosition)
    const afterMention = message.slice(mentionPosition + mentionQuery.length + 1) // +1 for @
    const newMessage = `${beforeMention}@${user.name} ${afterMention}`

    setMessage(newMessage)
    setShowMentions(false)
    setMentionQuery('')

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus()
      const newCursorPos = beforeMention.length + user.name.length + 2 // +2 for @ and space
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    files.forEach(file => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          t('chat.file_too_large', 'File {name} is too large. Maximum size is 5MB.').replace(
            '{name}',
            file.name
          )
        )
        return
      }

      // Check if it's an image
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)

      if (isImage) {
        const reader = new FileReader()
        reader.onload = e => {
          const preview = e.target?.result as string
          setUploadedFiles(prev => [
            ...prev,
            {
              file,
              preview,
              type: 'image',
            },
          ])
        }
        reader.readAsDataURL(file)
      } else {
        // For non-image files, use a generic icon
        setUploadedFiles(prev => [
          ...prev,
          {
            file,
            preview: '',
            type: 'file',
          },
        ])
      }
    })

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Insert emoji
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newMessage = message.slice(0, start) + emoji + message.slice(end)

    setMessage(newMessage)
    setIsEmojiPickerOpen(false)

    // Focus back and set cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + emoji.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Handle typing indicators
  const handleTypingIndicator = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      // TODO: Send typing start event via WebSocket
      // This would be implemented when typing indicators are added to the backend
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      // TODO: Send typing stop event via WebSocket
    }, TYPING_TIMEOUT)
  }, [isTyping])

  // Validate message before sending
  const validateMessage = (msg: string): string | null => {
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

    return null
  }

  // Send message
  const handleSendMessage = async () => {
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

      // Add reply prefix if replying to a message
      if (replyingTo) {
        messageToSend = `@${replyingTo.user.name} ${messageToSend}`
      }

      // TODO: Handle file uploads
      // For now, we'll just send the text message
      // File upload would require backend API changes to handle multipart/form-data
      if (uploadedFiles.length > 0) {
        toast.info(t('chat.file_upload_coming_soon', 'File upload feature coming soon!'))
        // In a real implementation, you would upload files first, then include file URLs in the message
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

        // Clear reply state
        if (onCancelReply) {
          onCancelReply()
        }

        // Focus back on input
        textareaRef.current?.focus()
      } else {
        toast.error(t('chat.failed_to_send', 'Failed to send message'))
      }
    } catch (error) {
      console.error('🔥 发送消息错误:', error)
      toast.error(t('chat.failed_to_send', 'Failed to send message'))
    } finally {
      setIsSending(false)
      setIsTyping(false)

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention navigation
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

    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }

    // Cancel reply on Escape
    if (e.key === 'Escape' && replyingTo && onCancelReply) {
      e.preventDefault()
      onCancelReply()
    }
  }

  // Auto-save draft
  useEffect(() => {
    if (debouncedMessage && currentRoom) {
      const draftKey = `chat-draft-${roomId}`
      localStorage.setItem(draftKey, debouncedMessage)
    }
  }, [debouncedMessage, roomId, currentRoom])

  // Load draft on mount
  useEffect(() => {
    if (currentRoom) {
      const draftKey = `chat-draft-${roomId}`
      const savedDraft = localStorage.getItem(draftKey)
      if (savedDraft && !message) {
        setMessage(savedDraft)
      }
    }
  }, [currentRoom, roomId, message])

  // Clear draft when message is sent
  const clearDraft = () => {
    const draftKey = `chat-draft-${roomId}`
    localStorage.removeItem(draftKey)
  }

  // Auto-focus on mount and when replying
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [replyingTo])

  // Adjust height on message change
  useEffect(() => {
    adjustTextareaHeight()
  }, [message, adjustTextareaHeight])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const remainingChars = MAX_MESSAGE_LENGTH - message.length
  const isNearLimit = remainingChars < 100
  const canSend =
    (message.trim().length > 0 || uploadedFiles.length > 0) && !isSending && isConnected

  return (
    <div className={`bg-background border-t p-4 ${className}`}>
      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-muted/50 mb-3 flex items-center justify-between rounded-md p-2">
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">Replying to </span>
            <span className="font-medium">{replyingTo.user.name}</span>
            <span className="text-muted-foreground">: </span>
            <span className="text-muted-foreground">
              {replyingTo.message.length > 50
                ? `${replyingTo.message.slice(0, 50)}...`
                : replyingTo.message}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancelReply} className="h-6 w-6 p-0">
            ✕
          </Button>
        </div>
      )}

      {/* Uploaded files preview */}
      {uploadedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {uploadedFiles.map((file, index) => (
            <div key={index} className="relative">
              {file.type === 'image' ? (
                <div className="relative">
                  <Image
                    src={file.preview}
                    alt={file.file.name}
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="bg-muted flex h-20 w-20 flex-col items-center justify-center rounded-md">
                  <Paperclip className="h-6 w-6" />
                  <span className="w-full truncate px-1 text-center text-xs">{file.file.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="relative flex gap-2">
        <div className="relative flex-1">
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
            className="max-h-[120px] min-h-[40px] resize-none"
            rows={1}
          />

          {/* Mention suggestions */}
          {showMentions && mentionSuggestions.length > 0 && (
            <div
              ref={mentionListRef}
              className="bg-background absolute bottom-full left-0 z-50 mb-1 w-full max-w-xs rounded-md border shadow-lg"
            >
              {mentionSuggestions.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={`hover:bg-muted flex w-full items-center gap-2 px-3 py-2 text-left ${
                    index === selectedMentionIndex ? 'bg-muted' : ''
                  }`}
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

          {/* Character count */}
          <div className="mt-1 flex justify-between text-xs">
            <div className="text-muted-foreground">
              {!isConnected && (
                <span className="text-destructive">{t('chat.disconnected', 'Disconnected')}</span>
              )}
              {isTyping && isConnected && (
                <span className="text-muted-foreground">{t('chat.typing', 'Typing...')}</span>
              )}
            </div>
            <div className={`${isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
              {remainingChars} {t('chat.characters_remaining', 'characters remaining')}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1">
          {/* File upload button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !isConnected}
            className="h-10 w-10 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Emoji picker */}
          <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isSending || !isConnected}
                className="h-10 w-10 p-0"
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-2">
              <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto">
                {COMMON_EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => insertEmoji(emoji)}
                    className="hover:bg-muted rounded p-2 text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Send button */}
          <Button onClick={handleSendMessage} disabled={!canSend} size="sm" className="h-10 px-3">
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Keyboard shortcuts hint */}
      <div className="text-muted-foreground mt-2 text-xs">
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
    </div>
  )
}
