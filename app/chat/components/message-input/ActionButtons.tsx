'use client'

import { Button } from '@/components/ui/button'
import { Send, Loader2, Paperclip } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { EmojiPicker } from './EmojiPicker'

interface ActionButtonsExtendedProps {
  onFileUpload: () => void
  onSend: () => void
  canSend: boolean
  isSending: boolean
  isConnected: boolean
  isEmojiPickerOpen: boolean
  onEmojiPickerChange: (open: boolean) => void
  onEmojiSelect: (emoji: string) => void
}

export function ActionButtons({
  onFileUpload,
  onSend,
  canSend,
  isSending,
  isConnected,
  isEmojiPickerOpen,
  onEmojiPickerChange,
  onEmojiSelect,
}: ActionButtonsExtendedProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-shrink-0 gap-2 sm:gap-3">
      {/* 文件上传按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onFileUpload}
        disabled={isSending || !isConnected}
        className="h-9 w-9 touch-manipulation p-0 sm:h-10 sm:w-10"
        aria-label={t('chat.upload_file', 'Upload file')}
        title={t('chat.upload_file', 'Upload file')}
      >
        <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
      </Button>

      {/* 表情选择器 */}
      <EmojiPicker
        isOpen={isEmojiPickerOpen}
        onOpenChange={onEmojiPickerChange}
        onSelectEmoji={onEmojiSelect}
        disabled={isSending || !isConnected}
      />

      {/* 发送按钮 */}
      <Button
        onClick={onSend}
        disabled={!canSend}
        size="sm"
        className="h-9 touch-manipulation px-2 sm:h-10 sm:px-3"
        aria-label={
          isSending ? t('chat.sending', 'Sending...') : t('chat.send_message', 'Send message')
        }
        title={isSending ? t('chat.sending', 'Sending...') : t('chat.send_message', 'Send message')}
      >
        {isSending ? (
          <Loader2 className="h-3 w-3 animate-spin sm:h-4 sm:w-4" aria-hidden="true" />
        ) : (
          <Send className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  )
}
