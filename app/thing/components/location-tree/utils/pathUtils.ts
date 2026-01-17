import type { Area, Room, Spot, LocationTreeResponse } from '@/app/thing/types'

/**
 * 构建位置路径
 */
export const buildPath = (
  type: 'area' | 'room' | 'spot',
  id: number,
  areas: LocationTreeResponse['areas'],
  rooms: Room[],
  spots: Spot[],
  t: (key: string, fallback?: string) => string
): string => {
  const pathParts: string[] = []

  if (type === 'area') {
    const area = areas.find((a: Area) => a.id === id)
    return area?.name || t('location.unknown_area')
  }

  if (type === 'room') {
    const room = rooms.find((r: Room) => r.id === id)
    if (!room) return t('location.unknown_room')

    const area = areas.find((a: Area) => a.id === room.area_id)
    pathParts.push(area?.name || t('location.unknown_area'), room.name)
    return pathParts.join(' / ')
  }

  // spot
  const spot = spots.find((s: Spot) => s.id === id)
  if (!spot) return t('location.unknown_spot')

  const room = rooms.find((r: Room) => r.id === spot.room_id)
  if (!room) {
    pathParts.push(t('location.unknown_room'), spot.name)
  } else {
    const area = areas.find((a: Area) => a.id === room.area_id)
    pathParts.push(area?.name || t('location.unknown_area'), room.name, spot.name)
  }

  return pathParts.join(' / ')
}
