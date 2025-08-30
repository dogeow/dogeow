'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import {
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { useUncategorizedCount } from '@/app/thing/hooks/useUncategorizedCount'
import { useCategories } from './hooks/useCategories'
import { useInlineEdit } from './hooks/useInlineEdit'
import CategorySpeedDial from './components/CategorySpeedDial'
import UncategorizedRow from './components/UncategorizedRow'
import EmptyState from './components/EmptyState'
import { Category } from '../types'
import { useItemStore } from '../stores/itemStore'
import { toast } from 'sonner'

// 扩展的分类类型，包含子分类
interface CategoryWithChildren extends Category {
  children?: Category[]
}

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

  // 将扁平的分类数据转换为树形结构
  const categoryTree = useMemo(() => {
    const parentCategories: CategoryWithChildren[] = []
    const childCategories: Category[] = []

    // 分离父分类和子分类
    categories.forEach(category => {
      if (category.parent_id) {
        childCategories.push(category)
      } else {
        parentCategories.push({
          ...category,
          children: [],
        })
      }
    })

    // 将子分类添加到对应的父分类下
    childCategories.forEach(child => {
      const parent = parentCategories.find(p => p.id === child.parent_id)
      if (parent) {
        parent.children!.push(child)
      }
    })

    return parentCategories
  }, [categories])

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
    }
  }, [editingId, editingValue, updateCategory, cancelEdit])

  // 处理取消编辑
  const handleCancelEdit = useCallback(() => {
    cancelEdit()
  }, [cancelEdit])

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

  // 渲染表格内容
  const renderTableContent = useMemo(() => {
    if (categories.length === 0) {
      return <EmptyState />
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 border-b-2">
            <TableHead className="text-foreground w-full font-semibold">分类名称</TableHead>
            <TableHead className="text-foreground text-center font-semibold">物品数量</TableHead>
            <TableHead className="text-foreground w-[100px] font-semibold">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <UncategorizedRow count={uncategorizedCount} />
          {categoryTree.map(parent => (
            <React.Fragment key={parent.id}>
              {/* 父分类行 */}
              <TableRow className="hover:bg-accent/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-accent/50 h-8 w-8 rounded-md p-0 transition-all duration-200"
                      onClick={() => toggleCategory(parent.id)}
                    >
                      {expandedCategories.has(parent.id) ? (
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
                      {expandedCategories.has(parent.id) ? (
                        <FolderOpen className="text-primary h-5 w-5" />
                      ) : (
                        <Folder className="text-muted-foreground h-5 w-5" />
                      )}
                      {isEditing(parent.id) ? (
                        <div className="flex flex-1 items-center gap-2">
                          <Input
                            ref={inputRef}
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            className="border-primary/50 focus:border-primary h-8"
                            onKeyDown={handleEditKeyDown}
                            disabled={loading}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveEdit}
                            disabled={loading}
                            className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancelEdit}
                            disabled={loading}
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="group flex flex-1 items-center justify-between">
                          <div
                            className="text-foreground hover:text-primary cursor-pointer font-semibold transition-colors hover:underline"
                            onClick={() => startEdit(parent.id, parent.name)}
                          >
                            {parent.name}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary hover:border-primary/20 h-7 border border-transparent px-3 opacity-60 transition-all duration-200 group-hover:opacity-100"
                            onClick={() => startCreateChild(parent.id)}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            <span className="text-xs">子分类</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">{parent.items_count ?? 0}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleConfirmDelete(parent.id)}
                    disabled={loading}
                    className="h-8 w-8"
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>

              {/* 子分类行 */}
              {expandedCategories.has(parent.id) && (
                <>
                  {parent.children?.map(child => (
                    <TableRow
                      key={child.id}
                      className="hover:bg-accent/20 border-l-primary/20 border-l-2 transition-colors"
                    >
                      <TableCell>
                        <div className="ml-8 flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center">
                            <div className="bg-primary/40 h-2 w-2 rounded-full"></div>
                          </div>
                          <FileText className="text-primary/60 h-4 w-4" />
                          {isEditing(child.id) ? (
                            <div className="flex flex-1 items-center gap-2">
                              <Input
                                ref={inputRef}
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                className="border-primary/50 focus:border-primary h-8"
                                onKeyDown={handleEditKeyDown}
                                disabled={loading}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleSaveEdit}
                                disabled={loading}
                                className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                disabled={loading}
                                className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="text-foreground hover:text-primary flex-1 cursor-pointer font-medium transition-colors hover:underline"
                              onClick={() => startEdit(child.id, child.name)}
                            >
                              {child.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{child.items_count ?? 0}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConfirmDelete(child.id)}
                          disabled={loading}
                          className="h-8 w-8"
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* 创建子分类行 */}
                  {creatingChildFor === parent.id && (
                    <TableRow className="bg-accent/10 border-l-primary/40 border-l-2">
                      <TableCell>
                        <div className="ml-8 flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center">
                            <div className="bg-primary/60 h-2 w-2 animate-pulse rounded-full"></div>
                          </div>
                          <FileText className="text-primary/60 h-4 w-4" />
                          <div className="flex flex-1 items-center gap-2">
                            <Input
                              value={newChildName}
                              onChange={e => setNewChildName(e.target.value)}
                              className="border-primary/50 focus:border-primary bg-background h-8"
                              placeholder="输入子分类名称"
                              onKeyDown={handleChildKeyDown}
                              disabled={creatingChild}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={saveChild}
                              disabled={creatingChild || !newChildName.trim()}
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={cancelCreateChild}
                              disabled={creatingChild}
                              className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">0</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    )
  }, [
    categories,
    categoryTree,
    uncategorizedCount,
    expandedCategories,
    isEditing,
    editingValue,
    setEditingValue,
    inputRef,
    handleEditKeyDown,
    loading,
    handleSaveEdit,
    handleCancelEdit,
    startEdit,
    toggleCategory,
    startCreateChild,
    handleConfirmDelete,
    creatingChildFor,
    newChildName,
    handleChildKeyDown,
    creatingChild,
    saveChild,
    cancelCreateChild,
  ])

  return (
    <div className="py-2 pb-24">
      <Card>
        {categoryTree.length > 0 && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">分类管理</h2>
                <span className="text-muted-foreground text-sm">共 {categories.length} 个分类</span>
              </div>
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
            </div>
          </CardHeader>
        )}
        <CardContent className="p-0">{renderTableContent}</CardContent>
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
