import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableRow, TableCell } from '@/components/ui/table'
import { FileText, Check, X } from 'lucide-react'

interface CreateChildRowProps {
  name: string
  loading: boolean
  onNameChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export const CreateChildRow = memo<CreateChildRowProps>(
  ({ name, loading, onNameChange, onSave, onCancel, onKeyDown }) => {
    return (
      <TableRow className="bg-accent/10 border-l-primary/40 border-l-2">
        <TableCell>
          <div className="ml-8 flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center">
              <div className="bg-primary/60 h-2 w-2 animate-pulse rounded-full"></div>
            </div>
            <FileText className="text-primary/60 h-4 w-4" />
            <div className="flex flex-1 items-center gap-2">
              <Input
                value={name}
                onChange={e => onNameChange(e.target.value)}
                className="border-primary/50 focus:border-primary bg-background h-8"
                placeholder="输入子分类名称"
                onKeyDown={onKeyDown}
                disabled={loading}
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onSave}
                disabled={loading || !name.trim()}
                className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                disabled={loading}
                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center"></TableCell>
      </TableRow>
    )
  }
)

CreateChildRow.displayName = 'CreateChildRow'
