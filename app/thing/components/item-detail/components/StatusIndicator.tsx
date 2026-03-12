'use client'

import { memo } from 'react'
import type { Item } from '@/app/thing/types'

interface StatusIndicatorProps {
  status: Item['status']
  className?: string
}

const getStatusIndicatorConfig = (status: Item['status']) => {
  switch (status) {
    case 'active':
      return {
        label: '使用中',
        className: 'bg-emerald-500',
      }
    case 'inactive':
      return {
        label: '闲置',
        className: 'bg-amber-500',
      }
    case 'expired':
      return {
        label: '已过期',
        className: 'bg-red-500',
      }
    default:
      return {
        label: status || '未知状态',
        className: 'bg-muted-foreground',
      }
  }
}

export const StatusIndicator = memo<StatusIndicatorProps>(({ status, className = '' }) => {
  const config = getStatusIndicatorConfig(status)

  return (
    <span
      className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${config.className} ${className}`.trim()}
      title={config.label}
      aria-label={config.label}
    />
  )
})

StatusIndicator.displayName = 'StatusIndicator'
