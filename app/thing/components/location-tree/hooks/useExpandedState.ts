import { useState, useEffect, useRef } from 'react'
import type { LocationTreeResponse, Room, Spot } from '../../../types'
import type { LocationSelection } from '../../../types'

/**
 * 管理展开/折叠状态
 */
export const useExpandedState = (
  isExpanded: boolean,
  selectedLocation: LocationSelection | undefined,
  areas: LocationTreeResponse['areas'],
  rooms: Room[],
  spots: Spot[]
) => {
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set())
  const [expandedRooms, setExpandedRooms] = useState<Set<number>>(new Set())

  const prevIsExpandedRef = useRef(isExpanded)
  const prevSelectionRef = useRef<LocationSelection>(selectedLocation)

  // 优化初始展开逻辑
  useEffect(() => {
    if (!areas.length || !rooms.length) return

    const isExpandedChanged = prevIsExpandedRef.current !== isExpanded
    prevIsExpandedRef.current = isExpanded

    if (isExpandedChanged) {
      const timeoutId = setTimeout(() => {
        if (isExpanded) {
          setExpandedAreas(new Set(areas.map(area => area.id)))
          setExpandedRooms(new Set(rooms.map(room => room.id)))
        } else {
          setExpandedAreas(new Set())
          setExpandedRooms(new Set())
        }
      }, 0)

      return () => clearTimeout(timeoutId)
    }
  }, [isExpanded, areas, rooms])

  // 优化选中位置的展开逻辑
  useEffect(() => {
    if (!selectedLocation || !areas.length || !rooms.length) return

    const prevSelection = prevSelectionRef.current
    const hasSelectionChanged =
      !prevSelection ||
      prevSelection.type !== selectedLocation.type ||
      prevSelection.id !== selectedLocation.id

    if (!hasSelectionChanged) return

    prevSelectionRef.current = selectedLocation

    const timeoutId = setTimeout(() => {
      setExpandedAreas(prev => {
        const newSet = new Set(prev)
        let changed = false

        if (selectedLocation.type === 'room' || selectedLocation.type === 'spot') {
          let targetRoom: Room | undefined

          if (selectedLocation.type === 'room') {
            targetRoom = rooms.find(r => r.id === selectedLocation.id)
          } else {
            // spot type: find spot first, then find room by spot.room_id
            const spot = spots.find(s => s.id === selectedLocation.id)
            if (spot) {
              targetRoom = rooms.find(r => r.id === spot.room_id)
            }
          }

          if (targetRoom?.area_id && !newSet.has(targetRoom.area_id)) {
            newSet.add(targetRoom.area_id)
            changed = true
          }
        }

        return changed ? newSet : prev
      })

      if (selectedLocation.type === 'spot') {
        const spot = spots.find(s => s.id === selectedLocation.id)
        if (spot?.room_id) {
          setExpandedRooms(prev => {
            const newSet = new Set(prev)
            if (!newSet.has(spot.room_id)) {
              newSet.add(spot.room_id)
              return newSet
            }
            return prev
          })
        }
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [selectedLocation, areas, rooms, spots])

  const toggleArea = (areaId: number) => {
    setExpandedAreas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(areaId)) {
        newSet.delete(areaId)
      } else {
        newSet.add(areaId)
      }
      return newSet
    })
  }

  const toggleRoom = (roomId: number) => {
    setExpandedRooms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roomId)) {
        newSet.delete(roomId)
      } else {
        newSet.add(roomId)
      }
      return newSet
    })
  }

  return {
    expandedAreas,
    expandedRooms,
    toggleArea,
    toggleRoom,
  }
}
