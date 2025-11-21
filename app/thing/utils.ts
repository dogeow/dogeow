import { Spot } from '@/app/thing/types'

export const getLocationPath = (spot?: Spot | null): string => {
  if (!spot) return 'No location specified'

  // 构建三层位置路径：区域 > 房间 > 位置
  const pathParts: string[] = []

  if (spot.room?.area?.name) {
    pathParts.push(spot.room.area.name)
  }

  if (spot.room?.name) {
    pathParts.push(spot.room.name)
  }

  if (spot.name) {
    pathParts.push(spot.name)
  }

  if (pathParts.length === 0) {
    return 'No location specified'
  }

  return pathParts.join(' > ')
}
