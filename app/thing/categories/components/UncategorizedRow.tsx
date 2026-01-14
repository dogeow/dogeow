import React, { memo } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'

interface UncategorizedRowProps {
  count: number
  isEditMode: boolean
}

const UncategorizedRow = memo(({ count, isEditMode }: UncategorizedRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <div className="text-muted-foreground font-medium">未分类</div>
      </TableCell>
      {isEditMode ? (
        <TableCell className="text-center">{/* 未分类项无法删除 */}</TableCell>
      ) : (
        <TableCell className="text-center">{count}</TableCell>
      )}
    </TableRow>
  )
})

UncategorizedRow.displayName = 'UncategorizedRow'

export default UncategorizedRow
