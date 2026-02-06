'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { ChevronDown, ChevronRight, Edit2 } from 'lucide-react'
import { useUncategorizedCount } from '@/app/thing/hooks/useUncategorizedCount'
import { useCategories } from './hooks/useCategories'
import { useInlineEdit } from './hooks/useInlineEdit'
import { CategoryTable } from './components/CategoryTable'
import CategorySpeedDial from './components/CategorySpeedDial'
import { buildCategoryTree } from './utils/buildCategoryTree'
import { useItemStore } from '../stores/itemStore'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout'

export default function Categories() {
  const { categories, loading, updateCategory, deleteCategory, refreshCategories } = useCategories()
  const { createCategory } = useItemStore()
  const { count: uncategorizedCount } = useUncategorizedCount()
  const {
    editingId,
    editingValue,
    setEditingValue,
    inputRef,
    startEdit,
    cancelEdit,
    handleKeyDown,
    isEditing,
  } = useInlineEdit()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [creatingChildFor, setCreatingChildFor] = useState<number | null>(null)
  const [newChildName, setNewChildName] = useState('')
  const [creatingChild, setCreatingChild] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // 将扁平的分类数据转换为树形结构
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  // 初始化数据
  useEffect(() => {
    refreshCategories()
  }, [refreshCategories])

  // 初始展开所有分类
  useEffect(() => {
    if (categoryTree.length > 0) {
      setExpandedCategories(new Set(categoryTree.map(cat => cat.id)))
    }
  }, [categoryTree])

  // 处理保存编辑
  const handleSaveEdit = useCallback(async () => {
    if (!editingId) return

    const success = await updateCategory(editingId, editingValue)
    if (success) {
      cancelEdit()
      setEditingCategoryId(null)
    }
  }, [editingId, editingValue, updateCategory, cancelEdit])

  // 处理取消编辑
  const handleCancelEdit = useCallback(() => {
    cancelEdit()
    if (!creatingChildFor) {
      setEditingCategoryId(null)
    }
  }, [cancelEdit, creatingChildFor])

  // 处理键盘事件
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      handleKeyDown(e, handleSaveEdit, handleCancelEdit)
    },
    [handleKeyDown, handleSaveEdit, handleCancelEdit]
  )

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
      setEditingCategoryId(null)
    }
  }, [categoryToDelete, deleteCategory])

  // 展开/折叠分类
  const toggleCategory = useCallback((categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  // 全部展开
  const expandAll = useCallback(() => {
    setExpandedCategories(new Set(categoryTree.map(cat => cat.id)))
  }, [categoryTree])

  // 全部折叠
  const collapseAll = useCallback(() => {
    setExpandedCategories(new Set())
  }, [])

  // 判断是否全部展开
  const isAllExpanded = useMemo(() => {
    return categoryTree.length > 0 && categoryTree.every(cat => expandedCategories.has(cat.id))
  }, [categoryTree, expandedCategories])

  // 开始创建子分类
  const startCreateChild = useCallback((parentId: number) => {
    setCreatingChildFor(parentId)
    setNewChildName('')
    setExpandedCategories(prev => new Set(prev).add(parentId))
  }, [])

  // 取消创建子分类
  const cancelCreateChild = useCallback(() => {
    setCreatingChildFor(null)
    setNewChildName('')
  }, [])

  // 保存子分类
  const saveChild = useCallback(async () => {
    if (!creatingChildFor || !newChildName.trim()) return

    setCreatingChild(true)
    try {
      await createCategory({
        name: newChildName.trim(),
        parent_id: creatingChildFor,
      })

      toast.success(`已创建子分类 "${newChildName}"`)
      cancelCreateChild()
      await refreshCategories()
    } catch (error) {
      console.error('创建子分类失败:', error)
      toast.error('创建子分类失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setCreatingChild(false)
    }
  }, [creatingChildFor, newChildName, createCategory, cancelCreateChild, refreshCategories])

  // 切换编辑模式
  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => {
      const newMode = !prev
      if (!newMode) {
        setEditingCategoryId(null)
        cancelCreateChild()
        cancelEdit()
      }
      return newMode
    })
  }, [cancelCreateChild, cancelEdit])

  // 处理子分类输入的键盘事件
  const handleChildKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        saveChild()
      } else if (e.key === 'Escape') {
        cancelCreateChild()
      }
    },
    [saveChild, cancelCreateChild]
  )

  // 获取要删除的分类名称
  const categoryToDeleteName = useMemo(() => {
    return categoryToDelete ? categories.find(c => c.id === categoryToDelete)?.name || '' : ''
  }, [categoryToDelete, categories])

  return (
    <PageContainer className="pb-24">
      {categoryTree.length > 0 && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllExpanded ? collapseAll : expandAll}
              className="border-border/50 hover:border-border hover:bg-accent/50 flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200"
            >
              {isAllExpanded ? (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-sm font-medium">全部折叠</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  <span className="text-sm font-medium">全部展开</span>
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditMode}
                className="h-7 px-2 text-xs"
              >
                <Edit2 className="mr-1 h-3 w-3" />
                编辑
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleEditMode}
                className="h-7 px-2 text-xs"
              >
                完成
              </Button>
            )}
          </div>
        </div>
      )}
      <Card>
        <CardContent className="p-0">
          <CategoryTable
            categories={categories}
            categoryTree={categoryTree}
            uncategorizedCount={uncategorizedCount}
            isEditMode={isEditMode}
            expandedCategories={expandedCategories}
            isEditing={isEditing}
            editingValue={editingValue}
            loading={loading}
            creatingChildFor={creatingChildFor}
            newChildName={newChildName}
            creatingChild={creatingChild}
            onToggleCategory={toggleCategory}
            onStartEdit={startEdit}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onConfirmDelete={handleConfirmDelete}
            onStartCreateChild={startCreateChild}
            onCancelCreateChild={cancelCreateChild}
            onSaveChild={saveChild}
            onChildKeyDown={handleChildKeyDown}
            onValueChange={setEditingValue}
            onNewChildNameChange={setNewChildName}
            onEditKeyDown={handleEditKeyDown}
            inputRef={inputRef}
          />
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCategory}
        itemName={categoryToDeleteName}
      />

      <CategorySpeedDial onCategoryAdded={refreshCategories} />
    </PageContainer>
  )
}
