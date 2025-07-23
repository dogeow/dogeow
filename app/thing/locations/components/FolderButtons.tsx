'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/helpers'
import FolderIcon from '../../components/FolderIcon'

interface FolderButtonsProps {
  onFolderSelect?: (type: string) => void
}

const FolderButtons: React.FC<FolderButtonsProps> = ({ onFolderSelect }) => {
  const [activeFolder, setActiveFolder] = useState<string | null>(null)

  const handleFolderClick = (type: string) => {
    if (activeFolder === type) {
      setActiveFolder(null)
    } else {
      setActiveFolder(type)
    }

    if (onFolderSelect) {
      onFolderSelect(type)
    }
  }

  const folders = [
    { id: 'treeView', label: '树形视图' },
    { id: 'area', label: '区域' },
    { id: 'room', label: '房间' },
    { id: 'spot', label: '具体位置' },
  ]

  return (
    <div className="mb-4 flex items-center justify-center gap-4 p-2">
      {folders.map(folder => (
        <button
          key={folder.id}
          className={cn(
            'flex flex-col items-center justify-center gap-1 rounded-lg p-1 transition-colors',
            activeFolder === folder.id ? 'bg-primary/10' : 'hover:bg-primary/5'
          )}
          onClick={() => handleFolderClick(folder.id)}
        >
          <FolderIcon
            isOpen={activeFolder === folder.id}
            size={24}
            className={cn(activeFolder === folder.id ? 'text-primary' : 'text-muted-foreground')}
          />
          <span className="text-xs font-medium">{folder.label}</span>
        </button>
      ))}
    </div>
  )
}

export default FolderButtons
