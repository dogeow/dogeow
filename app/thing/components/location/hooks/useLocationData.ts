import { useState, useEffect } from 'react'
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

  // 加载房间
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

  // 加载位置
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
