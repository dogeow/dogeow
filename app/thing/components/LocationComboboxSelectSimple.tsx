'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { cn } from '@/lib/helpers'
import { useLocationData } from './location/hooks/useLocationData'
import { useAutoScroll } from './location/hooks/useAutoScroll'
import { useLocationCreation } from './location/hooks/useLocationCreation'
import { LocationSelectField } from './location/components/LocationSelectField'
import { areaToOptions, roomToOptions, spotToOptions } from './location/utils/optionUtils'
import { buildPathFromSelection } from './location/utils/pathUtils'
import type { Area, Room, Spot } from './types'

export type LocationSelection =
  | {
      type: 'area' | 'room' | 'spot'
      id: number
    }
  | undefined

interface LocationComboboxSelectProps {
  onSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => void
  selectedLocation?: LocationSelection
  className?: string
}

const LocationComboboxSelectSimple: React.FC<LocationComboboxSelectProps> = ({
  onSelect,
  className,
}) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [selectedSpotId, setSelectedSpotId] = useState<string>('')

  const roomSelectRef = useRef<HTMLDivElement>(null)
  const spotSelectRef = useRef<HTMLDivElement>(null)

  const { areas, rooms, spots, loading, setAreas, setRooms, setSpots, loadRooms, loadSpots } =
    useLocationData()

  // 当选择区域时加载房间
  useEffect(() => {
    if (selectedAreaId) {
      loadRooms(selectedAreaId)
    } else {
      setRooms([])
    }
  }, [selectedAreaId, loadRooms, setRooms])

  // 当选择房间时加载位置
  useEffect(() => {
    if (selectedRoomId) {
      loadSpots(selectedRoomId)
    } else {
      setSpots([])
    }
  }, [selectedRoomId, loadSpots, setSpots])

  // 自动滚动
  useAutoScroll({ trigger: selectedAreaId, elementRef: roomSelectRef })
  useAutoScroll({ trigger: selectedRoomId, elementRef: spotSelectRef })

  // 选项转换
  const areaOptions = useMemo(() => areaToOptions(areas), [areas])
  const roomOptions = useMemo(() => {
    if (!selectedAreaId) return []
    return roomToOptions(rooms)
  }, [selectedAreaId, rooms])
  const spotOptions = useMemo(() => {
    if (!selectedRoomId) return []
    return spotToOptions(spots)
  }, [selectedRoomId, spots])

  // 创建处理
  const { handleCreateArea, handleCreateRoom, handleCreateSpot } = useLocationCreation({
    areas,
    rooms,
    spots,
    selectedAreaId,
    selectedRoomId,
    setAreas,
    setRooms,
    setSpots,
    onSelect,
    setSelectedAreaId,
    setSelectedRoomId,
    setSelectedSpotId,
  })

  // 处理区域选择
  const handleAreaSelect = (areaId: string) => {
    setSelectedAreaId(areaId)
    setSelectedRoomId('')
    setSelectedSpotId('')

    if (areaId) {
      const area = areas.find(a => a.id.toString() === areaId)
      if (area) {
        onSelect('area', area.id, area.name)
      }
    } else {
      onSelect('area', 0, '')
    }
  }

  // 处理房间选择
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId)
    setSelectedSpotId('')

    if (roomId) {
      const path = buildPathFromSelection(selectedAreaId, roomId, '', areas, rooms, spots)
      const room = rooms.find(r => r.id.toString() === roomId)
      if (room) {
        onSelect('room', room.id, path)
      }
    } else {
      if (selectedAreaId) {
        const area = areas.find(a => a.id.toString() === selectedAreaId)
        if (area) {
          onSelect('area', area.id, area.name)
        }
      } else {
        onSelect('area', 0, '')
      }
    }
  }

  // 处理位置选择
  const handleSpotSelect = (spotId: string) => {
    setSelectedSpotId(spotId)

    if (spotId) {
      const path = buildPathFromSelection(
        selectedAreaId,
        selectedRoomId,
        spotId,
        areas,
        rooms,
        spots
      )
      const spot = spots.find(s => s.id.toString() === spotId)
      if (spot) {
        onSelect('spot', spot.id, path)
      }
    } else {
      if (selectedRoomId && selectedAreaId) {
        const path = buildPathFromSelection(selectedAreaId, selectedRoomId, '', areas, rooms, spots)
        const room = rooms.find(r => r.id.toString() === selectedRoomId)
        if (room) {
          onSelect('room', room.id, path)
        }
      } else if (selectedAreaId) {
        const area = areas.find(a => a.id.toString() === selectedAreaId)
        if (area) {
          onSelect('area', area.id, area.name)
        }
      } else {
        onSelect('area', 0, '')
      }
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <LocationSelectField
        label="区域"
        options={areaOptions}
        value={selectedAreaId}
        onChange={handleAreaSelect}
        onCreateOption={handleCreateArea}
        placeholder="选择或创建区域"
        emptyText="没有找到区域"
        createText="创建区域"
        searchText="搜索区域..."
      />

      <div ref={roomSelectRef}>
        <LocationSelectField
          label="房间"
          options={roomOptions}
          value={selectedRoomId}
          onChange={handleRoomSelect}
          onCreateOption={handleCreateRoom}
          placeholder="选择或创建房间"
          emptyText="没有找到房间"
          createText="创建房间"
          searchText="搜索房间..."
          disabled={!selectedAreaId}
          disabledText="请先选择区域"
        />
      </div>

      <div ref={spotSelectRef}>
        <LocationSelectField
          label="具体位置（可选）"
          options={spotOptions}
          value={selectedSpotId}
          onChange={handleSpotSelect}
          onCreateOption={handleCreateSpot}
          placeholder="选择或创建具体位置"
          emptyText="没有找到具体位置"
          createText="创建具体位置"
          searchText="搜索具体位置..."
          disabled={!selectedRoomId}
          disabledText={selectedAreaId ? '请先选择房间' : '请先选择区域和房间'}
        />
      </div>

      {loading && <div className="text-muted-foreground text-sm">加载中...</div>}
    </div>
  )
}

export default LocationComboboxSelectSimple
