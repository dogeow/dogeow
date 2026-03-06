import React, { memo } from 'react'
import { ArrowLeft, Settings, Users, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/hooks/useTranslation'
import type { ChatRoom } from '@/app/chat/types'

interface ChatHeaderDesktopProps {
  room: ChatRoom
  showBackButton: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected'
  onlineCount: number
  onBack?: () => void
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
    onOpenNotificationSettings,
  }) => {
    const { t } = useTranslation()

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
          <Button variant="ghost" size="icon" onClick={onOpenNotificationSettings}>
            <Settings className="h-4 w-4" />
            <span className="sr-only">{t('chat.notification_settings', '通知设置')}</span>
          </Button>
        </div>
      </div>
    )
  }
)

ChatHeaderDesktop.displayName = 'ChatHeaderDesktop'
