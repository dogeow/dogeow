import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { apiRequest } from '@/lib/api'
import type { Area, Room, Spot } from '@/app/thing/types'

export const useLocationData = () => {
  const [areas, setAreas] = useState<Area[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(false)

  // 初始化加载区域数据
  useEffect(() => {
    const loadAreas = async () => {
      try {
        setLoading(true)
        const response = await apiRequest<{ areas: Area[] }>('/areas')
        const areas = Array.isArray(response) ? response : response?.areas || []
        setAreas(Array.isArray(areas) ? areas : [])
      } catch (error) {
        console.error('加载区域失败:', error)
        toast.error('加载区域失败')
        setAreas([])
      } finally {
        setLoading(false)
      }
    }

    loadAreas()
  }, [])

  // 加载房间
  const loadRooms = useCallback(async (areaId: string) => {
    if (!areaId) {
      setRooms([])
      return
    }

    try {
      const response = await apiRequest<{ rooms: Room[] }>(`/areas/${areaId}/rooms`)
      const rooms = Array.isArray(response) ? response : response?.rooms || []
      setRooms(Array.isArray(rooms) ? rooms : [])
    } catch (error) {
      console.error('加载房间失败:', error)
      toast.error('加载房间失败')
      setRooms([])
    }
  }, [])

  // 加载位置
  const loadSpots = useCallback(async (roomId: string) => {
    if (!roomId) {
      setSpots([])
      return
    }

    try {
      const response = await apiRequest<{ spots: Spot[] }>(`/rooms/${roomId}/spots`)
      const spots = Array.isArray(response) ? response : response?.spots || []
      setSpots(Array.isArray(spots) ? spots : [])
    } catch (error) {
      console.error('加载位置失败:', error)
      toast.error('加载位置失败')
      setSpots([])
    }
  }, [])

  return {
    areas,
    rooms,
    spots,
    loading,
    setAreas,
    setRooms,
    setSpots,
    loadRooms,
    loadSpots,
  }
}
