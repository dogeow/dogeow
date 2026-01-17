import React, { memo } from 'react'
import { Folder } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { TREE_CONSTANTS } from '../constants'

interface RootFolderItemProps {
  isSelected: boolean
  onClick: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const RootFolderItem = memo<RootFolderItemProps>(({ isSelected, onClick, onKeyDown }) => {
  return (
    <div
      className={cn(
        'hover:bg-muted/50 focus:ring-primary/30 flex cursor-pointer items-center rounded-md px-2 py-2 transition-colors focus:ring-1 focus:outline-none',
        isSelected && 'bg-muted/70 font-medium'
      )}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="treeitem"
      aria-selected={isSelected}
      aria-label="根目录"
    >
      <Folder className={cn(TREE_CONSTANTS.ICON_SIZE, 'mr-2 text-yellow-500')} />
      <span>根目录</span>
    </div>
  )
})

RootFolderItem.displayName = 'RootFolderItem'
