import React, { memo } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'

interface UncategorizedRowProps {
  count: number
}

const UncategorizedRow = memo(({ count }: UncategorizedRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <div className="text-muted-foreground font-medium">未分类</div>
      </TableCell>
      <TableCell className="text-center">{count}</TableCell>
      <TableCell>{/* 未分类项无法删除 */}</TableCell>
    </TableRow>
  )
})

UncategorizedRow.displayName = 'UncategorizedRow'

export default UncategorizedRow
