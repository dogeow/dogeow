import React, { memo } from 'react'
import { Hash, Users, Star, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/helpers'
import { useTranslation } from '@/hooks/useTranslation'
import type { ChatRoom } from '@/app/chat/types'

interface RoomListItemProps {
  room: ChatRoom
  isActive: boolean
  isFavorite: boolean
  onSelect: (room: ChatRoom) => void
  onToggleFavorite: (roomId: number, event: React.MouseEvent) => void
  onEdit: (room: ChatRoom, event: React.MouseEvent) => void
  onDelete: (room: ChatRoom, event: React.MouseEvent) => void
}

export const RoomListItem = memo<RoomListItemProps>(
  ({ room, isActive, isFavorite, onSelect, onToggleFavorite, onEdit, onDelete }) => {
    const { t } = useTranslation()

    return (
      <div
        className={cn(
          'group hover:bg-accent/50 w-full cursor-pointer rounded-lg p-3 text-left transition-colors',
          'focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none',
          isActive && 'bg-accent text-accent-foreground'
        )}
        onClick={() => onSelect(room)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(room)
          }
        }}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Hash className="text-muted-foreground h-4 w-4 shrink-0" />
              <span className="truncate font-medium">{room.name}</span>
              {room.description && (
                <span className="text-muted-foreground text-xs">• {room.description}</span>
              )}
              {isFavorite && <Star className="h-3 w-3 fill-current text-yellow-500" />}
            </div>
          </div>

          {/* 人数和房间操作 */}
          <div className="relative flex items-center">
            {/* 操作按钮 - hover 时显示 */}
            <div className="absolute right-full mr-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={e => onToggleFavorite(room.id, e)}
                aria-label={
                  isFavorite
                    ? t('chat.unfavorite_room', 'Unfavorite')
                    : t('chat.favorite_room', 'Favorite')
                }
              >
                <Star
                  className={cn(
                    'h-3 w-3',
                    isFavorite ? 'fill-current text-yellow-500' : 'text-muted-foreground'
                  )}
                />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={e => e.stopPropagation()}
                    aria-label={t('chat.more_actions', 'More')}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={e => onEdit(room, e)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('chat.edit_room', 'Edit Room')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={e => onDelete(room, e)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('chat.delete_room', 'Delete Room')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* 人数 - 始终靠右 */}
            <div className="text-muted-foreground flex items-center gap-1 text-xs">
              <Users className="h-3 w-3" />
              <span>{room.online_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

RoomListItem.displayName = 'RoomListItem'
