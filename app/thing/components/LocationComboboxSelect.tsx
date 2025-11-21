'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { cn } from '@/lib/helpers'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import { Area, Room, Spot } from '../types'

// 位置选择类型
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

const LocationComboboxSelect: React.FC<LocationComboboxSelectProps> = ({
  onSelect,
  selectedLocation,
  className,
}) => {
  // 状态管理
  const [areas, setAreas] = useState<Area[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(false)

  // 当前选择的区域、房间、位置
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [selectedSpotId, setSelectedSpotId] = useState<string>('')

  // 加载房间数据
  const loadRooms = useCallback(async (areaId: string) => {
    if (!areaId) {
      setRooms([])
      return
    }

    try {
      const data = await apiRequest<Room[]>(`/areas/${areaId}/rooms`)
      setRooms(data)
    } catch (error) {
      console.error('加载房间失败:', error)
      toast.error('加载房间失败')
    }
  }, [])

  // 处理区域选择
  const handleAreaSelect = useCallback(
    (areaId: string) => {
      setSelectedAreaId(areaId)
      setSelectedRoomId('')
      setSelectedSpotId('')

      if (areaId) {
        const area = areas.find(a => a.id.toString() === areaId)
        if (area) {
          onSelect('area', area.id, area.name)
          loadRooms(areaId)
        }
      }
    },
    [areas, onSelect, loadRooms]
  )

  // 加载区域数据
  const loadAreas = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiRequest<Area[]>('/areas')
      setAreas(data)

      // 如果没有选择区域，自动选择默认区域
      if (!selectedAreaId && !selectedLocation) {
        const defaultArea = data.find(area => area.is_default)
        if (defaultArea) {
          handleAreaSelect(defaultArea.id.toString())
        }
      }
    } catch (error) {
      console.error('加载区域失败:', error)
      toast.error('加载区域失败')
    } finally {
      setLoading(false)
    }
  }, [selectedAreaId, selectedLocation, handleAreaSelect])

  // 加载位置数据
  const loadSpots = useCallback(async (roomId: string) => {
    if (!roomId) {
      setSpots([])
      return
    }

    try {
      const data = await apiRequest<Spot[]>(`/rooms/${roomId}/spots`)
      setSpots(data)
    } catch (error) {
      console.error('加载位置失败:', error)
      toast.error('加载位置失败')
    }
  }, [])

  // 区域选项
  const areaOptions = useMemo(
    () => [
      { value: '', label: '请选择区域' },
      ...areas.map(area => ({
        value: area.id.toString(),
        label: area.name,
      })),
    ],
    [areas]
  )

  // 房间选项
  const roomOptions = useMemo(() => {
    if (!selectedAreaId) return []

    return [
      { value: '', label: '请选择房间' },
      ...rooms.map(room => ({
        value: room.id.toString(),
        label: room.name,
      })),
    ]
  }, [selectedAreaId, rooms])

  // 位置选项
  const spotOptions = useMemo(() => {
    if (!selectedRoomId) return []

    return [
      { value: '', label: '请选择具体位置' },
      ...spots.map(spot => ({
        value: spot.id.toString(),
        label: spot.name,
      })),
    ]
  }, [selectedRoomId, spots])

  // 处理房间选择
  const handleRoomSelect = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId)
      setSelectedSpotId('')

      if (roomId) {
        const room = rooms.find(r => r.id.toString() === roomId)
        const area = areas.find(a => a.id.toString() === selectedAreaId)
        if (room && area) {
          onSelect('room', room.id, `${area.name} > ${room.name}`)
          loadSpots(roomId)
        }
      }
    },
    [rooms, areas, selectedAreaId, onSelect, loadSpots]
  )

  // 处理位置选择
  const handleSpotSelect = useCallback(
    (spotId: string) => {
      setSelectedSpotId(spotId)

      if (spotId) {
        const spot = spots.find(s => s.id.toString() === spotId)
        const room = rooms.find(r => r.id.toString() === selectedRoomId)
        const area = areas.find(a => a.id.toString() === selectedAreaId)
        if (spot && room && area) {
          onSelect('spot', spot.id, `${area.name} > ${room.name} > ${spot.name}`)
        }
      }
    },
    [spots, rooms, areas, selectedRoomId, selectedAreaId, onSelect]
  )

  // 处理创建区域
  const handleCreateArea = async (areaName: string) => {
    try {
      const response = await apiRequest<{ message: string; area: Area }>('/areas', 'POST', {
        name: areaName,
      })
      const newArea = response.area

      if (!newArea || !newArea.id) {
        throw new Error('创建区域失败：返回数据格式错误')
      }

      toast.success(`已创建区域 "${areaName}"`)
      setAreas(prev => [...prev, newArea])
      setSelectedAreaId(newArea.id.toString())
      onSelect('area', newArea.id, newArea.name)
    } catch (error) {
      console.error('创建区域失败:', error)
      toast.error('创建区域失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 处理创建房间
  const handleCreateRoom = async (roomName: string) => {
    if (!selectedAreaId) {
      toast.error('请先选择区域')
      return
    }

    try {
      const response = await apiRequest<{ message: string; room: Room }>('/rooms', 'POST', {
        name: roomName,
        area_id: Number(selectedAreaId),
      })
      const newRoom = response.room

      if (!newRoom || !newRoom.id) {
        throw new Error('创建房间失败：返回数据格式错误')
      }

      const area = areas.find(a => a.id.toString() === selectedAreaId)
      toast.success(`已创建房间 "${roomName}"`)
      setRooms(prev => [...prev, newRoom])
      setSelectedRoomId(newRoom.id.toString())

      if (area) {
        onSelect('room', newRoom.id, `${area.name} > ${newRoom.name}`)
      }
    } catch (error) {
      console.error('创建房间失败:', error)
      toast.error('创建房间失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 处理创建位置
  const handleCreateSpot = async (spotName: string) => {
    if (!selectedRoomId) {
      toast.error('请先选择房间')
      return
    }

    try {
      const response = await apiRequest<{ message: string; spot: Spot }>('/spots', 'POST', {
        name: spotName,
        room_id: Number(selectedRoomId),
      })
      const newSpot = response.spot

      if (!newSpot || !newSpot.id) {
        throw new Error('创建位置失败：返回数据格式错误')
      }

      const room = rooms.find(r => r.id.toString() === selectedRoomId)
      const area = areas.find(a => a.id.toString() === selectedAreaId)

      if (!room || !area) {
        throw new Error('无法找到关联的房间或区域')
      }

      // 更新 spots 列表
      setSpots(prev => [...prev, newSpot])

      // 设置选中状态
      const spotId = newSpot.id.toString()
      setSelectedSpotId(spotId)

      // 使用 setTimeout 确保状态更新后再触发选择，这样 handleSpotSelect 可以找到新位置
      setTimeout(() => {
        handleSpotSelect(spotId)
      }, 0)

      toast.success(`已创建位置 "${spotName}"`)
    } catch (error) {
      console.error('创建位置失败:', error)
      toast.error('创建位置失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 根据当前选择更新下拉框状态
  useEffect(() => {
    if (selectedLocation) {
      if (selectedLocation.type === 'area') {
        const newAreaId = selectedLocation.id.toString()
        if (selectedAreaId !== newAreaId) {
          setSelectedAreaId(newAreaId)
          setSelectedRoomId('')
          setSelectedSpotId('')
        }
      } else if (selectedLocation.type === 'room') {
        const room = rooms.find(r => r.id === selectedLocation.id)
        if (room?.area_id) {
          const newAreaId = room.area_id.toString()
          const newRoomId = selectedLocation.id.toString()
          if (selectedAreaId !== newAreaId || selectedRoomId !== newRoomId) {
            setSelectedAreaId(newAreaId)
            setSelectedRoomId(newRoomId)
            setSelectedSpotId('')
          }
        }
      } else if (selectedLocation.type === 'spot') {
        const spot = spots.find(s => s.id === selectedLocation.id)
        if (spot?.room_id) {
          const room = rooms.find(r => r.id === spot.room_id)
          if (room?.area_id) {
            const newAreaId = room.area_id.toString()
            const newRoomId = spot.room_id.toString()
            const newSpotId = selectedLocation.id.toString()
            if (
              selectedAreaId !== newAreaId ||
              selectedRoomId !== newRoomId ||
              selectedSpotId !== newSpotId
            ) {
              setSelectedAreaId(newAreaId)
              setSelectedRoomId(newRoomId)
              setSelectedSpotId(newSpotId)
            }
          }
        }
      }
    } else {
      if (selectedAreaId || selectedRoomId || selectedSpotId) {
        setSelectedAreaId('')
        setSelectedRoomId('')
        setSelectedSpotId('')
      }
    }
  }, [selectedLocation, rooms, spots, selectedAreaId, selectedRoomId, selectedSpotId])

  // 初始化加载区域数据
  useEffect(() => {
    loadAreas()
  }, [loadAreas]) // 只在组件挂载时执行一次

  // 当区域改变时加载房间
  useEffect(() => {
    if (selectedAreaId) {
      loadRooms(selectedAreaId)
    } else {
      setRooms([])
    }
  }, [selectedAreaId, loadRooms])

  // 当房间改变时加载位置
  useEffect(() => {
    if (selectedRoomId) {
      loadSpots(selectedRoomId)
    } else {
      setSpots([])
    }
  }, [selectedRoomId, loadSpots])

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
