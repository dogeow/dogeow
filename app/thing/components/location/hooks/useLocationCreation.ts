import { useCallback } from 'react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import type { Area, Room, Spot } from '../../../types'

interface UseLocationCreationProps {
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  selectedAreaId: string
  selectedRoomId: string
  setAreas: React.Dispatch<React.SetStateAction<Area[]>>
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>
  setSpots: React.Dispatch<React.SetStateAction<Spot[]>>
  onSelect: (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => void
  setSelectedAreaId: (id: string) => void
  setSelectedRoomId: (id: string) => void
  setSelectedSpotId: (id: string) => void
}

export const useLocationCreation = ({
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
}: UseLocationCreationProps) => {
  const handleCreateArea = useCallback(
    async (areaName: string) => {
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
    },
    [setAreas, setSelectedAreaId, onSelect]
  )

  const handleCreateRoom = useCallback(
    async (roomName: string) => {
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
    },
    [selectedAreaId, areas, setRooms, setSelectedRoomId, onSelect]
  )

  const handleCreateSpot = useCallback(
    async (spotName: string) => {
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

        setSpots(prev => [...prev, newSpot])
        setSelectedSpotId(newSpot.id.toString())

        const fullPath = `${area.name} > ${room.name} > ${newSpot.name}`
        onSelect('spot', newSpot.id, fullPath)

        toast.success(`已创建位置 "${spotName}"`)
      } catch (error) {
        console.error('创建位置失败:', error)
        toast.error('创建位置失败：' + (error instanceof Error ? error.message : '未知错误'))
      }
    },
    [selectedRoomId, selectedAreaId, rooms, areas, setSpots, setSelectedSpotId, onSelect]
  )

  return {
    handleCreateArea,
    handleCreateRoom,
    handleCreateSpot,
  }
}
