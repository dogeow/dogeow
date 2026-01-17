import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableRow, TableCell } from '@/components/ui/table'
import { Folder, FolderOpen, Plus, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import type { Category } from '../../types'

interface CategoryParentRowProps {
  category: Category & { children?: Category[] }
  isExpanded: boolean
  isEditMode: boolean
  isEditing: boolean
  editingValue: string
  loading: boolean
  onToggle: () => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  onCreateChild: () => void
  onValueChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement>
}

export const CategoryParentRow = memo<CategoryParentRowProps>(
  ({
    category,
    isExpanded,
    isEditMode,
    isEditing,
    editingValue,
    loading,
    onToggle,
    onEdit,
    onSave,
    onCancel,
    onDelete,
    onCreateChild,
    onValueChange,
    onKeyDown,
    inputRef,
  }) => {
    return (
      <TableRow className="hover:bg-accent/30 transition-colors">
        <TableCell>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-accent/50 h-8 w-8 rounded-md p-0 transition-all duration-200"
              onClick={onToggle}
            >
              {isExpanded ? (
                <div className="flex items-center justify-center">
                  <ChevronDown className="text-primary h-4 w-4" />
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </div>
              )}
            </Button>
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <FolderOpen className="text-primary h-5 w-5" />
              ) : (
                <Folder className="text-muted-foreground h-5 w-5" />
              )}
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
                <div className="flex flex-1 items-center justify-between">
                  <div
                    className={`font-semibold transition-colors ${
                      isEditMode
                        ? 'text-foreground hover:text-primary cursor-pointer hover:underline'
                        : 'text-foreground'
                    }`}
                    onClick={isEditMode ? onEdit : undefined}
                  >
                    {category.name}
                  </div>
                  {isEditMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-primary/10 hover:text-primary hover:border-primary/20 h-7 border border-transparent px-3 transition-all duration-200"
                      onClick={onCreateChild}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      <span className="text-xs">子分类</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
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

CategoryParentRow.displayName = 'CategoryParentRow'
