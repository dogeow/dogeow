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
      <span className="text-foreground text-sm font-medium whitespace-nowrap">
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
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                : 'border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  )
}
