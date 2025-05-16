"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, MapPin, Home } from "lucide-react"
import { useAreas, useRooms, useSpots } from '@/utils/api'
import { cn } from '@/lib/utils'
import { LocationSelection } from '../types'
import FolderIcon from './FolderIcon'

interface LocationTreeSelectProps {
  onSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath: string) => void;
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
  const prevIsExpandedRef = useRef(isExpanded)
  
  // 使用 SWR hooks 获取数据
  const { data: areas = [] } = useAreas()
  const { data: rooms = [] } = useRooms()
  const { data: spots = [] } = useSpots()
  
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
  
  const prevSelectionRef = useRef<{type?: string, id?: number}>({});
  
  useEffect(() => {
    if (selectedLocation && areas.length && rooms.length && spots.length) {
      const hasChanged = 
        prevSelectionRef.current.type !== selectedLocation.type || 
        prevSelectionRef.current.id !== selectedLocation.id;
      
      if (!hasChanged) return;

      prevSelectionRef.current = { 
        type: selectedLocation.type, 
        id: selectedLocation.id 
      };

      let shouldUpdateAreaIds = false;
      let shouldUpdateRoomIds = false;
      let newAreaIds = [...expandedAreas];
      let newRoomIds = [...expandedRooms];

      if (selectedLocation.type === 'room' || selectedLocation.type === 'spot') {
        const room = rooms.find(r => r.id === (selectedLocation.type === 'room' 
          ? selectedLocation.id 
          : spots.find(s => s.id === selectedLocation.id)?.room_id));
        
        if (room && room.area_id && !newAreaIds.includes(room.area_id)) {
          newAreaIds.push(room.area_id);
          shouldUpdateAreaIds = true;
        }
      }
      
      if (selectedLocation.type === 'spot') {
        const spot = spots.find(s => s.id === selectedLocation.id);
        if (spot && spot.room_id && !newRoomIds.includes(spot.room_id)) {
          newRoomIds.push(spot.room_id);
          shouldUpdateRoomIds = true;
        }
      }

      if (shouldUpdateAreaIds) {
        setExpandedAreas(newAreaIds);
      }
      
      if (shouldUpdateRoomIds) {
        setExpandedRooms(newRoomIds);
      }
    }
  }, [selectedLocation, areas, rooms, spots]);
  
  // 根据搜索词和过滤类型过滤位置
  const filteredAreas = areas.filter(area => {
    const matchesSearch = searchTerm === '' || area.name.toLowerCase().includes(searchTerm.toLowerCase())
    // 如果仅显示房间，不显示区域
    if (filterType === 'room') return false
    return matchesSearch
  })
  
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = searchTerm === '' || room.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })
  
  const filteredSpots = spots.filter(spot => {
    const matchesSearch = searchTerm === '' || spot.name.toLowerCase().includes(searchTerm.toLowerCase())
    // 如果仅显示区域，不显示位置
    if (filterType === 'area') return false
    return matchesSearch
  })
  
  // 在搜索模式下，我们需要显示所有包含匹配结果的区域，即使区域名称本身不匹配
  const visibleAreas = searchTerm === ''
    ? filteredAreas
    : areas.filter(area => {
        // 区域名称匹配
        if (area.name.toLowerCase().includes(searchTerm.toLowerCase())) return true
        
        // 区域包含匹配的房间
        const hasMatchingRoom = rooms.some(room => 
          room.area_id === area.id && room.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (hasMatchingRoom) return true
        
        // 区域包含匹配的位置
        const hasMatchingSpot = spots.some(spot => {
          const room = rooms.find(r => r.id === spot.room_id)
          return room?.area_id === area.id && spot.name.toLowerCase().includes(searchTerm.toLowerCase())
        })
        
        return hasMatchingSpot
      })
  
  // 在搜索模式下，我们需要显示所有包含匹配结果的房间，即使房间名称本身不匹配
  const getVisibleRoomsForArea = (areaId: number) => {
    const areaRooms = rooms.filter(room => room.area_id === areaId)
    
    if (searchTerm === '') {
      return areaRooms
    }
    
    return areaRooms.filter(room => {
      // 房间名称匹配
      if (room.name.toLowerCase().includes(searchTerm.toLowerCase())) return true
      
      // 房间包含匹配的位置
      return spots.some(spot => 
        spot.room_id === room.id && spot.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }
  
  // 显示所有过滤后的位置和它们的父节点
  const getFilteredAreaIds = () => {
    // 搜索模式下，展开所有可见区域
    if (searchTerm !== '') {
      return visibleAreas.map(area => area.id)
    }
    
    return expandedAreas
  }
  
  const getFilteredRoomIds = () => {
    // 搜索模式下，展开所有可见房间
    if (searchTerm !== '') {
      return rooms
        .filter(room => visibleAreas.some(area => area.id === room.area_id))
        .filter(room => {
          // 房间名称匹配
          if (room.name.toLowerCase().includes(searchTerm.toLowerCase())) return true
          
          // 房间包含匹配的位置
          return spots.some(spot => 
            spot.room_id === room.id && spot.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        })
        .map(room => room.id)
    }
    
    return expandedRooms
  }
  
  // 处理展开/折叠
  const toggleArea = (e: React.MouseEvent, areaId: number) => {
    e.stopPropagation()
    setExpandedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    )
  }
  
  const toggleRoom = (e: React.MouseEvent, roomId: number) => {
    e.stopPropagation()
    setExpandedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }
  
  // 构建选择路径
  const buildPath = (type: 'area' | 'room' | 'spot', id: number): string => {
    if (type === 'area') {
      const area = areas.find(a => a.id === id)
      return area ? area.name : '未知区域'
    } else if (type === 'room') {
      const room = rooms.find(r => r.id === id)
      if (!room) return '未知房间'
      
      const area = areas.find(a => a.id === room.area_id)
      return `${area ? area.name : '未知区域'} / ${room.name}`
    } else {
      const spot = spots.find(s => s.id === id)
      if (!spot) return '未知位置'
      
      const room = rooms.find(r => r.id === spot.room_id)
      if (!room) return `未知房间 / ${spot.name}`
      
      const area = areas.find(a => a.id === room.area_id)
      return `${area ? area.name : '未知区域'} / ${room.name} / ${spot.name}`
    }
  }
  
  // 选择位置
  const handleSelect = (type: 'area' | 'room' | 'spot', id: number) => {
    const fullPath = buildPath(type, id)
    onSelect(type, id, fullPath)
  }

  return (
    <div className={cn("border rounded-md p-2", className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索位置..."
            className="pl-7 h-8 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="h-[300px] overflow-y-auto pr-1">
        {filteredAreas.length === 0 && filteredRooms.length === 0 && filteredSpots.length === 0 && (
          <div className="py-2 text-center text-sm text-muted-foreground">
            {searchTerm ? "没有匹配的位置" : "没有可用的位置"}
          </div>
        )}
        
        {filterType !== 'room' && visibleAreas.map(area => (
          <div key={area.id}>
            <div 
              className={cn(
                "flex items-center py-1 px-2 rounded hover:bg-blue-100 cursor-pointer text-sm bg-blue-50",
                selectedLocation?.type === 'area' && selectedLocation.id === area.id && "bg-blue-100"
              )}
              onClick={() => handleSelect('area', area.id)}
            >
              <span
                onClick={(e) => toggleArea(e, area.id)}
                className="flex items-center"
              >
                <FolderIcon 
                  isOpen={getFilteredAreaIds().includes(area.id)}
                  size={14}
                  className="mr-1"
                />
              </span>
              <span className="flex-grow cursor-pointer truncate">
                {area.name}
              </span>
            </div>
            
            {getFilteredAreaIds().includes(area.id) && getVisibleRoomsForArea(area.id)
              .map(room => (
                <div key={room.id} className="ml-4">
                  <div 
                    className={cn(
                      "flex items-center py-1 px-2 rounded hover:bg-green-100 cursor-pointer text-sm bg-green-50",
                      selectedLocation?.type === 'room' && selectedLocation.id === room.id && "bg-green-100"
                    )}
                    onClick={() => handleSelect('room', room.id)}
                  >
                    <span
                      onClick={(e) => toggleRoom(e, room.id)}
                      className="flex items-center"
                    >
                      <FolderIcon 
                        isOpen={getFilteredRoomIds().includes(room.id)} 
                        size={14}
                        className="mr-1"
                      />
                    </span>
                    <span className="flex-grow cursor-pointer truncate">
                      {room.name}
                    </span>
                  </div>
                  
                  {filterType !== 'area' && getFilteredRoomIds().includes(room.id) && spots
                    .filter(spot => spot.room_id === room.id)
                    .filter(spot => searchTerm === '' || spot.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(spot => (
                      <div 
                        key={spot.id} 
                        className={cn(
                          "ml-4 flex items-center py-1 px-2 rounded hover:bg-purple-100 cursor-pointer text-sm bg-purple-50",
                          selectedLocation?.type === 'spot' && selectedLocation.id === spot.id && "bg-purple-100"
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
        {filterType === 'room' && filteredRooms.map(room => (
          <div key={room.id}>
            <div 
              className={cn(
                "flex items-center py-1 px-2 rounded hover:bg-green-100 cursor-pointer text-sm bg-green-50",
                selectedLocation?.type === 'room' && selectedLocation.id === room.id && "bg-green-100"
              )}
              onClick={() => handleSelect('room', room.id)}
            >
              <FolderIcon 
                isOpen={getFilteredRoomIds().includes(room.id)} 
                size={14}
                className="mr-1"
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
            
            {getFilteredRoomIds().includes(room.id) && spots
              .filter(spot => spot.room_id === room.id)
              .map(spot => (
                <div 
                  key={spot.id} 
                  className={cn(
                    "ml-4 flex items-center py-1 px-2 rounded hover:bg-purple-100 cursor-pointer text-sm bg-purple-50",
                    selectedLocation?.type === 'spot' && selectedLocation.id === spot.id && "bg-purple-100"
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