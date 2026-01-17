import React, { memo } from 'react'
import { Button } from '@/components/ui/button'

interface FilterActionsProps {
  hasActiveFilters: boolean
  onClearAll: () => void
  onApply: () => void
}

export const FilterActions = memo<FilterActionsProps>(
  ({ hasActiveFilters, onClearAll, onApply }) => {
    return (
      <div className="bg-background sticky bottom-0 z-10 mt-6 flex justify-between border-t py-3">
        <Button
          variant="outline"
          onClick={onClearAll}
          disabled={!hasActiveFilters}
          className="disabled:bg-background disabled:border-border disabled:text-muted-foreground disabled:opacity-50"
        >
          重置
        </Button>
        <Button
          onClick={onApply}
          disabled={!hasActiveFilters}
          className="disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50"
        >
          应用筛选
        </Button>
      </div>
    )
  }
)

FilterActions.displayName = 'FilterActions'
