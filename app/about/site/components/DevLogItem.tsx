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
    <div className="border-border/50 border-b last:border-b-0">
      <div
        className="hover:bg-muted/50 flex cursor-pointer flex-col gap-3 px-4 py-3 transition-colors sm:flex-row sm:items-center"
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
                  className="border-border bg-muted text-muted-foreground text-xs"
                >
                  v{log.version}
                </Badge>
              )}
            </div>
            <span className="text-foreground truncate text-sm font-medium">{log.title}</span>
          </div>

          <div className="text-muted-foreground flex items-center gap-2 text-xs whitespace-nowrap">
            <Calendar className="h-3 w-3" />
            <span>{log.date.toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className={`${config.bgColor} border-t px-4 py-3 ${config.borderColor}`}>
          <div className="text-muted-foreground mb-3 text-sm">{log.description}</div>

          <div className="text-muted-foreground flex flex-col gap-4 text-xs sm:flex-row sm:items-center">
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
                      className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
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
