import React, { memo } from 'react'
import { InfoCard } from './InfoCard'
import type { Item } from '@/app/thing/types'

interface LocationInfoProps {
  item: Item
}

export const LocationInfo = memo<LocationInfoProps>(({ item }) => {
  const hasLocation = item.area_id || item.room_id || item.spot_id

  if (!hasLocation) {
    return (
      <div className="bg-muted flex h-20 items-center justify-center rounded-lg">
        <p className="text-muted-foreground text-sm">未指定存放位置</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {item.spot?.room?.area?.name && <InfoCard label="区域" value={item.spot.room.area.name} />}
        {item.spot?.room?.name && <InfoCard label="房间" value={item.spot.room.name} />}
        {item.spot?.name && <InfoCard label="位置" value={item.spot.name} />}
      </div>
    </div>
  )
})

LocationInfo.displayName = 'LocationInfo'
