/**
 * 桌面端聊天头部组件
 */
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Settings, Users, Hash, Info } from 'lucide-react'
import type { ChatRoom } from '../../types'

interface DesktopHeaderProps {
  room: ChatRoom
  onBack?: () => void
  showBackButton?: boolean
  onlineCount: number
  isConnected: boolean
  connectionStatus: string
  onOpenRoomInfo: () => void
  onOpenSettings: () => void
}

export function DesktopHeader({
  room,
  onBack,
  showBackButton,
  onlineCount,
  isConnected,
  connectionStatus,
  onOpenRoomInfo,
  onOpenSettings,
}: DesktopHeaderProps) {
  return (
    <div className="bg-background hidden items-center justify-between border-b p-4 md:flex">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-1 justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <Hash className="text-muted-foreground h-4 w-4" />
            <h1 className="font-semibold">{room.name}</h1>
            {room.description && (
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onOpenRoomInfo}>
                <Info className="h-3 w-3" />
              </Button>
            )}
            <div className="flex items-center gap-1 text-xs">
              <div
                className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
              />
              <span className="text-muted-foreground">{connectionStatus}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Users className="text-muted-foreground h-4 w-4" />
          <Badge variant="secondary" className="text-xs">
            {onlineCount}
          </Badge>
        </div>

        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
