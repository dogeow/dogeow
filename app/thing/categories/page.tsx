"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"
import { Folder, FolderOpen, Tag, Plus, Trash2, Check, X } from "lucide-react"
import { useUncategorizedCount } from '@/app/thing/hooks/useUncategorizedCount'
import { useCategories } from './hooks/useCategories'
import { useInlineEdit } from './hooks/useInlineEdit'
import CategorySpeedDial from './components/CategorySpeedDial'
import UncategorizedRow from './components/UncategorizedRow'
import EmptyState from './components/EmptyState'
import { Category } from '../types'
import { useItemStore } from '../stores/itemStore'
import { toast } from "sonner"

// 扩展的分类类型，包含子分类
interface CategoryWithChildren extends Category {
  children?: Category[];
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
    isEditing
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
          children: []
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
        parent_id: creatingChildFor
      })
      
      toast.success(`已创建子分类 "${newChildName}"`)
      cancelCreateChild()
      await refreshCategories()
    } catch (error) {
      console.error("创建子分类失败:", error)
      toast.error("创建子分类失败：" + (error instanceof Error ? error.message : "未知错误"))
    } finally {
      setCreatingChild(false)
    }
  }, [creatingChildFor, newChildName, createCategory, cancelCreateChild, refreshCategories])

  // 处理子分类输入的键盘事件
  const handleChildKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveChild()
    } else if (e.key === 'Escape') {
      cancelCreateChild()
    }
  }, [saveChild, cancelCreateChild])

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
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <UncategorizedRow count={uncategorizedCount} />
          {categoryTree.map((parent) => (
            <React.Fragment key={parent.id}>
              {/* 父分类行 */}
              <TableRow>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleCategory(parent.id)}
                    >
                      {expandedCategories.has(parent.id) ? (
                        <FolderOpen className="h-4 w-4" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                    </Button>
                    {isEditing(parent.id) ? (
                      <div className="flex gap-2 items-center flex-1">
                        <Input
                          ref={inputRef}
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="h-8"
                          onKeyDown={handleEditKeyDown}
                          disabled={loading}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={handleSaveEdit}
                          disabled={loading}
                          className="h-8 w-8"
                        >
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={handleCancelEdit}
                          disabled={loading}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between flex-1 group">
                        <div 
                          className="cursor-pointer hover:underline font-medium" 
                          onClick={() => startEdit(parent.id, parent.name)}
                        >
                          {parent.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 opacity-0 group-hover:opacity-100"
                          onClick={() => startCreateChild(parent.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          子分类
                        </Button>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {parent.items_count ?? 0}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleConfirmDelete(parent.id)}
                    disabled={loading}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>

              {/* 子分类行 */}
              {expandedCategories.has(parent.id) && (
                <>
                  {parent.children?.map((child) => (
                    <TableRow key={child.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 ml-8">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          {isEditing(child.id) ? (
                            <div className="flex gap-2 items-center flex-1">
                              <Input
                                ref={inputRef}
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="h-8"
                                onKeyDown={handleEditKeyDown}
                                disabled={loading}
                              />
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={handleSaveEdit}
                                disabled={loading}
                                className="h-8 w-8"
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={handleCancelEdit}
                                disabled={loading}
                                className="h-8 w-8"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="cursor-pointer hover:underline flex-1" 
                              onClick={() => startEdit(child.id, child.name)}
                            >
                              {child.name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {child.items_count ?? 0}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleConfirmDelete(child.id)}
                          disabled={loading}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* 创建子分类行 */}
                  {creatingChildFor === parent.id && (
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2 ml-8">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <div className="flex gap-2 items-center flex-1">
                            <Input
                              value={newChildName}
                              onChange={(e) => setNewChildName(e.target.value)}
                              className="h-8"
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
                              className="h-8 w-8"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={cancelCreateChild}
                              disabled={creatingChild}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4 text-red-500" />
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
    cancelCreateChild
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