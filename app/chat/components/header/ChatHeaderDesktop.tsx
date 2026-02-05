import React, { memo, useCallback } from 'react'
import { ArrowLeft, Settings, Users, Hash, Info, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/hooks/useTranslation'
import type { ChatRoom } from '@/app/chat/types'

interface ChatHeaderDesktopProps {
  room: ChatRoom
  showBackButton: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  onlineCount: number
  onBack?: () => void
  onOpenRoomInfo: () => void
  onOpenNotificationSettings: () => void
}

export const ChatHeaderDesktop = memo<ChatHeaderDesktopProps>(
  ({
    room,
    showBackButton,
    isConnected,
    connectionStatus,
    onlineCount,
    onBack,
    onOpenRoomInfo,
    onOpenNotificationSettings,
  }) => {
    const { t } = useTranslation()

    const renderRoomInfoButton = useCallback(
      () =>
        room.description && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onOpenRoomInfo}>
            <Info className="h-3 w-3" />
          </Button>
        ),
      [room.description, onOpenRoomInfo]
    )

    const renderSettingsMenu = useCallback(
      () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">{t('settings.title', '设置')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('page.chat_settings', '聊天设置')}</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* 通知设置 */}
            <DropdownMenuItem
              onClick={onOpenNotificationSettings}
              className="min-h-11 gap-2 px-3 py-2 md:min-h-9 md:px-2 md:py-1.5"
            >
              <Bell className="mr-2 h-4 w-4" />
              {t('chat.notification_settings', '通知设置')}
            </DropdownMenuItem>

            {/* 房间信息 */}
            <DropdownMenuItem
              onClick={onOpenRoomInfo}
              className="min-h-11 gap-2 px-3 py-2 md:min-h-9 md:px-2 md:py-1.5"
            >
              <Info className="mr-2 h-4 w-4" />
              {t('chat.room_info', '房间信息')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      [t, onOpenNotificationSettings, onOpenRoomInfo]
    )

    return (
      <div className="bg-background hidden items-center justify-between border-b px-4 py-2 md:flex">
        {/* 左侧 - 导航和房间信息 */}
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t('chat.go_back', '返回')}</span>
            </Button>
          )}
        </div>

        {/* 中间 - 房间详情 */}
        <div className="flex flex-1 justify-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3">
              <Hash className="text-muted-foreground h-4 w-4" />
              <h1 className="font-semibold">{room.name}</h1>
              {renderRoomInfoButton()}
              <div className="flex items-center gap-1 text-xs">
                <div
                  className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-muted-foreground">
                  {connectionStatus === 'connected'
                    ? t('chat.connected', '已连接')
                    : t('chat.disconnected', '已断开')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧 - 操作按钮 */}
        <div className="flex items-center gap-2">
          {/* 在线用户数量 */}
          <div className="flex items-center gap-1">
            <Users className="text-muted-foreground h-4 w-4" />
            <Badge variant="secondary" className="text-xs">
              {onlineCount}
            </Badge>
          </div>
          {renderSettingsMenu()}
        </div>
      </div>
    )
  }
)

ChatHeaderDesktop.displayName = 'ChatHeaderDesktop'
