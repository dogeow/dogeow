import React from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/helpers'
import type { Spot } from '../../../types'

interface SpotNodeProps {
  spot: Spot
  isSelected: boolean
  onSelect: () => void
}

export const SpotNode: React.FC<SpotNodeProps> = ({ spot, isSelected, onSelect }) => {
  return (
    <div
      className={cn(
        'hover:bg-muted ml-4 flex cursor-pointer items-center rounded px-2 py-1 text-sm',
        isSelected && 'bg-muted'
      )}
      onClick={onSelect}
    >
      <MapPin className="text-muted-foreground mr-1 h-3.5 w-3.5" />
      <span className="truncate">{spot.name}</span>
    </div>
  )
}
