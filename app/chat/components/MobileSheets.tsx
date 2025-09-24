'use client'

import { UsersIcon, MessageSquareIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChatRoomList, OnlineUsers } from './'
import { useTranslation } from '@/hooks/useTranslation'
import type { ChatRoom } from '../types'

interface MobileSheetsProps {
  isRoomListOpen: boolean
  isUsersListOpen: boolean
  currentRoom?: ChatRoom | null
  onRoomListOpenChange: (open: boolean) => void
  onUsersListOpenChange: (open: boolean) => void
  onMentionUser?: () => void
  onDirectMessage?: () => void
  onBlockUser?: () => void
  onReportUser?: () => void
}

export default function MobileSheets({
  isRoomListOpen,
  isUsersListOpen,
  currentRoom,
  onRoomListOpenChange,
  onUsersListOpenChange,
  onMentionUser = () => {},
  onDirectMessage = () => {},
  onBlockUser = () => {},
  onReportUser = () => {},
}: MobileSheetsProps) {
  const { t } = useTranslation()

  return (
    <div className="lg:hidden">
      {/* 房间列表 Sheet */}
      <Sheet open={isRoomListOpen} onOpenChange={onRoomListOpenChange}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="flex items-center gap-2">
              <MessageSquareIcon className="h-5 w-5" />
              {t('chat.chat_rooms', 'Chat Rooms')}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <ChatRoomList onRoomSelect={() => onRoomListOpenChange(false)} showHeader={false} />
          </div>
        </SheetContent>
      </Sheet>

      {/* 用户列表 Sheet */}
      {currentRoom && (
        <Sheet open={isUsersListOpen} onOpenChange={onUsersListOpenChange}>
          <SheetContent side="right" className="w-80 p-0">
            <SheetHeader className="border-b p-4">
              <SheetTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                {t('chat.online_users_title', 'Online Users')}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              <OnlineUsers
                roomId={currentRoom.id}
                onMentionUser={onMentionUser}
                onDirectMessage={onDirectMessage}
                onBlockUser={onBlockUser}
                onReportUser={onReportUser}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
