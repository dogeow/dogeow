"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Folder, FolderOpen, FolderClosed, Search } from "lucide-react"
import { cn } from '@/lib/helpers'
import FolderIcon from '../../components/FolderIcon'

interface LocationsHeaderProps {
  onSearch?: (query: string) => void
}

const LocationsHeader: React.FC<LocationsHeaderProps> = ({ onSearch }) => {
  const [activeFolder, setActiveFolder] = useState<'area' | 'room' | null>(null)

  // 点击文件夹图标时的处理函数
  const handleFolderClick = (type: 'area' | 'room') => {
    if (activeFolder === type) {
      setActiveFolder(null)
    } else {
      setActiveFolder(type)
    }
  }

  return (
    <div className="position-tree-header flex items-center gap-2 p-2 border-b mb-4">
      <h1 className="text-xl font-semibold mr-4">位置树形结构</h1>
      
      <div className="flex items-center gap-4">
        <div 
          className="flex flex-col items-center cursor-pointer" 
          onClick={() => handleFolderClick('area')}
        >
          <FolderIcon 
            isOpen={activeFolder === 'area'} 
            size={24}
            className="mb-1"
          />
          <span className="text-xs">区域</span>
        </div>
        
        <div 
          className="flex flex-col items-center cursor-pointer" 
          onClick={() => handleFolderClick('room')}
        >
          <FolderIcon 
            isOpen={activeFolder === 'room'} 
            size={24}
            className="mb-1"
          />
          <span className="text-xs">房间</span>
        </div>
        
        <div className="flex-grow"></div>
        
        <div className="search-button">
          <Search className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary" />
        </div>
      </div>
    </div>
  )
}

export default LocationsHeader 