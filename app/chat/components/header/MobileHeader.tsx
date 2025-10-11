/**
 * 移动端聊天头部组件
 */
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Settings, Users, Hash, Info, MenuIcon } from 'lucide-react'
import type { ChatRoom } from '../../types'

interface MobileHeaderProps {
  room: ChatRoom
  onBack?: () => void
  showBackButton?: boolean
  onlineCount: number
  isConnected: boolean
  connectionStatus: string
  onOpenRoomList?: () => void
  onOpenUsersList?: () => void
  onOpenRoomInfo: () => void
  onOpenSettings: () => void
}

export function MobileHeader({
  room,
  onBack,
  showBackButton,
  onlineCount,
  isConnected,
  connectionStatus,
  onOpenRoomList,
  onOpenUsersList,
  onOpenRoomInfo,
  onOpenSettings,
}: MobileHeaderProps) {
  return (
    <div className="bg-background flex items-center justify-between border-b p-4 md:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onOpenRoomList && (
          <Button variant="ghost" size="icon" onClick={onOpenRoomList} className="shrink-0">
            <MenuIcon className="h-4 w-4" />
          </Button>
        )}

        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex min-w-0 items-center gap-1">
          <Hash className="text-muted-foreground h-4 w-4 shrink-0" />
          <h1 className="truncate font-semibold">{room.name}</h1>
          {room.description && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={onOpenRoomInfo}
            >
              <Info className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {onOpenUsersList && (
          <Button variant="ghost" size="icon" onClick={onOpenUsersList} className="relative">
            <Users className="h-4 w-4" />
            <Badge
              variant="secondary"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
            >
              {onlineCount}
            </Badge>
          </Button>
        )}

        <div
          className={`h-2 w-2 rounded-full ${
            isConnected
              ? 'bg-green-500'
              : connectionStatus === 'connecting'
                ? 'animate-pulse bg-yellow-500'
                : 'bg-red-500'
          }`}
        />

        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
