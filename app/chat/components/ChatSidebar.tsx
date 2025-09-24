'use client'

import { UsersIcon, MessageSquareIcon } from 'lucide-react'
import { ChatRoomList, OnlineUsers } from './'
import ConnectionStatusIndicator from './ConnectionStatusIndicator'
import { useTranslation } from '@/hooks/useTranslation'
import type { ConnectionInfo, OfflineState } from '@/hooks/useChatWebSocket'
import type { ChatRoom } from './types'

interface ChatSidebarProps {
  type: 'rooms' | 'users'
  currentRoom?: ChatRoom
  connectionInfo: ConnectionInfo
  offlineState: OfflineState
  onReconnect: () => void
  onRetryMessages: () => void
  onClearQueue: () => void
  onMentionUser?: () => void
  onDirectMessage?: () => void
  onBlockUser?: () => void
  onReportUser?: () => void
}

export default function ChatSidebar({
  type,
  currentRoom,
  connectionInfo,
  offlineState,
  onReconnect,
  onRetryMessages,
  onClearQueue,
  onMentionUser = () => {},
  onDirectMessage = () => {},
  onBlockUser = () => {},
  onReportUser = () => {},
}: ChatSidebarProps) {
  const { t } = useTranslation()

  if (type === 'rooms') {
    return (
      <div className="bg-muted/30 hidden w-80 border-r lg:flex lg:flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold">
              <MessageSquareIcon className="h-5 w-5" />
              {t('chat.chat_rooms', 'Chat Rooms')}
            </h2>
            {/* Connection Status - Desktop - 放在同一行 */}
            <ConnectionStatusIndicator
              connectionInfo={connectionInfo}
              offlineState={offlineState}
              onReconnect={onReconnect}
              onRetryMessages={onRetryMessages}
              onClearQueue={onClearQueue}
              className="relative"
            />
          </div>
        </div>
        {/* Room List Content */}
        <div className="flex-1 overflow-hidden">
          <ChatRoomList showHeader={false} />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted/30 hidden w-80 border-l lg:flex lg:flex-col">
      <div className="border-b p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <UsersIcon className="h-5 w-5" />
          {t('chat.online_users_title', 'Online Users')}
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        {currentRoom ? (
          <OnlineUsers
            roomId={currentRoom.id}
            onMentionUser={onMentionUser}
            onDirectMessage={onDirectMessage}
            onBlockUser={onBlockUser}
            onReportUser={onReportUser}
          />
        ) : (
          <div className="flex items-center justify-center p-4">
            <p className="text-muted-foreground text-center text-sm">
              {t('chat.select_room_to_see_users', 'Select a room to see online users')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
