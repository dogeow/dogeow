import type { Area, Room, Spot } from '../../../types'

/**
 * 构建位置路径字符串
 */
export const buildLocationPath = (
  area: Area | undefined,
  room: Room | undefined,
  spot: Spot | undefined
): string => {
  const parts: string[] = []
  if (area) parts.push(area.name)
  if (room) parts.push(room.name)
  if (spot) parts.push(spot.name)
  return parts.join(' > ')
}

/**
 * 根据选择构建路径
 */
export const buildPathFromSelection = (
  areaId: string,
  roomId: string,
  spotId: string,
  areas: Area[],
  rooms: Room[],
  spots: Spot[]
): string => {
  const area = areas.find(a => a.id.toString() === areaId)
  const room = rooms.find(r => r.id.toString() === roomId)
  const spot = spots.find(s => s.id.toString() === spotId)

  return buildLocationPath(area, room, spot)
}
