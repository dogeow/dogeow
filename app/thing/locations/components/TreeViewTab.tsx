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
        <div className="p-0">
          <LocationTreeSelect
            onSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
            className="rounded-none border-none shadow-none"
            isExpanded={isTreeExpanded}
            onToggleExpand={toggleTreeExpanded}
          />
        </div>
      </div>
    </div>
  )
}
