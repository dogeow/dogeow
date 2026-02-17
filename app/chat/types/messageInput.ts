export interface MessageInputProps {
  roomId: number
  replyingTo?: {
    id: number
    user: { name: string }
    message: string
  } | null
  onCancelReply?: () => void
  className?: string
  sendMessage: (
    roomId: string,
    message: string
  ) => Promise<{ success: true } | { success: false; errorMessage?: string }>
  isConnected: boolean
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

export interface MentionSuggestion {
  id: number
  name: string
  email: string
}

export interface UploadedFile {
  file: File
  preview: string
  type: 'image' | 'file'
}

export interface ReplyIndicatorProps {
  replyingTo: {
    id: number
    user: { name: string }
    message: string
  }
  onCancel: () => void
}

export interface MuteStatusAlertProps {
  muteUntil?: string | null
  muteReason?: string | null
}

export interface FilePreviewProps {
  files: UploadedFile[]
  onRemove: (index: number) => void
}

export interface MentionSuggestionsProps {
  suggestions: MentionSuggestion[]
  selectedIndex: number
  onSelect: (suggestion: MentionSuggestion) => void
}

export interface EmojiPickerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSelectEmoji: (emoji: string) => void
  disabled?: boolean
}

export interface ActionButtonsProps {
  onFileUpload: () => void
  onEmojiClick: () => void
  onSend: () => void
  canSend: boolean
  isSending: boolean
  isConnected: boolean
}
