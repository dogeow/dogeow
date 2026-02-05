import React, { memo } from 'react'
import { TableCell, TableRow } from '@/components/ui/table'
import { CircleSlash } from 'lucide-react'

interface UncategorizedRowProps {
  count: number
  isEditMode: boolean
}

const UncategorizedRow = memo(({ count, isEditMode }: UncategorizedRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center">
            <CircleSlash className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="text-muted-foreground font-medium">未分类</div>
        </div>
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
