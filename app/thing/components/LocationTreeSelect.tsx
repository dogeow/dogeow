"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { MapPin } from "lucide-react"
import { useAreas, useRooms, useSpots } from '@/lib/api'
import { cn } from '@/lib/helpers'
import { LocationSelection, Area, Room, Spot } from '../types'
import FolderIcon from './FolderIcon'
import { useTheme } from 'next-themes'

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
  const prevIsExpandedRef = useRef(isExpanded)
  const prevSelectionRef = useRef<{type?: string, id?: number}>({});
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // 确保组件已挂载
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 使用 SWR hooks 获取数据
  const { data: areasData = [] } = useAreas()
  const { data: roomsData = [] } = useRooms()
  const { data: spotsData = [] } = useSpots()
  
  // 添加类型断言
  const areas = areasData as Area[];
  const rooms = roomsData as Room[];
  const spots = spotsData as Spot[];
  
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
    if (!selectedLocation || !areas.length || !rooms.length || !spots.length) return;
    
    const hasChanged = 
      prevSelectionRef.current.type !== selectedLocation.type || 
      prevSelectionRef.current.id !== selectedLocation.id;
    
    if (!hasChanged) return;

    prevSelectionRef.current = { 
      type: selectedLocation.type, 
      id: selectedLocation.id 
    };

    const newAreaIds = [...expandedAreas];
    const newRoomIds = [...expandedRooms];
    let hasUpdates = false;

    if (selectedLocation.type === 'room' || selectedLocation.type === 'spot') {
      const room = rooms.find(r => r.id === (selectedLocation.type === 'room' 
        ? selectedLocation.id 
        : spots.find(s => s.id === selectedLocation.id)?.room_id));
      
      if (room?.area_id && !newAreaIds.includes(room.area_id)) {
        newAreaIds.push(room.area_id);
        hasUpdates = true;
      }
    }
    
    if (selectedLocation.type === 'spot') {
      const spot = spots.find(s => s.id === selectedLocation.id);
      if (spot?.room_id && !newRoomIds.includes(spot.room_id)) {
        newRoomIds.push(spot.room_id);
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      setExpandedAreas(newAreaIds);
      setExpandedRooms(newRoomIds);
    }
  }, [selectedLocation, areas, rooms, spots, expandedAreas, expandedRooms]);
  
  // 根据搜索词和过滤类型过滤位置
  const filteredAreas = areas.filter(area => {
    if (filterType === 'room') return false;
    return searchTerm === '' || area.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const filteredRooms = rooms.filter(room => 
    searchTerm === '' || room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSpots = spots.filter(spot => {
    if (filterType === 'area') return false;
    return searchTerm === '' || spot.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // 在搜索模式下，显示所有包含匹配结果的区域
  const visibleAreas = searchTerm === '' 
    ? filteredAreas 
    : areas.filter(area => {
        // 区域名称匹配
        if (area.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
        
        // 区域包含匹配的房间
        const hasMatchingRoom = rooms.some(room => 
          room.area_id === area.id && room.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        if (hasMatchingRoom) return true;
        
        // 区域包含匹配的位置
        return spots.some(spot => {
          const room = rooms.find(r => r.id === spot.room_id);
          return room?.area_id === area.id && spot.name.toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
  
  // 获取区域下可见的房间
  const getVisibleRoomsForArea = (areaId: number) => {
    const areaRooms = rooms.filter(room => room.area_id === areaId);
    
    if (searchTerm === '') return areaRooms;
    
    return areaRooms.filter(room => {
      // 房间名称匹配
      if (room.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
      
      // 房间包含匹配的位置
      return spots.some(spot => 
        spot.room_id === room.id && spot.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };
  
  // 获取应该展开的区域ID
  const getFilteredAreaIds = () => 
    searchTerm !== '' ? visibleAreas.map(area => area.id) : expandedAreas;
  
  // 获取应该展开的房间ID
  const getFilteredRoomIds = () => {
    if (searchTerm === '') return expandedRooms;
    
    return rooms
      .filter(room => 
        visibleAreas.some(area => area.id === room.area_id) && (
          room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          spots.some(spot => 
            spot.room_id === room.id && 
            spot.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      )
      .map(room => room.id);
  };
  
  // 处理展开/折叠
  const toggleArea = (e: React.MouseEvent, areaId: number) => {
    e.stopPropagation();
    setExpandedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };
  
  const toggleRoom = (e: React.MouseEvent, roomId: number) => {
    e.stopPropagation();
    setExpandedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };
  
  // 构建选择路径
  const buildPath = (type: 'area' | 'room' | 'spot', id: number): string => {
    if (type === 'area') {
      const area = areas.find(a => a.id === id);
      return area?.name || '未知区域';
    } 
    
    if (type === 'room') {
      const room = rooms.find(r => r.id === id);
      if (!room) return '未知房间';
      
      const area = areas.find(a => a.id === room.area_id);
      return `${area?.name || '未知区域'} / ${room.name}`;
    } 
    
    // spot
    const spot = spots.find(s => s.id === id);
    if (!spot) return '未知位置';
    
    const room = rooms.find(r => r.id === spot.room_id);
    if (!room) return `未知房间 / ${spot.name}`;
    
    const area = areas.find(a => a.id === room.area_id);
    return `${area?.name || '未知区域'} / ${room.name} / ${spot.name}`;
  };
  
  // 选择位置
  const handleSelect = (type: 'area' | 'room' | 'spot', id: number) => {
    onSelect(type, id, buildPath(type, id));
  };

  const filteredAreaIds = getFilteredAreaIds();
  const filteredRoomIds = getFilteredRoomIds();
  const hasNoResults = filteredAreas.length === 0 && filteredRooms.length === 0 && filteredSpots.length === 0;

  return (
    <div className={cn("border rounded-md p-2 bg-background dark:bg-gray-800", className)} 
      style={{ backgroundColor: mounted && theme === 'dark' ? 'rgb(31 41 55)' : '' }}
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
                "flex items-center py-1 px-2 rounded hover:bg-blue-100 hover:dark:bg-blue-800/40 cursor-pointer text-sm",
                selectedLocation?.type === 'area' && selectedLocation.id === area.id 
                  ? "bg-blue-100 dark:bg-blue-800/60" 
                  : "bg-blue-50 dark:bg-blue-950/50"
              )}
              style={{ 
                backgroundColor: mounted ? (
                  theme === 'dark' 
                    ? (selectedLocation?.type === 'area' && selectedLocation.id === area.id 
                      ? 'rgba(30, 64, 175, 0.6)' 
                      : 'rgba(23, 37, 84, 0.5)')
                    : (selectedLocation?.type === 'area' && selectedLocation.id === area.id 
                      ? 'rgb(219 234 254)' 
                      : 'rgb(239 246 255)')
                ) : ''
              }}
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
                      "flex items-center py-1 px-2 rounded hover:bg-green-100 hover:dark:bg-green-800/40 cursor-pointer text-sm",
                      selectedLocation?.type === 'room' && selectedLocation.id === room.id 
                        ? "bg-green-100 dark:bg-green-800/60" 
                        : "bg-green-50 dark:bg-green-950/50"
                    )}
                    style={{ 
                      backgroundColor: mounted ? (
                        theme === 'dark' 
                          ? (selectedLocation?.type === 'room' && selectedLocation.id === room.id 
                            ? 'rgba(22, 101, 52, 0.6)' 
                            : 'rgba(5, 46, 22, 0.5)')
                          : (selectedLocation?.type === 'room' && selectedLocation.id === room.id 
                            ? 'rgb(220 252 231)' 
                            : 'rgb(240 253 244)')
                      ) : ''
                    }}
                    onClick={() => handleSelect('room', room.id)}
                  >
                    <span
                      onClick={(e) => toggleRoom(e, room.id)}
                      className="flex items-center"
                    >
                      <FolderIcon 
                        isOpen={filteredRoomIds.includes(room.id)} 
                        size={14}
                        className="mr-1"
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
                          "ml-4 flex items-center py-1 px-2 rounded hover:bg-purple-100 hover:dark:bg-purple-800/40 cursor-pointer text-sm",
                          selectedLocation?.type === 'spot' && selectedLocation.id === spot.id 
                            ? "bg-purple-100 dark:bg-purple-800/60" 
                            : "bg-purple-50 dark:bg-purple-950/50"
                        )}
                        style={{ 
                          backgroundColor: mounted ? (
                            theme === 'dark' 
                              ? (selectedLocation?.type === 'spot' && selectedLocation.id === spot.id 
                                ? 'rgba(107, 33, 168, 0.6)' 
                                : 'rgba(76, 29, 149, 0.5)')
                              : (selectedLocation?.type === 'spot' && selectedLocation.id === spot.id 
                                ? 'rgb(243 232 255)' 
                                : 'rgb(250 245 255)')
                          ) : ''
                        }}
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
                "flex items-center py-1 px-2 rounded hover:bg-green-100 hover:dark:bg-green-800/40 cursor-pointer text-sm",
                selectedLocation?.type === 'room' && selectedLocation.id === room.id 
                  ? "bg-green-100 dark:bg-green-800/60" 
                  : "bg-green-50 dark:bg-green-950/50"
              )}
              style={{ 
                backgroundColor: mounted ? (
                  theme === 'dark' 
                    ? (selectedLocation?.type === 'room' && selectedLocation.id === room.id 
                      ? 'rgba(22, 101, 52, 0.6)' 
                      : 'rgba(5, 46, 22, 0.5)')
                    : (selectedLocation?.type === 'room' && selectedLocation.id === room.id 
                      ? 'rgb(220 252 231)' 
                      : 'rgb(240 253 244)')
                ) : ''
              }}
              onClick={() => handleSelect('room', room.id)}
            >
              <FolderIcon 
                isOpen={filteredRoomIds.includes(room.id)} 
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
            
            {filteredRoomIds.includes(room.id) && spots
              .filter(spot => spot.room_id === room.id)
              .filter(spot => searchTerm === '' || spot.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(spot => (
                <div 
                  key={spot.id} 
                  className={cn(
                    "ml-4 flex items-center py-1 px-2 rounded hover:bg-purple-100 hover:dark:bg-purple-800/40 cursor-pointer text-sm",
                    selectedLocation?.type === 'spot' && selectedLocation.id === spot.id 
                      ? "bg-purple-100 dark:bg-purple-800/60" 
                      : "bg-purple-50 dark:bg-purple-950/50"
                  )}
                  style={{ 
                    backgroundColor: mounted ? (
                      theme === 'dark' 
                        ? (selectedLocation?.type === 'spot' && selectedLocation.id === spot.id 
                          ? 'rgba(107, 33, 168, 0.6)' 
                          : 'rgba(76, 29, 149, 0.5)')
                        : (selectedLocation?.type === 'spot' && selectedLocation.id === spot.id 
                          ? 'rgb(243 232 255)' 
                          : 'rgb(250 245 255)')
                    ) : ''
                  }}
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