'use client'

import React, { useEffect, useMemo, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { cn } from '@/lib/helpers'
import { useLocationData } from './location-combobox/hooks/useLocationData'
import { useLocationSelection } from './location-combobox/hooks/useLocationSelection'
import { useLocationCreation } from './location-combobox/hooks/useLocationCreation'
import {
  getAreaOptions,
  getRoomOptions,
  getSpotOptions,
} from './location-combobox/utils/optionUtils'
import { buildLocationPath } from './location-combobox/utils/pathUtils'
import type { LocationSelection } from './location-combobox/hooks/useLocationSelection'
import type { Area, Room, Spot } from '@/app/thing/types'

interface LocationComboboxSelectProps {
  onSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => void
  selectedLocation?: LocationSelection
  className?: string
}

const LocationComboboxSelect: React.FC<LocationComboboxSelectProps> = ({
  onSelect,
  selectedLocation,
  className,
}) => {
  const {
    areas,
    rooms,
    spots,
    loading,
    setAreas,
    setRooms,
    setSpots,
    loadAreas,
    loadRooms,
    loadSpots,
  } = useLocationData()

  const {
    selectedAreaId,
    selectedRoomId,
    selectedSpotId,
    setSelectedAreaId,
    setSelectedRoomId,
    setSelectedSpotId,
    handleAreaChange,
    handleRoomChange,
    handleSpotChange,
  } = useLocationSelection(selectedLocation, areas, rooms, spots)

  // 区域选项
  const areaOptions = useMemo(() => getAreaOptions(areas), [areas])

  // 房间选项
  const roomOptions = useMemo(() => getRoomOptions(selectedAreaId, rooms), [selectedAreaId, rooms])

  // 位置选项
  const spotOptions = useMemo(() => getSpotOptions(selectedRoomId, spots), [selectedRoomId, spots])

  // 处理区域选择
  const handleAreaSelect = useCallback(
    (areaId: string) => {
      handleAreaChange(areaId)

      if (areaId) {
        const area = areas.find((a: Area) => a.id.toString() === areaId)
        if (area) {
          onSelect('area', area.id, area.name)
          loadRooms(areaId)
        }
      }
    },
    [areas, onSelect, loadRooms, handleAreaChange]
  )

  // 处理房间选择
  const handleRoomSelect = useCallback(
    (roomId: string) => {
      handleRoomChange(roomId)

      if (roomId) {
        const room = rooms.find((r: Room) => r.id.toString() === roomId)
        const area = areas.find((a: Area) => a.id.toString() === selectedAreaId)
        if (room && area) {
          const path = buildLocationPath('room', room.id, areas, rooms, spots, selectedAreaId, '')
          onSelect('room', room.id, path)
          loadSpots(roomId)
        }
      }
    },
    [rooms, areas, selectedAreaId, spots, onSelect, loadSpots, handleRoomChange]
  )

  // 处理位置选择
  const handleSpotSelect = useCallback(
    (spotId: string) => {
      handleSpotChange(spotId)

      if (spotId) {
        const spot = spots.find((s: Spot) => s.id.toString() === spotId)
        if (spot) {
          const path = buildLocationPath(
            'spot',
            spot.id,
            areas,
            rooms,
            spots,
            selectedAreaId,
            selectedRoomId
          )
          onSelect('spot', spot.id, path)
        }
      }
    },
    [spots, areas, rooms, selectedAreaId, selectedRoomId, onSelect, handleSpotChange]
  )

  const { handleCreateArea, handleCreateRoom, handleCreateSpot } = useLocationCreation(
    areas,
    rooms,
    spots,
    selectedAreaId,
    selectedRoomId,
    setAreas,
    setRooms,
    setSpots,
    setSelectedAreaId,
    setSelectedRoomId,
    setSelectedSpotId,
    handleSpotSelect
  )

  // 初始化加载区域数据
  useEffect(() => {
    loadAreas()
  }, [loadAreas])

  // 当区域改变时加载房间
  useEffect(() => {
    if (selectedAreaId) {
      loadRooms(selectedAreaId)
    } else {
      setRooms([])
    }
  }, [selectedAreaId, loadRooms, setRooms])

  // 当房间改变时加载位置
  useEffect(() => {
    if (selectedRoomId) {
      loadSpots(selectedRoomId)
    } else {
      setSpots([])
    }
  }, [selectedRoomId, loadSpots, setSpots])

  // 自动选择默认区域
  useEffect(() => {
    if (!selectedAreaId && !selectedLocation && areas.length > 0) {
      const defaultArea = areas.find((area: Area) => area.is_default)
      if (defaultArea) {
        handleAreaSelect(defaultArea.id.toString())
      }
    }
  }, [areas, selectedAreaId, selectedLocation, handleAreaSelect])

  return (
    <div className={cn('space-y-3', className)}>
      {/* 区域选择 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">区域</Label>
        <Combobox
          options={areaOptions}
          value={selectedAreaId}
          onChange={handleAreaSelect}
          onCreateOption={handleCreateArea}
          placeholder="选择或创建区域"
          emptyText="没有找到区域"
          createText="创建区域"
          searchText="搜索区域..."
        />
      </div>

      {/* 房间选择 */}
      {selectedAreaId && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">房间</Label>
          <Combobox
            options={roomOptions}
            value={selectedRoomId}
            onChange={handleRoomSelect}
            onCreateOption={handleCreateRoom}
            placeholder="选择或创建房间"
            emptyText="没有找到房间"
            createText="创建房间"
            searchText="搜索房间..."
          />
        </div>
      )}

      {/* 具体位置选择 */}
      {selectedRoomId && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">具体位置（可选）</Label>
          <Combobox
            options={spotOptions}
            value={selectedSpotId}
            onChange={handleSpotSelect}
            onCreateOption={handleCreateSpot}
            placeholder="选择或创建具体位置"
            emptyText="没有找到具体位置"
            createText="创建具体位置"
            searchText="搜索具体位置..."
          />
        </div>
      )}

      {loading && <div className="text-muted-foreground text-sm">加载中...</div>}
    </div>
  )
}

export default LocationComboboxSelect
