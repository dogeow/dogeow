'use client'

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin, Home, Search } from 'lucide-react'
import { useLocations } from '../services/api'
import { cn } from '@/lib/helpers'
import { LocationSelection, LocationTreeResponse, Room, Spot } from '../types'
import FolderIcon from './FolderIcon'

interface LocationTreeSelectProps {
  onSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => void
  selectedLocation?: LocationSelection
  className?: string
  filterType?: 'area' | 'room' | null
  isExpanded?: boolean
}

// 提取常量
const ICON_SIZE = 14

// 优化的搜索匹配函数
const matchesSearch = (text: string, searchTerm: string): boolean => {
  return text.toLowerCase().includes(searchTerm.toLowerCase())
}

const LocationTreeSelect: React.FC<LocationTreeSelectProps> = ({
  onSelect,
  selectedLocation,
  className,
  filterType = null,
  isExpanded = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set())
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set())

  // 使用 ref 来避免不必要的 effect 触发
  const prevIsExpandedRef = useRef(isExpanded)
  const prevSelectionRef = useRef<LocationSelection>(selectedLocation)

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

  // 优化初始展开逻辑
  useEffect(() => {
    if (!areas.length || !rooms.length) return

    const isExpandedChanged = prevIsExpandedRef.current !== isExpanded
    prevIsExpandedRef.current = isExpanded

    if (isExpandedChanged) {
      if (isExpanded) {
        setExpandedAreas(new Set(areas.map(area => area.id)))
        setExpandedRooms(new Set(rooms.map(room => room.id)))
      } else {
        setExpandedAreas(new Set())
        setExpandedRooms(new Set())
      }
    }
  }, [isExpanded, areas, rooms])

  // 优化选中位置的展开逻辑
  useEffect(() => {
    if (!selectedLocation || !areas.length || !rooms.length || !spots.length) return

    const prevSelection = prevSelectionRef.current
    const hasSelectionChanged =
      !prevSelection ||
      prevSelection.type !== selectedLocation.type ||
      prevSelection.id !== selectedLocation.id

    if (!hasSelectionChanged) return

    prevSelectionRef.current = selectedLocation

    setExpandedAreas(prev => {
      const newSet = new Set(prev)
      let changed = false

      if (selectedLocation.type === 'room' || selectedLocation.type === 'spot') {
        const targetRoom =
          selectedLocation.type === 'room'
            ? rooms.find(r => r.id === selectedLocation.id)
            : rooms.find(r => r.id === spots.find(s => s.id === selectedLocation.id)?.room_id)

        if (targetRoom?.area_id && !newSet.has(targetRoom.area_id)) {
          newSet.add(targetRoom.area_id)
          changed = true
        }
      }

      return changed ? newSet : prev
    })

    if (selectedLocation.type === 'spot') {
      const spot = spots.find(s => s.id === selectedLocation.id)
      if (spot?.room_id) {
        setExpandedRooms(prev => {
          const newSet = new Set(prev)
          if (!newSet.has(spot.room_id)) {
            newSet.add(spot.room_id)
            return newSet
          }
          return prev
        })
      }
    }
  }, [selectedLocation, areas, rooms, spots])

  // 优化搜索过滤逻辑
  const searchResults = useMemo(() => {
    if (!searchTerm) {
      return {
        filteredAreas: filterType === 'room' ? [] : areas,
        filteredRooms: rooms,
        filteredSpots: filterType === 'area' ? [] : spots,
        visibleAreaIds: Array.from(expandedAreas),
        visibleRoomIds: Array.from(expandedRooms),
      }
    }

    const visibleAreaIds = new Set<number>()
    const visibleRoomIds = new Set<number>()

    // 构建区域到房间、房间到位置的映射
    const areaRoomsMap = new Map<number, Room[]>()
    const roomSpotsMap = new Map<number, Spot[]>()

    rooms.forEach(room => {
      if (!areaRoomsMap.has(room.area_id)) {
        areaRoomsMap.set(room.area_id, [])
      }
      areaRoomsMap.get(room.area_id)!.push(room)
    })

    spots.forEach(spot => {
      if (!roomSpotsMap.has(spot.room_id)) {
        roomSpotsMap.set(spot.room_id, [])
      }
      roomSpotsMap.get(spot.room_id)!.push(spot)
    })

    // 查找匹配的区域
    const matchingAreas = areas.filter(area => matchesSearch(area.name, searchTerm))
    matchingAreas.forEach(area => visibleAreaIds.add(area.id))

    // 查找匹配的房间及其所属区域
    const matchingRooms = rooms.filter(room => matchesSearch(room.name, searchTerm))
    matchingRooms.forEach(room => {
      visibleAreaIds.add(room.area_id)
      visibleRoomIds.add(room.id)
    })

    // 查找匹配的位置及其所属房间和区域
    const matchingSpots = spots.filter(spot => matchesSearch(spot.name, searchTerm))
    matchingSpots.forEach(spot => {
      const room = rooms.find(r => r.id === spot.room_id)
      if (room) {
        visibleAreaIds.add(room.area_id)
        visibleRoomIds.add(room.id)
      }
    })

    // 为包含匹配子项的父项添加可见性
    areas.forEach(area => {
      const areaRooms = areaRoomsMap.get(area.id) || []
      const hasMatchingChild = areaRooms.some(room => {
        if (matchesSearch(room.name, searchTerm)) return true
        const roomSpots = roomSpotsMap.get(room.id) || []
        return roomSpots.some(spot => matchesSearch(spot.name, searchTerm))
      })

      if (hasMatchingChild) {
        visibleAreaIds.add(area.id)
        areaRooms.forEach(room => {
          const roomSpots = roomSpotsMap.get(room.id) || []
          if (
            matchesSearch(room.name, searchTerm) ||
            roomSpots.some(spot => matchesSearch(spot.name, searchTerm))
          ) {
            visibleRoomIds.add(room.id)
          }
        })
      }
    })

    return {
      filteredAreas: filterType === 'room' ? [] : areas.filter(area => visibleAreaIds.has(area.id)),
      filteredRooms: rooms.filter(room => visibleRoomIds.has(room.id)),
      filteredSpots:
        filterType === 'area'
          ? []
          : spots.filter(spot => {
              const room = rooms.find(r => r.id === spot.room_id)
              return room && visibleAreaIds.has(room.area_id) && visibleRoomIds.has(room.id)
            }),
      visibleAreaIds: Array.from(visibleAreaIds),
      visibleRoomIds: Array.from(visibleRoomIds),
    }
  }, [areas, rooms, spots, searchTerm, filterType, expandedAreas, expandedRooms])

  // 优化展开/折叠处理
  const toggleArea = useCallback((e: React.MouseEvent, areaId: number) => {
    e.stopPropagation()
    setExpandedAreas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(areaId)) {
        newSet.delete(areaId)
      } else {
        newSet.add(areaId)
      }
      return newSet
    })
  }, [])

  const toggleRoom = useCallback((e: React.MouseEvent, roomId: number) => {
    e.stopPropagation()
    setExpandedRooms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roomId)) {
        newSet.delete(roomId)
      } else {
        newSet.add(roomId)
      }
      return newSet
    })
  }, [])

  // 优化路径构建
  const buildPath = useCallback(
    (type: 'area' | 'room' | 'spot', id: number): string => {
      const pathParts: string[] = []

      if (type === 'area') {
        const area = areas.find(a => a.id === id)
        return area?.name || '未知区域'
      }

      if (type === 'room') {
        const room = rooms.find(r => r.id === id)
        if (!room) return '未知房间'

        const area = areas.find(a => a.id === room.area_id)
        pathParts.push(area?.name || '未知区域', room.name)
        return pathParts.join(' / ')
      }

      // spot
      const spot = spots.find(s => s.id === id)
      if (!spot) return '未知位置'

      const room = rooms.find(r => r.id === spot.room_id)
      if (!room) {
        pathParts.push('未知房间', spot.name)
      } else {
        const area = areas.find(a => a.id === room.area_id)
        pathParts.push(area?.name || '未知区域', room.name, spot.name)
      }

      return pathParts.join(' / ')
    },
    [areas, rooms, spots]
  )

  // 优化选择处理
  const handleSelect = useCallback(
    (type: 'area' | 'room' | 'spot', id: number) => {
      onSelect(type, id, buildPath(type, id))
    },
    [onSelect, buildPath]
  )

  // 获取房间的区域信息（用于显示）
  const getRoomAreaName = useCallback(
    (room: Room): string => {
      const area = areas.find(a => a.id === room.area_id)
      return area?.name || '未知区域'
    },
    [areas]
  )

  // 检查是否选中
  const isSelected = useCallback(
    (type: 'area' | 'room' | 'spot', id: number): boolean => {
      return selectedLocation?.type === type && selectedLocation.id === id
    },
    [selectedLocation]
  )

  const hasNoResults =
    searchResults.filteredAreas.length === 0 &&
    searchResults.filteredRooms.length === 0 &&
    searchResults.filteredSpots.length === 0

  return (
    <div className={cn('bg-card rounded-md border p-2', className)}>
      {/* 搜索框 */}
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 transform" />
          <Input
            placeholder="搜索位置..."
            className="h-8 pl-7 text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 树形结构 */}
      <div className="h-[300px] overflow-y-auto pr-1">
        {hasNoResults ? (
          <div className="text-muted-foreground py-2 text-center text-sm">
            {searchTerm ? '没有匹配的位置' : '没有可用的位置'}
          </div>
        ) : (
          <>
            {/* 区域列表 */}
            {searchResults.filteredAreas.map(area => (
              <div key={`area-${area.id}`}>
                <div
                  className={cn(
                    'hover:bg-muted flex cursor-pointer items-center rounded px-2 py-1 text-sm',
                    isSelected('area', area.id) && 'bg-muted'
                  )}
                  onClick={() => handleSelect('area', area.id)}
                >
                  <span onClick={e => toggleArea(e, area.id)} className="flex items-center">
                    <FolderIcon
                      isOpen={searchResults.visibleAreaIds.includes(area.id)}
                      size={ICON_SIZE}
                      className="mr-1"
                    />
                  </span>
                  <span className="flex-grow cursor-pointer truncate">{area.name}</span>
                </div>

                {/* 区域下的房间 */}
                {searchResults.visibleAreaIds.includes(area.id) &&
                  rooms
                    .filter(
                      room =>
                        room.area_id === area.id && searchResults.visibleRoomIds.includes(room.id)
                    )
                    .map(room => (
                      <div key={`room-${room.id}`} className="ml-4">
                        <div
                          className={cn(
                            'hover:bg-muted flex cursor-pointer items-center rounded px-2 py-1 text-sm',
                            isSelected('room', room.id) && 'bg-muted'
                          )}
                          onClick={() => handleSelect('room', room.id)}
                        >
                          <span onClick={e => toggleRoom(e, room.id)} className="flex items-center">
                            <Home className="text-muted-foreground mr-1 h-3.5 w-3.5" />
                          </span>
                          <span className="flex-grow cursor-pointer truncate">{room.name}</span>
                        </div>

                        {/* 房间下的位置 */}
                        {filterType !== 'area' &&
                          searchResults.visibleRoomIds.includes(room.id) &&
                          spots
                            .filter(spot => spot.room_id === room.id)
                            .filter(spot => !searchTerm || matchesSearch(spot.name, searchTerm))
                            .map(spot => (
                              <div
                                key={`spot-${spot.id}`}
                                className={cn(
                                  'hover:bg-muted ml-4 flex cursor-pointer items-center rounded px-2 py-1 text-sm',
                                  isSelected('spot', spot.id) && 'bg-muted'
                                )}
                                onClick={() => handleSelect('spot', spot.id)}
                              >
                                <MapPin className="text-muted-foreground mr-1 h-3.5 w-3.5" />
                                <span className="truncate">{spot.name}</span>
                              </div>
                            ))}
                      </div>
                    ))}
              </div>
            ))}

            {/* 当过滤模式为房间时，直接显示房间列表 */}
            {filterType === 'room' &&
              searchResults.filteredRooms.map(room => (
                <div key={`direct-room-${room.id}`}>
                  <div
                    className={cn(
                      'hover:bg-muted flex cursor-pointer items-center rounded px-2 py-1 text-sm',
                      isSelected('room', room.id) && 'bg-muted'
                    )}
                    onClick={() => handleSelect('room', room.id)}
                  >
                    <Home className="text-muted-foreground mr-1 h-3.5 w-3.5" />
                    <span className="flex-grow cursor-pointer truncate">{room.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {getRoomAreaName(room)}
                    </span>
                  </div>

                  {/* 房间下的位置 */}
                  {searchResults.visibleRoomIds.includes(room.id) &&
                    spots
                      .filter(spot => spot.room_id === room.id)
                      .filter(spot => !searchTerm || matchesSearch(spot.name, searchTerm))
                      .map(spot => (
                        <div
                          key={`direct-spot-${spot.id}`}
                          className={cn(
                            'hover:bg-muted ml-4 flex cursor-pointer items-center rounded px-2 py-1 text-sm',
                            isSelected('spot', spot.id) && 'bg-muted'
                          )}
                          onClick={() => handleSelect('spot', spot.id)}
                        >
                          <MapPin className="text-muted-foreground mr-1 h-3.5 w-3.5" />
                          <span className="truncate">{spot.name}</span>
                        </div>
                      ))}
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  )
}

export default LocationTreeSelect
