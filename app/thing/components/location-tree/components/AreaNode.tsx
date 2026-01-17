import React from 'react'
import { cn } from '@/lib/helpers'
import FolderIcon from '../../FolderIcon'
import { ICON_SIZE } from '../constants'
import type { LocationTreeResponse } from '../../../types'

interface AreaNodeProps {
  area: LocationTreeResponse['areas'][0]
  isSelected: boolean
  isExpanded: boolean
  onSelect: () => void
  onToggle: (e: React.MouseEvent) => void
  children: React.ReactNode
}

export const AreaNode: React.FC<AreaNodeProps> = ({
  area,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  children,
}) => {
  return (
    <div>
      <div
        className={cn(
          'hover:bg-muted flex cursor-pointer items-center rounded px-2 py-1 text-sm',
          isSelected && 'bg-muted'
        )}
        onClick={onSelect}
      >
        <span onClick={onToggle} className="flex items-center">
          <FolderIcon isOpen={isExpanded} size={ICON_SIZE} className="mr-1" />
        </span>
        <span className="flex-grow cursor-pointer truncate">{area.name}</span>
      </div>
      {children}
    </div>
  )
}
