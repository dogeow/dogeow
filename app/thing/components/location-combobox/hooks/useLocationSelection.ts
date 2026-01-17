import { useState, useEffect, useCallback, startTransition } from 'react'
import type { Area, Room, Spot } from '@/app/thing/types'

export type LocationSelection =
  | {
      type: 'area' | 'room' | 'spot'
      id: number
    }
  | undefined

/**
 * 管理位置选择状态
 */
export const useLocationSelection = (
  selectedLocation: LocationSelection | undefined,
  areas: Area[],
  rooms: Room[],
  spots: Spot[]
) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string>('')
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [selectedSpotId, setSelectedSpotId] = useState<string>('')

  // 根据当前选择更新下拉框状态
  useEffect(() => {
    startTransition(() => {
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
    })
  }, [selectedLocation, rooms, spots, selectedAreaId, selectedRoomId, selectedSpotId])

  const handleAreaChange = useCallback((areaId: string) => {
    setSelectedAreaId(areaId)
    setSelectedRoomId('')
    setSelectedSpotId('')
  }, [])

  const handleRoomChange = useCallback((roomId: string) => {
    setSelectedRoomId(roomId)
    setSelectedSpotId('')
  }, [])

  const handleSpotChange = useCallback((spotId: string) => {
    setSelectedSpotId(spotId)
  }, [])

  return {
    selectedAreaId,
    selectedRoomId,
    selectedSpotId,
    setSelectedAreaId,
    setSelectedRoomId,
    setSelectedSpotId,
    handleAreaChange,
    handleRoomChange,
    handleSpotChange,
  }
}
