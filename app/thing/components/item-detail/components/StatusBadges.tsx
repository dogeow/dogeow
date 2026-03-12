import React, { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import type { Item } from '@/app/thing/types'

interface StatusBadgesProps {
  item: Item
}

export const StatusBadges = memo<StatusBadgesProps>(({ item }) => {
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="px-3 py-1 text-sm">
        {item.category?.name || '未分类'}
      </Badge>
    </div>
  )
})

StatusBadges.displayName = 'StatusBadges'
