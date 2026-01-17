import React from 'react'
import { Home } from 'lucide-react'
import { cn } from '@/lib/helpers'
import type { Room } from '../../../types'

interface RoomNodeProps {
  room: Room
  isSelected: boolean
  onSelect: () => void
  onToggle?: (e: React.MouseEvent) => void
  showAreaName?: boolean
  areaName?: string
  children?: React.ReactNode
}

export const RoomNode: React.FC<RoomNodeProps> = ({
  room,
  isSelected,
  onSelect,
  onToggle,
  showAreaName,
  areaName,
  children,
}) => {
  return (
    <div className={onToggle ? 'ml-4' : undefined}>
      <div
        className={cn(
          'hover:bg-muted flex cursor-pointer items-center rounded px-2 py-1 text-sm',
          isSelected && 'bg-muted'
        )}
        onClick={onSelect}
      >
        {onToggle && (
          <span onClick={onToggle} className="flex items-center">
            <Home className="text-muted-foreground mr-1 h-3.5 w-3.5" />
          </span>
        )}
        {!onToggle && <Home className="text-muted-foreground mr-1 h-3.5 w-3.5" />}
        <span className="flex-grow cursor-pointer truncate">{room.name}</span>
        {showAreaName && areaName && (
          <span className="text-muted-foreground ml-2 text-xs">{areaName}</span>
        )}
      </div>
      {children}
    </div>
  )
}
