import React, { memo, useCallback } from 'react'
import { ArrowLeft, Settings, Users, Hash, Info, Bell, MenuIcon } from 'lucide-react'
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

interface ChatHeaderMobileProps {
  room: ChatRoom
  showBackButton: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  onlineCount: number
  onBack?: () => void
  onOpenRoomList?: () => void
  onOpenUsersList?: () => void
  onOpenRoomInfo: () => void
  onOpenNotificationSettings: () => void
}

export const ChatHeaderMobile = memo<ChatHeaderMobileProps>(
  ({
    room,
    showBackButton,
    isConnected,
    connectionStatus,
    onlineCount,
    onBack,
    onOpenRoomList,
    onOpenUsersList,
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
      <div className="bg-background flex items-center justify-between border-b px-3 py-2 md:hidden">
        {/* 左侧 - 导航和房间信息 */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* 菜单按钮 */}
          {onOpenRoomList && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Menu button clicked')
                }
                onOpenRoomList()
              }}
              className="shrink-0"
            >
              <MenuIcon className="h-4 w-4" />
              <span className="sr-only">{t('chat.open_room_list', 'Open room list')}</span>
            </Button>
          )}

          {/* 返回按钮 */}
          {showBackButton && (
            <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">{t('chat.go_back', '返回')}</span>
            </Button>
          )}

          {/* 房间信息 */}
          <div className="flex min-w-0 items-center gap-1">
            <Hash className="text-muted-foreground h-4 w-4 shrink-0" />
            <div className="flex min-w-0 items-center gap-1">
              <h1 className="truncate font-semibold">{room.name}</h1>
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isConnected
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'animate-pulse bg-yellow-500'
                      : 'bg-red-500'
                }`}
                title={
                  isConnected
                    ? `已连接 (${connectionStatus})`
                    : connectionStatus === 'connecting'
                      ? `连接中... (${connectionStatus})`
                      : `连接断开 (${connectionStatus})`
                }
                onClick={() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 连接状态详情:', {
                      isConnected,
                      connectionStatus,
                      timestamp: new Date().toLocaleTimeString(),
                    })
                  }
                }}
              />
            </div>
            {renderRoomInfoButton()}
          </div>
        </div>

        {/* 右侧 - 操作按钮 */}
        <div className="flex shrink-0 items-center gap-1">
          {/* 合并的用户列表按钮 - 包含在线用户数量和状态 */}
          {onOpenUsersList && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Users list button clicked')
                }
                onOpenUsersList()
              }}
              className="relative"
            >
              <Users className="h-4 w-4" />
              {/* 在线用户数量徽章 */}
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                {onlineCount}
              </Badge>
              <span className="sr-only">{t('chat.open_users_list', 'Open users list')}</span>
            </Button>
          )}

          {/* 设置下拉菜单 */}
          {renderSettingsMenu()}
        </div>
      </div>
    )
  }
)

ChatHeaderMobile.displayName = 'ChatHeaderMobile'
