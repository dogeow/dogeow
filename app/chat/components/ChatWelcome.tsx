'use client'

import { MessageSquareIcon, MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'

interface ChatWelcomeProps {
  onOpenRoomList?: () => void
}

export default function ChatWelcome({ onOpenRoomList }: ChatWelcomeProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <MessageSquareIcon className="text-muted-foreground/50 mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-medium">{t('chat.welcome', 'Welcome to Chat')}</h3>
        <p className="text-muted-foreground mt-2">
          {t('chat.select_room', 'Select a room to start chatting or create a new one')}
        </p>
        {onOpenRoomList && (
          <Button className="mt-4" onClick={onOpenRoomList}>
            <MenuIcon className="mr-2 h-4 w-4" />
            {t('chat.open_room_list', 'Open room list')}
          </Button>
        )}
      </div>
    </div>
  )
}
