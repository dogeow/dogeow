import React, { memo } from 'react'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CategoryParentRow } from './CategoryParentRow'
import { CategoryChildRow } from './CategoryChildRow'
import { CreateChildRow } from './CreateChildRow'
import UncategorizedRow from './UncategorizedRow'
import EmptyState from './EmptyState'
import { buildCategoryTree, type CategoryWithChildren } from '../utils/buildCategoryTree'
import type { Category } from '../../types'

interface CategoryTableProps {
  categories: Category[]
  categoryTree: CategoryWithChildren[]
  uncategorizedCount: number
  isEditMode: boolean
  expandedCategories: Set<number>
  isEditing: (id: number) => boolean
  editingValue: string
  loading: boolean
  creatingChildFor: number | null
  newChildName: string
  creatingChild: boolean
  onToggleCategory: (id: number) => void
  onStartEdit: (id: number, name: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onConfirmDelete: (id: number) => void
  onStartCreateChild: (id: number) => void
  onCancelCreateChild: () => void
  onSaveChild: () => void
  onChildKeyDown: (e: React.KeyboardEvent) => void
  onValueChange: (value: string) => void
  onNewChildNameChange: (value: string) => void
  onEditKeyDown: (e: React.KeyboardEvent) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

export const CategoryTable = memo<CategoryTableProps>(
  ({
    categories,
    categoryTree,
    uncategorizedCount,
    isEditMode,
    expandedCategories,
    isEditing,
    editingValue,
    loading,
    creatingChildFor,
    newChildName,
    creatingChild,
    onToggleCategory,
    onStartEdit,
    onSaveEdit,
    onCancelEdit,
    onConfirmDelete,
    onStartCreateChild,
    onCancelCreateChild,
    onSaveChild,
    onChildKeyDown,
    onValueChange,
    onNewChildNameChange,
    onEditKeyDown,
    inputRef,
  }) => {
    if (categories.length === 0) {
      return <EmptyState />
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 border-b-2">
            <TableHead className="text-foreground w-full font-semibold">分类名称</TableHead>
            {isEditMode ? (
              <TableHead className="text-foreground text-center font-semibold">操作</TableHead>
            ) : (
              <TableHead className="text-foreground text-center font-semibold">物品数量</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          <UncategorizedRow count={uncategorizedCount} isEditMode={isEditMode} />
          {categoryTree.map(parent => (
            <React.Fragment key={parent.id}>
              {/* 父分类行 */}
              <CategoryParentRow
                category={parent}
                isExpanded={expandedCategories.has(parent.id)}
                isEditMode={isEditMode}
                isEditing={isEditing(parent.id)}
                editingValue={editingValue}
                loading={loading}
                onToggle={() => onToggleCategory(parent.id)}
                onEdit={() => onStartEdit(parent.id, parent.name)}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
                onDelete={() => onConfirmDelete(parent.id)}
                onCreateChild={() => {
                  onStartCreateChild(parent.id)
                  if (parent.children && parent.children.length > 0) {
                    // 自动展开（通过外部状态管理）
                  }
                }}
                onValueChange={onValueChange}
                onKeyDown={onEditKeyDown}
                inputRef={inputRef}
              />

              {/* 子分类行 */}
              {expandedCategories.has(parent.id) && (
                <>
                  {parent.children?.map(child => (
                    <CategoryChildRow
                      key={child.id}
                      category={child}
                      isEditMode={isEditMode}
                      isEditing={isEditing(child.id)}
                      editingValue={editingValue}
                      loading={loading}
                      onEdit={() => onStartEdit(child.id, child.name)}
                      onSave={onSaveEdit}
                      onCancel={onCancelEdit}
                      onDelete={() => onConfirmDelete(child.id)}
                      onValueChange={onValueChange}
                      onKeyDown={onEditKeyDown}
                      inputRef={inputRef}
                    />
                  ))}

                  {/* 创建子分类行 */}
                  {creatingChildFor === parent.id && (
                    <CreateChildRow
                      name={newChildName}
                      loading={creatingChild}
                      onNameChange={onNewChildNameChange}
                      onSave={onSaveChild}
                      onCancel={onCancelCreateChild}
                      onKeyDown={onChildKeyDown}
                    />
                  )}
                </>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    )
  }
)

CategoryTable.displayName = 'CategoryTable'
