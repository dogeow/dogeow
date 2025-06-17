"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { MapPin, Home } from "lucide-react"
import { useLocations } from '@/lib/api'
import { cn } from '@/lib/helpers'
import { LocationSelection, LocationTreeResponse } from '../types'
import FolderIcon from './FolderIcon'

interface LocationTreeSelectProps {
  onSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => void;
  selectedLocation?: LocationSelection;
  className?: string;
  filterType?: 'area' | 'room' | null;
  isExpanded?: boolean;
}

const LocationTreeSelect: React.FC<LocationTreeSelectProps> = ({ 
  onSelect, 
  selectedLocation, 
  className,
  filterType = null,
  isExpanded = true
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedAreas, setExpandedAreas] = useState<number[]>([])
  const [expandedRooms, setExpandedRooms] = useState<number[]>([])
  const [, setMounted] = useState(false)
  
  const prevIsExpandedRef = useRef(isExpanded)
  const prevSelectionRef = useRef<{type?: string, id?: number}>({})
  
  // 确保组件已挂载
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // 使用统一的位置数据接口
  const { data: locationData } = useLocations()
  
  // 使用 useMemo 优化位置数据提取
  const { areas, rooms, spots } = useMemo(() => {
    const data = locationData as LocationTreeResponse
    return {
      areas: data?.areas || [],
      rooms: data?.rooms || [],
      spots: data?.spots || []
    }
  }, [locationData])
  
  // 处理初始展开状态
  useEffect(() => {
    if (areas.length > 0 && rooms.length > 0 && prevIsExpandedRef.current !== isExpanded) {
      prevIsExpandedRef.current = isExpanded
      
      if (isExpanded) {
        setExpandedAreas(areas.map(area => area.id))
        setExpandedRooms(rooms.map(room => room.id))
      } else {
        setExpandedAreas([])
        setExpandedRooms([])
      }
    }
  }, [isExpanded, areas, rooms])
  
  // 处理选中位置的展开状态
  useEffect(() => {
    if (!selectedLocation || !areas.length || !rooms.length || !spots.length) return
    
    const hasChanged = 
      prevSelectionRef.current.type !== selectedLocation.type || 
      prevSelectionRef.current.id !== selectedLocation.id
    
    if (!hasChanged) return

    prevSelectionRef.current = { 
      type: selectedLocation.type, 
      id: selectedLocation.id 
    }

    const newAreaIds = [...expandedAreas]
    const newRoomIds = [...expandedRooms]
    let hasUpdates = false

    if (selectedLocation.type === 'room' || selectedLocation.type === 'spot') {
      const room = rooms.find(r => r.id === (selectedLocation.type === 'room' 
        ? selectedLocation.id 
        : spots.find(s => s.id === selectedLocation.id)?.room_id))
      
      if (room?.area_id && !newAreaIds.includes(room.area_id)) {
        newAreaIds.push(room.area_id)
        hasUpdates = true
      }
    }
    
    if (selectedLocation.type === 'spot') {
      const spot = spots.find(s => s.id === selectedLocation.id)
      if (spot?.room_id && !newRoomIds.includes(spot.room_id)) {
        newRoomIds.push(spot.room_id)
        hasUpdates = true
      }
    }

    if (hasUpdates) {
      setExpandedAreas(newAreaIds)
      setExpandedRooms(newRoomIds)
    }
  }, [selectedLocation, areas, rooms, spots, expandedAreas, expandedRooms])
  
  // 过滤逻辑优化
  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    
    const filteredAreas = areas.filter(area => {
      if (filterType === 'room') return false
      return searchTerm === '' || area.name.toLowerCase().includes(searchLower)
    })
    
    const filteredRooms = rooms.filter(room => 
      searchTerm === '' || room.name.toLowerCase().includes(searchLower)
    )
    
    const filteredSpots = spots.filter(spot => {
      if (filterType === 'area') return false
      return searchTerm === '' || spot.name.toLowerCase().includes(searchLower)
    })
    
    return { filteredAreas, filteredRooms, filteredSpots }
  }, [areas, rooms, spots, searchTerm, filterType])
  
  // 在搜索模式下，显示所有包含匹配结果的区域
  const visibleAreas = useMemo(() => {
    if (searchTerm === '') return filteredData.filteredAreas
    
    const searchLower = searchTerm.toLowerCase()
    return areas.filter(area => {
      // 区域名称匹配
      if (area.name.toLowerCase().includes(searchLower)) return true
      
      // 区域包含匹配的房间
      const hasMatchingRoom = rooms.some(room => 
        room.area_id === area.id && room.name.toLowerCase().includes(searchLower)
      )
      if (hasMatchingRoom) return true
      
      // 区域包含匹配的位置
      return spots.some(spot => {
        const room = rooms.find(r => r.id === spot.room_id)
        return room?.area_id === area.id && spot.name.toLowerCase().includes(searchLower)
      })
    })
  }, [searchTerm, filteredData.filteredAreas, areas, rooms, spots])
  
  // 获取区域下可见的房间
  const getVisibleRoomsForArea = useCallback((areaId: number) => {
    const areaRooms = rooms.filter(room => room.area_id === areaId)
    
    if (searchTerm === '') return areaRooms
    
    const searchLower = searchTerm.toLowerCase()
    return areaRooms.filter(room => {
      // 房间名称匹配
      if (room.name.toLowerCase().includes(searchLower)) return true
      
      // 房间包含匹配的位置
      return spots.some(spot => 
        spot.room_id === room.id && spot.name.toLowerCase().includes(searchLower)
      )
    })
  }, [rooms, spots, searchTerm])
  
  // 获取应该展开的区域和房间ID
  const { filteredAreaIds, filteredRoomIds } = useMemo(() => {
    const filteredAreaIds = searchTerm !== '' ? visibleAreas.map(area => area.id) : expandedAreas
    
    let filteredRoomIds: number[]
    if (searchTerm === '') {
      filteredRoomIds = expandedRooms
    } else {
      const searchLower = searchTerm.toLowerCase()
      filteredRoomIds = rooms
        .filter(room => 
          visibleAreas.some(area => area.id === room.area_id) && (
            room.name.toLowerCase().includes(searchLower) ||
            spots.some(spot => 
              spot.room_id === room.id && 
              spot.name.toLowerCase().includes(searchLower)
            )
          )
        )
        .map(room => room.id)
    }
    
    return { filteredAreaIds, filteredRoomIds }
  }, [searchTerm, visibleAreas, expandedAreas, expandedRooms, rooms, spots])
  
  // 处理展开/折叠
  const toggleArea = useCallback((e: React.MouseEvent, areaId: number) => {
    e.stopPropagation()
    setExpandedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }, [])
  
  const toggleRoom = useCallback((e: React.MouseEvent, roomId: number) => {
    e.stopPropagation()
    setExpandedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }, [])
  
  // 构建选择路径
  const buildPath = useCallback((type: 'area' | 'room' | 'spot', id: number): string => {
    if (type === 'area') {
      const area = areas.find(a => a.id === id)
      return area?.name || '未知区域'
    } 
    
    if (type === 'room') {
      const room = rooms.find(r => r.id === id)
      if (!room) return '未知房间'
      
      const area = areas.find(a => a.id === room.area_id)
      return `${area?.name || '未知区域'} / ${room.name}`
    } 
    
    // spot
    const spot = spots.find(s => s.id === id)
    if (!spot) return '未知位置'
    
    const room = rooms.find(r => r.id === spot.room_id)
    if (!room) return `未知房间 / ${spot.name}`
    
    const area = areas.find(a => a.id === room.area_id)
    return `${area?.name || '未知区域'} / ${room.name} / ${spot.name}`
  }, [areas, rooms, spots])
  
  // 选择位置
  const handleSelect = useCallback((type: 'area' | 'room' | 'spot', id: number) => {
    onSelect(type, id, buildPath(type, id))
  }, [onSelect, buildPath])

  const hasNoResults = filteredData.filteredAreas.length === 0 && 
                      filteredData.filteredRooms.length === 0 && 
                      filteredData.filteredSpots.length === 0

  return (
    <div className={cn("border rounded-md p-2 bg-card", className)}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </svg>
          </div>
          <Input
            placeholder="搜索位置..."
            className="pl-7 h-8 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="h-[300px] overflow-y-auto pr-1">
        {hasNoResults && (
          <div className="py-2 text-center text-sm text-muted-foreground">
            {searchTerm ? "没有匹配的位置" : "没有可用的位置"}
          </div>
        )}
        
        {filterType !== 'room' && visibleAreas.map(area => (
          <div key={area.id}>
            <div 
              className={cn(
                "flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                selectedLocation?.type === 'area' && selectedLocation.id === area.id 
                  ? "bg-muted" 
                  : ""
              )}
              onClick={() => handleSelect('area', area.id)}
            >
              <span
                onClick={(e) => toggleArea(e, area.id)}
                className="flex items-center"
              >
                <FolderIcon 
                  isOpen={filteredAreaIds.includes(area.id)}
                  size={14}
                  className="mr-1"
                />
              </span>
              <span className="flex-grow cursor-pointer truncate">
                {area.name}
              </span>
            </div>
            
            {filteredAreaIds.includes(area.id) && getVisibleRoomsForArea(area.id)
              .map(room => (
                <div key={room.id} className="ml-4">
                  <div 
                    className={cn(
                      "flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                      selectedLocation?.type === 'room' && selectedLocation.id === room.id 
                        ? "bg-muted" 
                        : ""
                    )}
                    onClick={() => handleSelect('room', room.id)}
                  >
                    <span
                      onClick={(e) => toggleRoom(e, room.id)}
                      className="flex items-center"
                    >
                      <Home 
                        className="h-3.5 w-3.5 mr-1 text-muted-foreground"
                      />
                    </span>
                    <span className="flex-grow cursor-pointer truncate">
                      {room.name}
                    </span>
                  </div>
                  
                  {filterType !== 'area' && filteredRoomIds.includes(room.id) && spots
                    .filter(spot => spot.room_id === room.id)
                    .filter(spot => searchTerm === '' || spot.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(spot => (
                      <div 
                        key={spot.id} 
                        className={cn(
                          "ml-4 flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                          selectedLocation?.type === 'spot' && selectedLocation.id === spot.id 
                            ? "bg-muted" 
                            : ""
                        )}
                        onClick={() => handleSelect('spot', spot.id)}
                      >
                        <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="truncate">{spot.name}</span>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        ))}
        
        {/* 当过滤模式为房间时，直接在根级显示房间列表 */}
        {filterType === 'room' && filteredData.filteredRooms.map(room => (
          <div key={room.id}>
            <div 
              className={cn(
                "flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                selectedLocation?.type === 'room' && selectedLocation.id === room.id 
                  ? "bg-muted" 
                  : ""
              )}
              onClick={() => handleSelect('room', room.id)}
            >
              <Home 
                className="h-3.5 w-3.5 mr-1 text-muted-foreground"
              />
              <span className="flex-grow cursor-pointer truncate">
                {room.name}
              </span>
              {room.area?.name && (
                <span className="text-xs text-muted-foreground ml-2">
                  {room.area.name}
                </span>
              )}
            </div>
            
            {filteredRoomIds.includes(room.id) && spots
              .filter(spot => spot.room_id === room.id)
              .filter(spot => searchTerm === '' || spot.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(spot => (
                <div 
                  key={spot.id} 
                  className={cn(
                    "ml-4 flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                    selectedLocation?.type === 'spot' && selectedLocation.id === spot.id 
                      ? "bg-muted" 
                      : ""
                  )}
                  onClick={() => handleSelect('spot', spot.id)}
                >
                  <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span className="truncate">{spot.name}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default LocationTreeSelect 