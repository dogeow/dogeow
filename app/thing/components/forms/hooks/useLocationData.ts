import { useState, useCallback, useEffect, startTransition } from 'react'
import { apiRequest } from '@/lib/api'
import type { Location } from './formConstants'

export function useLocationData(isCreateMode: boolean) {
  const [areas, setAreas] = useState<Location[]>([])
  const [rooms, setRooms] = useState<Location[]>([])
  const [spots, setSpots] = useState<Location[]>([])

  const loadAreas = useCallback(async () => {
    if (!isCreateMode) return []
    try {
      const data = await apiRequest<Location[]>('/areas')
      setAreas(data)
      return data
    } catch (error) {
      console.error('加载区域失败', error)
      return []
    }
  }, [isCreateMode])

  const loadRooms = useCallback(
    async (areaId: string) => {
      if (!isCreateMode || !areaId) {
        setRooms([])
        return []
      }

      try {
        const data = await apiRequest<Location[]>(`/areas/${areaId}/rooms`)
        setRooms(data)
        return data
      } catch (error) {
        console.error('加载房间失败', error)
        return []
      }
    },
    [isCreateMode]
  )

  const loadSpots = useCallback(
    async (roomId: string) => {
      if (!isCreateMode || !roomId) {
        setSpots([])
        return []
      }

      try {
        const data = await apiRequest<Location[]>(`/rooms/${roomId}/spots`)
        setSpots(data)
        return data
      } catch (error) {
        console.error('加载位置失败', error)
        return []
      }
    },
    [isCreateMode]
  )

  useEffect(() => {
    if (isCreateMode) {
      startTransition(() => {
        loadAreas()
      })
    }
  }, [isCreateMode, loadAreas])

  return {
    areas,
    rooms,
    spots,
    loadAreas,
    loadRooms,
    loadSpots,
  }
}
