"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, FolderOpen, Folder, MapPin, Home, ChevronRight, ChevronDown } from "lucide-react"
import { useAreas, useRooms, useSpots } from '@/utils/api'
import { cn } from '@/lib/utils'
import { LocationSelection } from '../types'

interface LocationTreeSelectProps {
  onSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath: string) => void;
  selectedLocation?: LocationSelection;
  className?: string;
}

const LocationTreeSelect: React.FC<LocationTreeSelectProps> = ({ onSelect, selectedLocation, className }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedAreas, setExpandedAreas] = useState<number[]>([])
  const [expandedRooms, setExpandedRooms] = useState<number[]>([])
  
  // 使用 SWR hooks 获取数据
  const { data: areas = [] } = useAreas()
  const { data: rooms = [] } = useRooms()
  const { data: spots = [] } = useSpots()
  
  useEffect(() => {
    // 如果有已选位置，将包含该位置的父级节点展开
    if (selectedLocation) {
      if (selectedLocation.type === 'room' || selectedLocation.type === 'spot') {
        // 如果是房间或位置，找到对应的区域并展开
        const room = rooms.find(r => r.id === (selectedLocation.type === 'room' 
          ? selectedLocation.id 
          : spots.find(s => s.id === selectedLocation.id)?.room_id))
        
        if (room && room.area_id) {
          setExpandedAreas(prev => [...prev, room.area_id])
        }
      }
      
      if (selectedLocation.type === 'spot') {
        // 如果是位置，找到对应的房间并展开
        const spot = spots.find(s => s.id === selectedLocation.id)
        if (spot && spot.room_id) {
          setExpandedRooms(prev => [...prev, spot.room_id])
        }
      }
    }
  }, [selectedLocation, rooms, spots])
  
  // 根据搜索词过滤位置
  const filteredAreas = areas.filter(area => 
    searchTerm === '' || area.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredRooms = rooms.filter(room => 
    searchTerm === '' || room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredSpots = spots.filter(spot => 
    searchTerm === '' || spot.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // 显示所有过滤后的位置和它们的父节点
  const getFilteredAreaIds = () => {
    if (searchTerm === '') return expandedAreas
    
    const matchingRooms = filteredRooms.map(room => room.area_id)
    const matchingSpotsRooms = filteredSpots
      .map(spot => rooms.find(room => room.id === spot.room_id))
      .filter(Boolean)
      .map(room => room!.area_id)
    
    return [...new Set([...filteredAreas.map(area => area.id), ...matchingRooms, ...matchingSpotsRooms])]
  }
  
  const getFilteredRoomIds = () => {
    if (searchTerm === '') return expandedRooms
    
    const matchingSpots = filteredSpots.map(spot => spot.room_id)
    
    return [...new Set([...filteredRooms.map(room => room.id), ...matchingSpots])]
  }
  
  const shownAreaIds = getFilteredAreaIds()
  const shownRoomIds = getFilteredRoomIds()
  
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
  
  // 全部展开
  const expandAll = () => {
    setExpandedAreas(areas.map(area => area.id))
    setExpandedRooms(rooms.map(room => room.id))
  }
  
  // 全部折叠
  const collapseAll = () => {
    setExpandedAreas([])
    setExpandedRooms([])
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
    <div className={cn("border rounded-md p-2 max-h-[300px] overflow-y-auto", className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="icon"
            onClick={expandAll}
            title="展开所有"
            className="h-7 w-7"
          >
            <FolderOpen className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={collapseAll}
            title="收起所有"
            className="h-7 w-7"
          >
            <Folder className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索位置..."
            className="pl-7 h-7 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="h-[200px]">
        {filteredAreas.length === 0 && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {searchTerm ? "没有匹配的位置" : "没有可用的位置"}
          </div>
        )}
        
        {filteredAreas.map(area => (
          <div key={area.id} className="mb-1">
            <div 
              className={cn(
                "flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                selectedLocation?.type === 'area' && selectedLocation.id === area.id && "bg-muted"
              )}
              onClick={() => handleSelect('area', area.id)}
            >
              <span
                className="mr-1 cursor-pointer"
                onClick={(e) => toggleArea(e, area.id)}
              >
                {shownAreaIds.includes(area.id) ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </span>
              <Home className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span className="flex-grow cursor-pointer truncate">
                {area.name}
              </span>
            </div>
            
            {shownAreaIds.includes(area.id) && rooms
              .filter(room => room.area_id === area.id)
              .map(room => (
                <div key={room.id} className="ml-4 mb-1">
                  <div 
                    className={cn(
                      "flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                      selectedLocation?.type === 'room' && selectedLocation.id === room.id && "bg-muted"
                    )}
                    onClick={() => handleSelect('room', room.id)}
                  >
                    <span
                      className="mr-1 cursor-pointer"
                      onClick={(e) => toggleRoom(e, room.id)}
                    >
                      {shownRoomIds.includes(room.id) ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <Folder className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                    <span className="flex-grow cursor-pointer truncate">
                      {room.name}
                    </span>
                  </div>
                  
                  {shownRoomIds.includes(room.id) && spots
                    .filter(spot => spot.room_id === room.id)
                    .map(spot => (
                      <div 
                        key={spot.id} 
                        className={cn(
                          "ml-4 flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                          selectedLocation?.type === 'spot' && selectedLocation.id === spot.id && "bg-muted"
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
      </ScrollArea>
    </div>
  )
}

export default LocationTreeSelect 