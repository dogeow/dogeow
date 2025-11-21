'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
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

const LocationComboboxSelectSimple: React.FC<LocationComboboxSelectProps> = ({
  onSelect,
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

  // 用于自动滚动的 ref
  const roomSelectRef = useRef<HTMLDivElement>(null)
  const spotSelectRef = useRef<HTMLDivElement>(null)

  // 初始化加载区域数据
  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoading(true)
        const data = await apiRequest<Area[]>('/areas')
        setAreas(data)
      } catch (error) {
        console.error('加载区域失败:', error)
        toast.error('加载区域失败')
      } finally {
        setLoading(false)
      }
    }

    loadAreas()
  }, [])

  // 当选择区域时加载房间
  useEffect(() => {
    const loadRooms = async (areaId: string) => {
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
    }

    if (selectedAreaId) {
      loadRooms(selectedAreaId)
    } else {
      setRooms([])
    }
  }, [selectedAreaId])

  // 当选择房间时加载位置
  useEffect(() => {
    const loadSpots = async (roomId: string) => {
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
    }

    if (selectedRoomId) {
      loadSpots(selectedRoomId)
    } else {
      setSpots([])
    }
  }, [selectedRoomId])

  // 当房间选择框出现时，自动滚动到该位置
  useEffect(() => {
    if (selectedAreaId && roomSelectRef.current) {
      // 使用 setTimeout 确保 DOM 已经更新，增加延迟以确保渲染完成
      setTimeout(() => {
        const element = roomSelectRef.current
        if (element) {
          // 尝试找到滚动容器（main-container）
          const scrollContainer = document.getElementById('main-container')
          const headerHeight = 50 // 头部高度
          const padding = 20 // 额外留出一些空间

          if (scrollContainer) {
            // 使用容器滚动
            const containerRect = scrollContainer.getBoundingClientRect()
            const elementRect = element.getBoundingClientRect()

            // 计算元素相对于容器的位置
            const elementTop = elementRect.top - containerRect.top + scrollContainer.scrollTop

            // 检查元素是否在容器视口中可见
            const isVisible =
              elementRect.top >= containerRect.top + headerHeight &&
              elementRect.bottom <= containerRect.bottom

            if (!isVisible) {
              // 滚动容器，使元素顶部可见（考虑头部高度）
              scrollContainer.scrollTo({
                top: elementTop - headerHeight - padding,
                behavior: 'smooth',
              })
            }
          } else {
            // 回退到窗口滚动
            const rect = element.getBoundingClientRect()
            const viewportHeight = window.innerHeight
            const isVisible = rect.top >= headerHeight && rect.bottom <= viewportHeight

            if (!isVisible) {
              const scrollY = window.scrollY + rect.top - headerHeight - padding
              window.scrollTo({
                top: Math.max(0, scrollY),
                behavior: 'smooth',
              })
            }
          }
        }
      }, 300)
    }
  }, [selectedAreaId])

  // 当位置选择框出现时，自动滚动到该位置
  useEffect(() => {
    if (selectedRoomId && spotSelectRef.current) {
      // 使用 setTimeout 确保 DOM 已经更新，增加延迟以确保渲染完成
      setTimeout(() => {
        const element = spotSelectRef.current
        if (element) {
          // 尝试找到滚动容器（main-container）
          const scrollContainer = document.getElementById('main-container')
          const headerHeight = 50 // 头部高度
          const padding = 20 // 额外留出一些空间

          if (scrollContainer) {
            // 使用容器滚动
            const containerRect = scrollContainer.getBoundingClientRect()
            const elementRect = element.getBoundingClientRect()

            // 计算元素相对于容器的位置
            const elementTop = elementRect.top - containerRect.top + scrollContainer.scrollTop

            // 检查元素是否在容器视口中可见
            const isVisible =
              elementRect.top >= containerRect.top + headerHeight &&
              elementRect.bottom <= containerRect.bottom

            if (!isVisible) {
              // 滚动容器，使元素顶部可见（考虑头部高度）
              scrollContainer.scrollTo({
                top: elementTop - headerHeight - padding,
                behavior: 'smooth',
              })
            }
          } else {
            // 回退到窗口滚动
            const rect = element.getBoundingClientRect()
            const viewportHeight = window.innerHeight
            const isVisible = rect.top >= headerHeight && rect.bottom <= viewportHeight

            if (!isVisible) {
              const scrollY = window.scrollY + rect.top - headerHeight - padding
              window.scrollTo({
                top: Math.max(0, scrollY),
                behavior: 'smooth',
              })
            }
          }
        }
      }, 300)
    }
  }, [selectedRoomId])

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
      // 取消选择区域时，清空所有位置信息
      onSelect('area', 0, '')
    }
  }

  // 处理房间选择
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId)
    setSelectedSpotId('')

    if (roomId) {
      const room = rooms.find(r => r.id.toString() === roomId)
      const area = areas.find(a => a.id.toString() === selectedAreaId)
      if (room && area) {
        onSelect('room', room.id, `${area.name} > ${room.name}`)
      }
    } else {
      // 取消选择房间时，只保留区域信息
      if (selectedAreaId) {
        const area = areas.find(a => a.id.toString() === selectedAreaId)
        if (area) {
          onSelect('area', area.id, area.name)
        }
      } else {
        // 如果没有区域，清空所有位置信息
        onSelect('area', 0, '')
      }
    }
  }

  // 处理位置选择
  const handleSpotSelect = (spotId: string) => {
    setSelectedSpotId(spotId)

    if (spotId) {
      const spot = spots.find(s => s.id.toString() === spotId)
      const room = rooms.find(r => r.id.toString() === selectedRoomId)
      const area = areas.find(a => a.id.toString() === selectedAreaId)
      if (spot && room && area) {
        onSelect('spot', spot.id, `${area.name} > ${room.name} > ${spot.name}`)
      }
    } else {
      // 取消选择位置时，只保留区域和房间信息
      if (selectedRoomId && selectedAreaId) {
        const room = rooms.find(r => r.id.toString() === selectedRoomId)
        const area = areas.find(a => a.id.toString() === selectedAreaId)
        if (room && area) {
          onSelect('room', room.id, `${area.name} > ${room.name}`)
        }
      } else if (selectedAreaId) {
        const area = areas.find(a => a.id.toString() === selectedAreaId)
        if (area) {
          onSelect('area', area.id, area.name)
        }
      } else {
        // 如果没有区域，清空所有位置信息
        onSelect('area', 0, '')
      }
    }
  }

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

      // 直接使用新创建的位置对象调用 onSelect，不依赖状态更新
      const fullPath = `${area.name} > ${room.name} > ${newSpot.name}`
      onSelect('spot', newSpot.id, fullPath)

      toast.success(`已创建位置 "${spotName}"`)
    } catch (error) {
      console.error('创建位置失败:', error)
      toast.error('创建位置失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 区域选择 */}
      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs font-normal">区域</Label>
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

      {/* 房间选择 - 预留空间，始终显示 */}
      <div ref={roomSelectRef} className="space-y-2">
        <Label className="text-muted-foreground text-xs font-normal">房间</Label>
        {selectedAreaId ? (
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
        ) : (
          <div className="border-input bg-muted/50 text-muted-foreground flex h-10 items-center rounded-md border px-3 text-sm">
            请先选择区域
          </div>
        )}
      </div>

      {/* 具体位置选择 - 预留空间，始终显示 */}
      <div ref={spotSelectRef} className="space-y-2">
        <Label className="text-muted-foreground text-xs font-normal">具体位置（可选）</Label>
        {selectedRoomId ? (
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
        ) : (
          <div className="border-input bg-muted/50 text-muted-foreground flex h-10 items-center rounded-md border px-3 text-sm">
            {selectedAreaId ? '请先选择房间' : '请先选择区域和房间'}
          </div>
        )}
      </div>

      {loading && <div className="text-muted-foreground text-sm">加载中...</div>}
    </div>
  )
}

export default LocationComboboxSelectSimple
