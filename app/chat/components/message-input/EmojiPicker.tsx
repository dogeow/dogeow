'use client'

import { Button } from '@/components/ui/button'
import { Smile } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTranslation } from '@/hooks/useTranslation'
import { COMMON_EMOJIS } from './constants'
import type { EmojiPickerProps } from './types'

export function EmojiPicker({
  isOpen,
  onOpenChange,
  onSelectEmoji,
  disabled = false,
}: EmojiPickerProps) {
  const { t } = useTranslation()

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
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
              onClick={() => onSelectEmoji(emoji)}
              className="hover:bg-muted touch-manipulation rounded p-2 text-lg focus:outline-none"
              aria-label={`${t('chat.insert_emoji', 'Insert emoji')}: ${emoji}`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
