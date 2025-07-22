"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Folder, Tag, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from '@/lib/helpers'
import { useItemStore } from '../stores/itemStore'
import { toast } from "sonner"

// 分类选择类型
export type CategorySelection = { 
  type: 'parent' | 'child'; 
  id: number;
} | undefined;

// 扩展的分类类型
export interface CategoryWithChildren {
  id: number;
  name: string;
  parent_id?: number | null;
  children?: CategoryWithChildren[];
  items_count?: number;
}

interface CategoryTreeSelectProps {
  onSelect: (type: 'parent' | 'child', id: number, fullPath?: string) => void;
  selectedCategory?: CategorySelection;
  className?: string;
}



const CategoryTreeSelect: React.FC<CategoryTreeSelectProps> = ({ 
  onSelect, 
  selectedCategory, 
  className
}) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createType, setCreateType] = useState<'parent' | 'child'>('parent')
  const [createParentId, setCreateParentId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedParentForChild, setSelectedParentForChild] = useState<string>('')
  
  const { categories, createCategory } = useItemStore()
  
  // 将扁平的分类数据转换为树形结构
  const categoryTree = useMemo(() => {
    const parentCategories: CategoryWithChildren[] = []
    const childCategories: CategoryWithChildren[] = []
    
    // 分离父分类和子分类
    categories.forEach(category => {
      const categoryWithChildren: CategoryWithChildren = {
        ...category,
        children: []
      }
      
      if (category.parent_id) {
        childCategories.push(categoryWithChildren)
      } else {
        parentCategories.push(categoryWithChildren)
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
  

  
  // 创建分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("分类名称不能为空")
      return
    }
    
    // 如果是创建子分类，检查是否选择了父分类
    if (createType === 'child' && !createParentId && !selectedParentForChild) {
      toast.error("请选择父分类")
      return
    }
    
    setLoading(true)
    try {
      const parentId = createType === 'child' 
        ? (createParentId || Number(selectedParentForChild))
        : null
        
      const categoryData = {
        name: newCategoryName.trim(),
        parent_id: parentId
      }
      
      await createCategory(categoryData)
      toast.success(`已创建${createType === 'parent' ? '主' : '子'}分类 "${newCategoryName}"`)
      
      setCreateDialogOpen(false)
      setNewCategoryName('')
      setCreateType('parent')
      setCreateParentId(null)
      setSelectedParentForChild('')
    } catch (error) {
      console.error("创建分类失败:", error)
      toast.error("创建分类失败：" + (error instanceof Error ? error.message : "未知错误"))
    } finally {
      setLoading(false)
    }
  }
  
  // 打开创建对话框
  const openCreateDialog = (type: 'parent' | 'child', parentId?: number) => {
    setCreateType(type)
    setCreateParentId(parentId || null)
    setSelectedParentForChild('')
    setNewCategoryName('')
    setCreateDialogOpen(true)
  }
  
  // 当前选择的主分类
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [selectedChildId, setSelectedChildId] = useState<string>('')
  
  // 根据选择的主分类获取子分类
  const availableChildren = useMemo(() => {
    if (!selectedParentId) return []
    const parent = categoryTree.find(p => p.id.toString() === selectedParentId)
    return parent?.children || []
  }, [selectedParentId, categoryTree])
  
  // 处理主分类选择
  const handleParentSelect = useCallback((parentId: string) => {
    setSelectedParentId(parentId)
    setSelectedChildId('') // 清空子分类选择
    
    if (parentId === 'none') {
      onSelect('parent', 0, '未分类')
    } else if (parentId) {
      const parent = categoryTree.find(p => p.id.toString() === parentId)
      if (parent) {
        onSelect('parent', parent.id, parent.name)
      }
    }
  }, [categoryTree, onSelect])
  
  // 处理子分类选择
  const handleChildSelect = useCallback((childId: string) => {
    setSelectedChildId(childId)
    
    if (childId) {
      const child = availableChildren.find(c => c.id.toString() === childId)
      const parent = categoryTree.find(p => p.id.toString() === selectedParentId)
      if (child && parent) {
        onSelect('child', child.id, `${parent.name} / ${child.name}`)
      }
    }
  }, [availableChildren, categoryTree, selectedParentId, onSelect])
  
  // 根据当前选择更新下拉框状态
  useEffect(() => {
    if (selectedCategory) {
      if (selectedCategory.type === 'parent') {
        setSelectedParentId(selectedCategory.id.toString())
        setSelectedChildId('')
      } else if (selectedCategory.type === 'child') {
        const child = categoryTree
          .flatMap(p => p.children || [])
          .find(c => c.id === selectedCategory.id)
        if (child?.parent_id) {
          setSelectedParentId(child.parent_id.toString())
          setSelectedChildId(selectedCategory.id.toString())
        }
      }
    } else {
      setSelectedParentId('')
      setSelectedChildId('')
    }
  }, [selectedCategory, categoryTree])

  return (
    <>
      <div className={cn("space-y-3", className)}>
        {/* 主分类选择 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">主分类</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                >
                  新建
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openCreateDialog('parent')}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建主分类
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => openCreateDialog('child')}
                  disabled={categoryTree.length === 0}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  创建子分类
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Select value={selectedParentId} onValueChange={handleParentSelect}>
            <SelectTrigger>
              <SelectValue placeholder="选择主分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">未分类</SelectItem>
              {categoryTree.map((parent) => (
                <SelectItem key={parent.id} value={parent.id.toString()}>
                  <div className="flex items-center">
                    <Folder className="h-4 w-4 mr-2" />
                    {parent.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* 子分类选择 */}
        {selectedParentId && selectedParentId !== 'none' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">子分类</Label>
            <Select value={selectedChildId} onValueChange={handleChildSelect}>
              <SelectTrigger>
                <SelectValue placeholder="选择子分类（可选）" />
              </SelectTrigger>
              <SelectContent>
                {availableChildren.length === 0 ? (
                  <div className="px-2 py-1 text-sm text-muted-foreground">
                    暂无子分类
                  </div>
                ) : (
                  availableChildren.map((child) => (
                    <SelectItem key={child.id} value={child.id.toString()}>
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        {child.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* 创建分类对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              创建{createType === 'parent' ? '主分类' : '子分类'}
            </DialogTitle>
            <DialogDescription>
              {createType === 'parent' 
                ? '创建一个新的主分类' 
                : createParentId 
                  ? `在 "${categoryTree.find(p => p.id === createParentId)?.name}" 下创建子分类`
                  : '创建一个新的子分类'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {createType === 'child' && !createParentId && (
              <div className="grid gap-2">
                <Label htmlFor="parentCategory">父分类</Label>
                <Select
                  value={selectedParentForChild}
                  onValueChange={setSelectedParentForChild}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择父分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryTree.map((parent) => (
                      <SelectItem key={parent.id} value={parent.id.toString()}>
                        {parent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="categoryName">分类名称</Label>
              <Input
                id="categoryName"
                placeholder={createType === 'parent' ? "输入主分类名称" : "输入子分类名称"}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={loading}
                autoFocus={createType === 'parent' || !!createParentId}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setCreateDialogOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateCategory}
              disabled={loading || !newCategoryName.trim() || (createType === 'child' && !createParentId && !selectedParentForChild)}
            >
              {loading ? "创建中..." : `创建${createType === 'parent' ? '主分类' : '子分类'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CategoryTreeSelect