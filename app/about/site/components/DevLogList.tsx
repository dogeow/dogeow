import React from 'react'
import { BookOpen } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { DevLogItem } from './DevLogItem'
import type { DevLogEntry } from '../types'

interface DevLogListProps {
  logs: DevLogEntry[]
}

export const DevLogList: React.FC<DevLogListProps> = ({ logs }) => {
  const { t } = useTranslation()

  if (logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <BookOpen className="mr-2 h-8 w-8" />
        {t('devlog.no_results', '没有找到符合条件的日志')}
      </div>
    )
  }

  return (
    <>
      {logs.map(log => (
        <DevLogItem key={log.id} log={log} t={t} />
      ))}
    </>
  )
}
