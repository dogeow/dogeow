'use client'

import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { truncateMessage } from '@/app/chat/utils/message-input/utils'
import type { ReplyIndicatorProps } from '@/app/chat/types/messageInput'

export function ReplyIndicator({ replyingTo, onCancel }: ReplyIndicatorProps) {
  const { t } = useTranslation()

  return (
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
        onClick={onCancel}
        className="ml-2 h-6 w-6 flex-shrink-0 p-0"
        aria-label={t('chat.cancel_reply', 'Cancel reply')}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
