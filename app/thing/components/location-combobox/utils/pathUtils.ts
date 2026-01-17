import type { Area, Room, Spot } from '@/app/thing/types'

/**
 * 构建位置路径
 */
export const buildLocationPath = (
  type: 'area' | 'room' | 'spot',
  id: number,
  areas: Area[],
  rooms: Room[],
  spots: Spot[],
  selectedAreaId: string,
  selectedRoomId: string
): string => {
  if (type === 'area') {
    const area = areas.find(a => a.id === id)
    return area?.name || ''
  }

  if (type === 'room') {
    const room = rooms.find(r => r.id === id)
    const area = areas.find(a => a.id.toString() === selectedAreaId)
    if (room && area) {
      return `${area.name} > ${room.name}`
    }
    return ''
  }

  // spot
  const spot = spots.find(s => s.id === id)
  const room = rooms.find(r => r.id.toString() === selectedRoomId)
  const area = areas.find(a => a.id.toString() === selectedAreaId)
  if (spot && room && area) {
    return `${area.name} > ${room.name} > ${spot.name}`
  }
  return ''
}
