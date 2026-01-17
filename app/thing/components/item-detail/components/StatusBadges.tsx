import React, { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock } from 'lucide-react'
import { statusMap } from '@/app/thing/config/status'
import type { Item } from '@/app/thing/types'

interface StatusBadgesProps {
  item: Item
}

export const StatusBadges = memo<StatusBadgesProps>(({ item }) => {
  const status = statusMap[item.status as keyof typeof statusMap] || {
    label: item.status,
    variant: 'secondary',
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="px-3 py-1 text-sm">
        {item.category?.name || '未分类'}
      </Badge>
      <Badge
        className={status.variant === 'bg-green-500' ? status.variant : ''}
        variant={
          status.variant !== 'bg-green-500'
            ? (status.variant as 'outline' | 'destructive' | 'secondary' | 'default')
            : undefined
        }
      >
        {status.label}
      </Badge>
      <Badge variant={item.is_public ? 'default' : 'outline'} className="flex items-center gap-1">
        {item.is_public ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        {item.is_public ? '公开' : '私有'}
      </Badge>
    </div>
  )
})

StatusBadges.displayName = 'StatusBadges'
