import type { Location, LocationType } from '../formConstants'
import type { LocationSelection } from '../../LocationComboboxSelectSimple'

export function updateLocationPath(
  areaId: string | undefined,
  roomId: string | undefined,
  spotId: string | undefined,
  areas: Location[],
  rooms: Location[],
  spots: Location[]
): { path: string; selectedLocation: LocationSelection } {
  let path = ''
  let selectedLocation: LocationSelection = undefined

  if (areaId && areas.length > 0) {
    const area = areas.find(a => a.id.toString() === areaId)
    if (area) {
      path = area.name

      if (roomId && rooms.length > 0) {
        const room = rooms.find(r => r.id.toString() === roomId)
        if (room) {
          path += ` > ${room.name}`

          if (spotId && spots.length > 0) {
            const spot = spots.find(s => s.id.toString() === spotId)
            if (spot) {
              path += ` > ${spot.name}`
              selectedLocation = { type: 'spot', id: Number(spotId) }
            }
          } else if (roomId) {
            selectedLocation = { type: 'room', id: Number(roomId) }
          }
        }
      } else if (areaId) {
        selectedLocation = { type: 'area', id: Number(areaId) }
      }
    }
  }

  if (!path && !areaId && !roomId && !spotId) {
    return { path: '', selectedLocation: undefined }
  }

  return { path, selectedLocation }
}

export function handleLocationSelectLogic(
  type: LocationType,
  id: number,
  fullPath: string | undefined,
  rooms: Location[],
  spots: Location[],
  getCurrentValue: (field: string) => unknown,
  setCurrentValue: (field: string, value: unknown) => void,
  loadSpots: (roomId: string) => Promise<Location[]>
): Promise<void> {
  return new Promise(async resolve => {
    // 处理取消选择（id 为 0 或 fullPath 为空）
    if (id === 0 || !fullPath) {
      setCurrentValue('area_id', '')
      setCurrentValue('room_id', '')
      setCurrentValue('spot_id', '')
      resolve()
      return
    }

    if (type === 'area') {
      setCurrentValue('area_id', id.toString())
      setCurrentValue('room_id', '')
      setCurrentValue('spot_id', '')
    } else if (type === 'room') {
      setCurrentValue('room_id', id.toString())
      setCurrentValue('spot_id', '')

      const room = rooms.find(r => r.id === id)
      if (room?.area_id) {
        setCurrentValue('area_id', room.area_id.toString())
      }
    } else if (type === 'spot') {
      setCurrentValue('spot_id', id.toString())

      let spot = spots.find(s => s.id === id)

      // 如果找不到 spot（可能是刚创建的），刷新 spots 列表
      if (!spot) {
        const currentRoomId = getCurrentValue('room_id')
        if (currentRoomId) {
          const refreshedSpots = await loadSpots(String(currentRoomId))
          spot = refreshedSpots.find(s => s.id === id)
        }
      }

      if (spot?.room_id) {
        setCurrentValue('room_id', spot.room_id.toString())

        const room = rooms.find(r => r.id === spot.room_id)
        if (room?.area_id) {
          setCurrentValue('area_id', room.area_id.toString())
        }
      } else {
        // 如果还是找不到，使用当前已知的 room_id 和 area_id
        const currentRoomId = getCurrentValue('room_id')
        const currentAreaId = getCurrentValue('area_id')
        if (currentRoomId) {
          setCurrentValue('room_id', currentRoomId)
        }
        if (currentAreaId) {
          setCurrentValue('area_id', currentAreaId)
        }
      }
    }

    resolve()
  })
}
