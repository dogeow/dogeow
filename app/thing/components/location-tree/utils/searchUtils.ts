import type { LocationTreeResponse, Room, Spot } from '../../types'

/**
 * 搜索匹配函数
 */
export const matchesSearch = (text: string, searchTerm: string): boolean => {
  return text.toLowerCase().includes(searchTerm.toLowerCase())
}

/**
 * 构建区域到房间、房间到位置的映射
 */
export const buildLocationMaps = (rooms: Room[], spots: Spot[]) => {
  const areaRoomsMap = new Map<number, Room[]>()
  const roomSpotsMap = new Map<number, Spot[]>()

  rooms.forEach(room => {
    if (!areaRoomsMap.has(room.area_id)) {
      areaRoomsMap.set(room.area_id, [])
    }
    areaRoomsMap.get(room.area_id)!.push(room)
  })

  spots.forEach(spot => {
    if (!roomSpotsMap.has(spot.room_id)) {
      roomSpotsMap.set(spot.room_id, [])
    }
    roomSpotsMap.get(spot.room_id)!.push(spot)
  })

  return { areaRoomsMap, roomSpotsMap }
}

/**
 * 搜索过滤逻辑
 */
export const filterSearchResults = (
  areas: LocationTreeResponse['areas'],
  rooms: Room[],
  spots: Spot[],
  searchTerm: string,
  filterType: 'area' | 'room' | null,
  expandedAreas: Set<number>,
  expandedRooms: Set<number>,
  isExpanded: boolean
) => {
  if (!searchTerm) {
    return {
      filteredAreas: filterType === 'room' ? [] : areas,
      filteredRooms: rooms,
      filteredSpots: filterType === 'area' ? [] : spots,
      visibleAreaIds: isExpanded ? areas.map(area => area.id) : Array.from(expandedAreas),
      visibleRoomIds: isExpanded ? rooms.map(room => room.id) : Array.from(expandedRooms),
    }
  }

  const visibleAreaIds = new Set<number>()
  const visibleRoomIds = new Set<number>()
  const { areaRoomsMap, roomSpotsMap } = buildLocationMaps(rooms, spots)

  // 查找匹配的区域
  const matchingAreas = areas.filter(area => matchesSearch(area.name, searchTerm))
  matchingAreas.forEach(area => visibleAreaIds.add(area.id))

  // 查找匹配的房间及其所属区域
  const matchingRooms = rooms.filter(room => matchesSearch(room.name, searchTerm))
  matchingRooms.forEach(room => {
    visibleAreaIds.add(room.area_id)
    visibleRoomIds.add(room.id)
  })

  // 查找匹配的位置及其所属房间和区域
  const matchingSpots = spots.filter(spot => matchesSearch(spot.name, searchTerm))
  matchingSpots.forEach(spot => {
    const room = rooms.find(r => r.id === spot.room_id)
    if (room) {
      visibleAreaIds.add(room.area_id)
      visibleRoomIds.add(room.id)
    }
  })

  // 为包含匹配子项的父项添加可见性
  areas.forEach(area => {
    const areaRooms = areaRoomsMap.get(area.id) || []
    const hasMatchingChild = areaRooms.some(room => {
      if (matchesSearch(room.name, searchTerm)) return true
      const roomSpots = roomSpotsMap.get(room.id) || []
      return roomSpots.some(spot => matchesSearch(spot.name, searchTerm))
    })

    if (hasMatchingChild) {
      visibleAreaIds.add(area.id)
      areaRooms.forEach(room => {
        const roomSpots = roomSpotsMap.get(room.id) || []
        if (
          matchesSearch(room.name, searchTerm) ||
          roomSpots.some(spot => matchesSearch(spot.name, searchTerm))
        ) {
          visibleRoomIds.add(room.id)
        }
      })
    }
  })

  return {
    filteredAreas: filterType === 'room' ? [] : areas.filter(area => visibleAreaIds.has(area.id)),
    filteredRooms: rooms.filter(room => visibleRoomIds.has(room.id)),
    filteredSpots:
      filterType === 'area'
        ? []
        : spots.filter(spot => {
            const room = rooms.find(r => r.id === spot.room_id)
            return room && visibleAreaIds.has(room.area_id) && visibleRoomIds.has(room.id)
          }),
    visibleAreaIds: Array.from(visibleAreaIds),
    visibleRoomIds: Array.from(visibleRoomIds),
  }
}
