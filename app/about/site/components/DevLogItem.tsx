import React, { useState } from 'react'
import { Calendar, Tag, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getTypeConfig } from '../utils/typeConfig'
import type { DevLogEntry } from '../types'

interface DevLogItemProps {
  log: DevLogEntry
  t: (key: string, fallback?: string) => string
}

export const DevLogItem: React.FC<DevLogItemProps> = ({ log, t }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = getTypeConfig(log.type, t)

  return (
    <div className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
      <div
        className="flex cursor-pointer flex-col gap-3 px-4 py-3 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center dark:hover:bg-gray-900/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {config.icon}

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={`text-xs font-medium ${config.badgeColor}`}>
                {config.label}
              </Badge>
              {log.version && (
                <Badge
                  variant="outline"
                  className="border-gray-300 bg-gray-100 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  v{log.version}
                </Badge>
              )}
            </div>
            <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
              {log.title}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{log.date.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`${config.bgColor} border-t px-4 py-3 ${config.borderColor}`}>
          <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">{log.description}</div>

          <div className="flex flex-col gap-4 text-xs text-gray-600 sm:flex-row sm:items-center dark:text-gray-400">
            {log.author && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{log.author}</span>
              </div>
            )}

            {log.tags && log.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                <div className="flex flex-wrap gap-1">
                  {log.tags.map(tag => (
                    <span
                      key={tag}
                      className="rounded bg-gray-200 px-1.5 py-0.5 text-xs dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
