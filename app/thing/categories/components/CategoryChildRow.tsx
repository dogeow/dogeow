import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableRow, TableCell } from '@/components/ui/table'
import { FileText, Trash2, Check, X } from 'lucide-react'
import type { Category } from '../../types'

interface CategoryChildRowProps {
  category: Category
  isEditMode: boolean
  isEditing: boolean
  editingValue: string
  loading: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export const CategoryChildRow = memo<CategoryChildRowProps>(
  ({
    category,
    isEditMode,
    isEditing,
    editingValue,
    loading,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onValueChange,
    onKeyDown,
    inputRef,
  }) => {
    return (
      <TableRow className="hover:bg-accent/20 border-l-primary/20 border-l-2 transition-colors">
        <TableCell>
          <div className="ml-8 flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center">
              <div className="bg-primary/40 h-2 w-2 rounded-full"></div>
            </div>
            <FileText className="text-primary/60 h-4 w-4" />
            {isEditing ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  ref={inputRef}
                  value={editingValue}
                  onChange={e => onValueChange(e.target.value)}
                  className="border-primary/50 focus:border-primary h-8"
                  onKeyDown={onKeyDown}
                  disabled={loading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onSave}
                  disabled={loading}
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
            ) : (
              <div
                className={`flex-1 font-medium transition-colors ${
                  isEditMode
                    ? 'text-foreground hover:text-primary cursor-pointer hover:underline'
                    : 'text-foreground'
                }`}
                onClick={isEditMode ? onEdit : undefined}
              >
                {category.name}
              </div>
            )}
          </div>
        </TableCell>
        {isEditMode ? (
          <TableCell className="text-center">
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
        ) : (
          <TableCell className="text-center">{category.items_count ?? 0}</TableCell>
        )}
      </TableRow>
    )
  }
)

CategoryChildRow.displayName = 'CategoryChildRow'
