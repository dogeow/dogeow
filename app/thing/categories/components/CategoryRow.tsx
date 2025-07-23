import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'
import { Trash2, Check, X } from 'lucide-react'
import { Category } from '../types'

interface CategoryRowProps {
  category: Category
  isEditing: boolean
  editingValue: string
  onEditingValueChange: (value: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  loading: boolean
}

const CategoryRow = memo(
  ({
    category,
    isEditing,
    editingValue,
    onEditingValueChange,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    onKeyDown,
    inputRef,
    loading,
  }: CategoryRowProps) => {
    return (
      <TableRow>
        <TableCell>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={editingValue}
                onChange={e => onEditingValueChange(e.target.value)}
                className="h-8"
                onKeyDown={onKeyDown}
                disabled={loading}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onSaveEdit}
                disabled={loading}
                className="h-8 w-8"
              >
                <Check className="h-4 w-4 text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancelEdit}
                disabled={loading}
                className="h-8 w-8"
              >
                <X className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="cursor-pointer font-medium hover:underline" onClick={onStartEdit}>
              {category.name}
            </div>
          )}
        </TableCell>
        <TableCell className="text-center">{category.items_count ?? 0}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={loading}
            className="h-8 w-8"
          >
            <Trash2 className="text-destructive h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>
    )
  }
)

CategoryRow.displayName = 'CategoryRow'

export default CategoryRow
