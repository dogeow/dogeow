import React, { memo } from 'react'
import { InfoCard } from './InfoCard'
import { formatDate, formatDateTime, calculateDaysDifference } from '../utils/dateUtils'
import type { Item } from '@/app/thing/types'

interface TimeInfoProps {
  item: Item
}

export const TimeInfo = memo<TimeInfoProps>(({ item }) => {
  return (
    <div className="relative">
      <div className="space-y-6">
        {item.expiry_date && <InfoCard label="过期日期" value={formatDate(item.expiry_date)} />}

        <InfoCard label="创建时间" value={formatDateTime(item.created_at)} />
        <InfoCard label="更新时间" value={formatDateTime(item.updated_at)} />
      </div>

      {/* 天数差显示 */}
      {item.expiry_date && (
        <div className="absolute right-4" style={{ top: '23%' }}>
          <div className="bg-background rounded-full border px-3 py-2 shadow-md">
            <span className="text-foreground text-xs font-medium whitespace-nowrap">
              {calculateDaysDifference(item.created_at, item.expiry_date) || 0}天
            </span>
          </div>
        </div>
      )}

      <div className="absolute right-4" style={{ top: item.expiry_date ? '59%' : '36%' }}>
        <div className="bg-background rounded-full border px-3 py-2 shadow-md">
          <span className="text-foreground text-xs font-medium whitespace-nowrap">
            {calculateDaysDifference(item.created_at, item.updated_at) || 0}天
          </span>
        </div>
      </div>
    </div>
  )
})

TimeInfo.displayName = 'TimeInfo'
