'use client'

import React, { useState } from 'react'
import { Search } from 'lucide-react'
import FolderIcon from '../../components/FolderIcon'

interface LocationsHeaderProps {
  onSearch?: (query: string) => void
}

const LocationsHeader: React.FC<LocationsHeaderProps> = () => {
  const [activeFolder, setActiveFolder] = useState<'area' | 'room' | null>(null)

  const handleFolderClick = (type: 'area' | 'room') => {
    if (activeFolder === type) {
      setActiveFolder(null)
    } else {
      setActiveFolder(type)
    }
  }

  return (
    <div className="position-tree-header mb-4 flex items-center gap-2 border-b p-2">
      <h1 className="mr-4 text-xl font-semibold">位置树形结构</h1>

      <div className="flex items-center gap-4">
        <div
          className="flex cursor-pointer flex-col items-center"
          onClick={() => handleFolderClick('area')}
        >
          <FolderIcon isOpen={activeFolder === 'area'} size={24} className="mb-1" />
          <span className="text-xs">区域</span>
        </div>

        <div
          className="flex cursor-pointer flex-col items-center"
          onClick={() => handleFolderClick('room')}
        >
          <FolderIcon isOpen={activeFolder === 'room'} size={24} className="mb-1" />
          <span className="text-xs">房间</span>
        </div>

        <div className="flex-grow"></div>

        <div className="search-button">
          <Search className="text-muted-foreground hover:text-primary h-5 w-5 cursor-pointer" />
        </div>
      </div>
    </div>
  )
}

export default LocationsHeader
