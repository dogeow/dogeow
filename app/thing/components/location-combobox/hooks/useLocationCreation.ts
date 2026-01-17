import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import type { Area, Room, Spot } from '../../types'

/**
 * 管理位置的创建逻辑
 */
export const useLocationCreation = (
  areas: Area[],
  rooms: Room[],
  spots: Spot[],
  selectedAreaId: string,
  selectedRoomId: string,
  setAreas: (areas: Area[] | ((prev: Area[]) => Area[])) => void,
  setRooms: (rooms: Room[] | ((prev: Room[]) => Room[])) => void,
  setSpots: (spots: Spot[] | ((prev: Spot[]) => Spot[])) => void,
  setSelectedAreaId: (id: string) => void,
  setSelectedRoomId: (id: string) => void,
  setSelectedSpotId: (id: string) => void,
  handleSpotSelect: (spotId: string) => void
) => {
  const handleCreateArea = async (areaName: string): Promise<Area | null> => {
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
      return newArea
    } catch (error) {
      console.error('创建区域失败:', error)
      toast.error('创建区域失败：' + (error instanceof Error ? error.message : '未知错误'))
      return null
    }
  }

  const handleCreateRoom = async (roomName: string): Promise<Room | null> => {
    if (!selectedAreaId) {
      toast.error('请先选择区域')
      return null
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

      toast.success(`已创建房间 "${roomName}"`)
      setRooms(prev => [...prev, newRoom])
      setSelectedRoomId(newRoom.id.toString())
      return newRoom
    } catch (error) {
      console.error('创建房间失败:', error)
      toast.error('创建房间失败：' + (error instanceof Error ? error.message : '未知错误'))
      return null
    }
  }

  const handleCreateSpot = async (spotName: string): Promise<Spot | null> => {
    if (!selectedRoomId) {
      toast.error('请先选择房间')
      return null
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

      setSpots(prev => [...prev, newSpot])
      setSelectedSpotId(newSpot.id.toString())

      // 使用 setTimeout 确保状态更新后再触发选择
      setTimeout(() => {
        handleSpotSelect(newSpot.id.toString())
      }, 0)

      toast.success(`已创建位置 "${spotName}"`)
      return newSpot
    } catch (error) {
      console.error('创建位置失败:', error)
      toast.error('创建位置失败：' + (error instanceof Error ? error.message : '未知错误'))
      return null
    }
  }

  return {
    handleCreateArea,
    handleCreateRoom,
    handleCreateSpot,
  }
}
