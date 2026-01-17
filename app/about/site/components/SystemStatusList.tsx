import React from 'react'
import { SystemStatusItem } from './SystemStatusItem'
import type { SystemStatus } from '../types'

interface SystemStatusListProps {
  statuses: SystemStatus[]
}

export const SystemStatusList: React.FC<SystemStatusListProps> = ({ statuses }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {statuses.map((status, index) => (
        <SystemStatusItem key={index} status={status} />
      ))}
    </div>
  )
}
