import React from 'react'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getStatusConfig } from '../utils/statusConfig'
import type { SystemStatus } from '../types'

interface SystemStatusItemProps {
  status: SystemStatus
}

export const SystemStatusItem: React.FC<SystemStatusItemProps> = ({ status }) => {
  const config = getStatusConfig(status.status)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {status.icon}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{status.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{status.description}</p>
            {status.details && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{status.details}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={`text-xs font-medium ${config.badgeColor}`}>
            {config.label}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{status.lastCheck.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
