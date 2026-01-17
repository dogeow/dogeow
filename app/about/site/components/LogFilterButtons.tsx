import React from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'

interface LogFilterButtonsProps {
  selectedType: string
  onTypeChange: (type: string) => void
}

export const LogFilterButtons: React.FC<LogFilterButtonsProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const { t } = useTranslation()

  const filterTypes = [
    { value: 'all', label: t('devlog.filter.all', '全部') },
    { value: 'feature', label: t('devlog.type.feature', '新功能') },
    { value: 'bugfix', label: t('devlog.type.bugfix', '修复') },
    { value: 'update', label: t('devlog.type.update', '更新') },
    { value: 'release', label: t('devlog.type.release', '发布') },
    { value: 'milestone', label: t('devlog.type.milestone', '里程碑') },
  ]

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-sm font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
        {t('devlog.filter.label', '筛选:')}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {filterTypes.map(({ value, label }) => (
          <Button
            key={value}
            variant="outline"
            size="sm"
            onClick={() => onTypeChange(value)}
            className={
              selectedType === value
                ? 'border-gray-900 bg-gray-900 text-white hover:bg-gray-800 dark:border-gray-100 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200'
                : 'border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
