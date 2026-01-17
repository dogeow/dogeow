'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useLocations } from '../services/api'
import { cn } from '@/lib/helpers'
import { LocationSelection, LocationTreeResponse, Room } from '../types'
import { useTranslation } from '@/hooks/useTranslation'
import { SearchBar } from './location-tree/components/SearchBar'
import { LocationTreeContent } from './location-tree/components/LocationTreeContent'
import { useExpandedState } from './location-tree/hooks/useExpandedState'
import { filterSearchResults } from './location-tree/utils/searchUtils'
import { buildPath } from './location-tree/utils/pathUtils'
import { TREE_HEIGHT } from './location-tree/constants'

interface LocationTreeSelectProps {
  onSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => void
  selectedLocation?: LocationSelection
  className?: string
  filterType?: 'area' | 'room' | null
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const LocationTreeSelect: React.FC<LocationTreeSelectProps> = ({
  onSelect,
  selectedLocation,
  className,
  filterType = null,
  isExpanded = true,
  onToggleExpand,
}) => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  // 获取位置数据
  const { data: locationData } = useLocations()

  // 优化数据提取，避免不必要的解构
  const locationInfo = useMemo(() => {
    const data = locationData as LocationTreeResponse
    if (!data) return { areas: [], rooms: [], spots: [] }

    return {
      areas: data.areas || [],
      rooms: data.rooms || [],
      spots: data.spots || [],
    }
  }, [locationData])

  const { areas, rooms, spots } = locationInfo

  // 管理展开/折叠状态
  const { expandedAreas, expandedRooms, toggleArea, toggleRoom } = useExpandedState(
    isExpanded,
    selectedLocation,
    areas,
    rooms,
    spots
  )

  // 优化搜索过滤逻辑
  const searchResults = useMemo(
    () =>
      filterSearchResults(
        areas,
        rooms,
        spots,
        searchTerm,
        filterType,
        expandedAreas,
        expandedRooms,
        isExpanded
      ),
    [areas, rooms, spots, searchTerm, filterType, expandedAreas, expandedRooms, isExpanded]
  )

  // 优化展开/折叠处理
  const handleToggleArea = useCallback(
    (e: React.MouseEvent, areaId: number) => {
      e.stopPropagation()
      toggleArea(areaId)
    },
    [toggleArea]
  )

  const handleToggleRoom = useCallback(
    (e: React.MouseEvent, roomId: number) => {
      e.stopPropagation()
      toggleRoom(roomId)
    },
    [toggleRoom]
  )

  // 优化路径构建
  const buildLocationPath = useCallback(
    (type: 'area' | 'room' | 'spot', id: number): string => {
      return buildPath(type, id, areas, rooms, spots, t)
    },
    [areas, rooms, spots, t]
  )

  // 优化选择处理
  const handleSelect = useCallback(
    (type: 'area' | 'room' | 'spot', id: number) => {
      onSelect(type, id, buildLocationPath(type, id))
    },
    [onSelect, buildLocationPath]
  )

  // 获取房间的区域信息（用于显示）
  const getRoomAreaName = useCallback(
    (room: Room): string => {
      const area = areas.find(a => a.id === room.area_id)
      return area?.name || t('location.unknown_area')
    },
    [areas, t]
  )

  // 检查是否选中
  const isSelected = useCallback(
    (type: 'area' | 'room' | 'spot', id: number): boolean => {
      return selectedLocation?.type === type && selectedLocation.id === id
    },
    [selectedLocation]
  )

  return (
    <div className={cn('bg-card rounded-md border p-2', className)}>
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />

      <div className={cn('overflow-y-auto pr-1', TREE_HEIGHT)}>
        <LocationTreeContent
          filteredAreas={searchResults.filteredAreas}
          filteredRooms={searchResults.filteredRooms}
          filteredSpots={searchResults.filteredSpots}
          visibleAreaIds={searchResults.visibleAreaIds}
          visibleRoomIds={searchResults.visibleRoomIds}
          rooms={rooms}
          spots={spots}
          filterType={filterType}
          searchTerm={searchTerm}
          selectedLocation={selectedLocation}
          expandedAreas={expandedAreas}
          expandedRooms={expandedRooms}
          onSelect={handleSelect}
          onToggleArea={handleToggleArea}
          onToggleRoom={handleToggleRoom}
          getRoomAreaName={getRoomAreaName}
          isSelected={isSelected}
        />
      </div>
    </div>
  )
}

export default LocationTreeSelect
