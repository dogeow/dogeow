'use client'

import { useState } from 'react'
import LocationTreeSelect from '../../components/LocationTreeSelect'
import { LocationType } from '../hooks/useLocationManagement'
import FolderIcon from '../../components/FolderIcon'

interface TreeViewTabProps {
  selectedLocation?: { type: LocationType; id: number }
  onLocationSelect: (type: LocationType, id: number) => void
}

export default function TreeViewTab({ selectedLocation, onLocationSelect }: TreeViewTabProps) {
  const [isTreeExpanded, setIsTreeExpanded] = useState(true)

  const toggleTreeExpanded = () => {
    setIsTreeExpanded(!isTreeExpanded)
  }

  // 适配器函数，忽略 fullPath 参数
  const handleLocationSelect = (type: LocationType, id: number) => {
    onLocationSelect(type, id)
  }

  return (
    <div className="flex flex-col">
      <div className="w-full overflow-hidden rounded-lg border shadow-sm">
        <div className="bg-secondary border-b p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-secondary-foreground text-lg font-medium">位置树形结构</h2>
            <button
              className="hover:bg-accent hover:text-accent-foreground rounded-full p-1.5 transition-colors"
              onClick={toggleTreeExpanded}
              title={isTreeExpanded ? '折叠所有' : '展开所有'}
            >
              <FolderIcon isOpen={isTreeExpanded} size={18} />
            </button>
          </div>
        </div>
        <div className="p-0">
          <LocationTreeSelect
            onSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
            className="rounded-none border-none shadow-none"
            isExpanded={isTreeExpanded}
          />
        </div>
      </div>
    </div>
  )
}
