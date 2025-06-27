"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"
import { useUncategorizedCount } from '@/app/thing/hooks/useUncategorizedCount'
import { useCategories } from './hooks/useCategories'
import { useInlineEdit } from './hooks/useInlineEdit'
import CategorySpeedDial from './components/CategorySpeedDial'
import CategoryRow from './components/CategoryRow'
import UncategorizedRow from './components/UncategorizedRow'
import EmptyState from './components/EmptyState'

export default function Categories() {
  const { categories, loading, updateCategory, deleteCategory, refreshCategories } = useCategories()
  const { count: uncategorizedCount } = useUncategorizedCount()
  const {
    editingId,
    editingValue,
    setEditingValue,
    inputRef,
    startEdit,
    cancelEdit,
    handleKeyDown,
    isEditing
  } = useInlineEdit()
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)

  // 初始化数据
  useEffect(() => {
    refreshCategories()
  }, [refreshCategories])

  // 处理保存编辑
  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return
    
    const success = await updateCategory(editingId, editingValue)
    if (success) {
      cancelEdit()
    }
  }, [editingId, editingValue, updateCategory, cancelEdit])

  // 处理取消编辑
  const handleCancelEdit = useCallback(() => {
    cancelEdit()
  }, [cancelEdit])

  // 处理键盘事件
  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    handleKeyDown(e, handleSaveEdit, handleCancelEdit)
  }, [handleKeyDown, handleSaveEdit, handleCancelEdit])

  // 处理删除确认
  const handleConfirmDelete = useCallback((id: number) => {
    setCategoryToDelete(id)
    setDeleteDialogOpen(true)
  }, [])

  // 处理删除操作
  const handleDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return
    
    const success = await deleteCategory(categoryToDelete)
    if (success) {
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }, [categoryToDelete, deleteCategory])

  // 获取要删除的分类名称
  const categoryToDeleteName = useMemo(() => {
    return categoryToDelete 
      ? categories.find(c => c.id === categoryToDelete)?.name || '' 
      : ''
  }, [categoryToDelete, categories])

  // 渲染表格内容
  const renderTableContent = useMemo(() => {
    if (categories.length === 0) {
      return <EmptyState />
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-full">分类名称</TableHead>
            <TableHead className="text-center">物品数量</TableHead>
            <TableHead className="w-[50px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <UncategorizedRow count={uncategorizedCount} />
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              isEditing={isEditing(category.id)}
              editingValue={editingValue}
              onEditingValueChange={setEditingValue}
              onStartEdit={() => startEdit(category.id, category.name)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onDelete={() => handleConfirmDelete(category.id)}
              onKeyDown={handleEditKeyDown}
              inputRef={inputRef}
              loading={loading}
            />
          ))}
        </TableBody>
      </Table>
    )
  }, [
    categories,
    uncategorizedCount,
    isEditing,
    editingValue,
    setEditingValue,
    startEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleConfirmDelete,
    handleEditKeyDown,
    inputRef,
    loading
  ])

  return (
    <div className="py-2 pb-24">
      <Card>
        <CardContent className="p-0">
          {renderTableContent}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCategory}
        itemName={categoryToDeleteName}
      />

      <CategorySpeedDial onCategoryAdded={refreshCategories} />
    </div>
  )
}