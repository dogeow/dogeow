import { Spot } from '@/app/thing/types'
import { MapPin } from 'lucide-react'

interface LocationDisplayProps {
  spot?: Spot | null
}

export function LocationDisplay({ spot }: LocationDisplayProps) {
  if (!spot) {
    return null
  }

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
    return null
  }

  const fullLocationPath = pathParts.join(' > ')

  return (
    <div className="text-muted-foreground flex items-center text-sm">
      <MapPin className="mr-2 h-4 w-4" />
      <span>{fullLocationPath}</span>
    </div>
  )
}
