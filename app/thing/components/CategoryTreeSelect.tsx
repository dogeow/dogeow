"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Search, Folder, FolderOpen, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

// 优化的搜索匹配函数
const matchesSearch = (text: string, searchTerm: string): boolean => {
  return text.toLowerCase().includes(searchTerm.toLowerCase());
};

const CategoryTreeSelect: React.FC<CategoryTreeSelectProps> = ({ 
  onSelect, 
  selectedCategory, 
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createType, setCreateType] = useState<'parent' | 'child'>('parent')
  const [createParentId, setCreateParentId] = useState<number | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { categories, createCategory, fetchCategories } = useItemStore()
  
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
  
  // 初始展开所有分类
  useEffect(() => {
    if (categoryTree.length > 0) {
      setExpandedCategories(new Set(categoryTree.map(cat => cat.id)))
    }
  }, [categoryTree])
  
  // 根据选中的分类自动展开
  useEffect(() => {
    if (!selectedCategory || categoryTree.length === 0) return
    
    if (selectedCategory.type === 'child') {
      // 找到子分类的父分类并展开
      const childCategory = categoryTree
        .flatMap(parent => parent.children || [])
        .find(child => child.id === selectedCategory.id)
      
      if (childCategory?.parent_id) {
        setExpandedCategories(prev => new Set([...prev, childCategory.parent_id!]))
      }
    }
  }, [selectedCategory, categoryTree])
  
  // 搜索过滤逻辑
  const searchResults = useMemo(() => {
    if (!searchTerm) {
      return {
        filteredCategories: categoryTree,
        visibleCategoryIds: Array.from(expandedCategories)
      }
    }
    
    const visibleCategoryIds = new Set<number>()
    const filteredCategories: CategoryWithChildren[] = []
    
    categoryTree.forEach(parent => {
      const matchingChildren = (parent.children || []).filter(child => 
        matchesSearch(child.name, searchTerm)
      )
      
      const parentMatches = matchesSearch(parent.name, searchTerm)
      const hasMatchingChildren = matchingChildren.length > 0
      
      if (parentMatches || hasMatchingChildren) {
        visibleCategoryIds.add(parent.id)
        filteredCategories.push({
          ...parent,
          children: hasMatchingChildren ? matchingChildren : parent.children
        })
      }
    })
    
    return {
      filteredCategories,
      visibleCategoryIds: Array.from(visibleCategoryIds)
    }
  }, [categoryTree, searchTerm, expandedCategories])
  
  // 展开/折叠处理
  const toggleCategory = useCallback((e: React.MouseEvent, categoryId: number) => {
    e.stopPropagation()
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
  
  // 构建路径
  const buildPath = useCallback((type: 'parent' | 'child', id: number): string => {
    if (type === 'parent') {
      const parent = categoryTree.find(p => p.id === id)
      return parent?.name || '未知分类'
    }
    
    // child
    const child = categoryTree
      .flatMap(parent => parent.children || [])
      .find(child => child.id === id)
    
    if (!child) return '未知分类'
    
    const parent = categoryTree.find(p => p.id === child.parent_id)
    return parent ? `${parent.name} / ${child.name}` : child.name
  }, [categoryTree])
  
  // 选择处理
  const handleSelect = useCallback((type: 'parent' | 'child', id: number) => {
    onSelect(type, id, buildPath(type, id))
  }, [onSelect, buildPath])
  
  // 检查是否选中
  const isSelected = useCallback((type: 'parent' | 'child', id: number): boolean => {
    return selectedCategory?.type === type && selectedCategory.id === id
  }, [selectedCategory])
  
  // 创建分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("分类名称不能为空")
      return
    }
    
    setLoading(true)
    try {
      const categoryData = {
        name: newCategoryName.trim(),
        parent_id: createType === 'child' ? createParentId : null
      }
      
      await createCategory(categoryData)
      toast.success(`已创建${createType === 'parent' ? '主' : '子'}分类 "${newCategoryName}"`)
      
      setCreateDialogOpen(false)
      setNewCategoryName('')
      setCreateType('parent')
      setCreateParentId(null)
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
    setNewCategoryName('')
    setCreateDialogOpen(true)
  }
  
  const hasNoResults = searchResults.filteredCategories.length === 0

  return (
    <>
      <div className={cn("border rounded-md p-2 bg-card", className)}>
        {/* 搜索框 */}
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="搜索分类..."
              className="pl-7 h-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={() => openCreateDialog('parent')}
          >
            新建
          </Button>
        </div>
        
        {/* 树形结构 */}
        <div className="h-[300px] overflow-y-auto pr-1">
          {hasNoResults ? (
            <div className="py-2 text-center text-sm text-muted-foreground">
              {searchTerm ? "没有匹配的分类" : "没有可用的分类"}
            </div>
          ) : (
            <>
              {/* 分类列表 */}
              {searchResults.filteredCategories.map(parent => (
                <div key={`parent-${parent.id}`}>
                  <div 
                    className={cn(
                      "flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm group",
                      isSelected('parent', parent.id) && "bg-muted"
                    )}
                    onClick={() => handleSelect('parent', parent.id)}
                  >
                    <span
                      onClick={(e) => toggleCategory(e, parent.id)}
                      className="flex items-center"
                    >
                      {searchResults.visibleCategoryIds.includes(parent.id) ? (
                        <FolderOpen className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      ) : (
                        <Folder className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                      )}
                    </span>
                    <span className="flex-grow cursor-pointer truncate">
                      {parent.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        openCreateDialog('child', parent.id)
                      }}
                    >
                      +
                    </Button>
                  </div>
                  
                  {/* 父分类下的子分类 */}
                  {searchResults.visibleCategoryIds.includes(parent.id) && 
                    (parent.children || []).map(child => (
                      <div 
                        key={`child-${child.id}`}
                        className={cn(
                          "ml-4 flex items-center py-1 px-2 rounded hover:bg-muted cursor-pointer text-sm",
                          isSelected('child', child.id) && "bg-muted"
                        )}
                        onClick={() => handleSelect('child', child.id)}
                      >
                        <Tag className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        <span className="truncate">{child.name}</span>
                      </div>
                    ))}
                </div>
              ))}
            </>
          )}
        </div>
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
                : `在 "${categoryTree.find(p => p.id === createParentId)?.name}" 下创建子分类`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                placeholder="输入分类名称"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={loading}
                autoFocus
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
              disabled={loading || !newCategoryName.trim()}
            >
              {loading ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CategoryTreeSelect