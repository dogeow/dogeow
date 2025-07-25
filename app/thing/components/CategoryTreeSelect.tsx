'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Combobox } from '@/components/ui/combobox'
import { cn } from '@/lib/helpers'
import { useItemStore } from '../stores/itemStore'
import { toast } from 'sonner'

// 分类选择类型
export type CategorySelection =
  | {
      type: 'parent' | 'child'
      id: number // 未分类时不使用CategorySelection，而是undefined
    }
  | undefined

// 扩展的分类类型
export interface CategoryWithChildren {
  id: number
  name: string
  parent_id?: number | null
  children?: CategoryWithChildren[]
  items_count?: number
}

interface CategoryTreeSelectProps {
  onSelect: (
    type: 'parent' | 'child',
    id: number | null, // 支持null（未分类）
    fullPath?: string,
    shouldClosePopup?: boolean
  ) => void
  selectedCategory?: CategorySelection
  className?: string
}

const CategoryTreeSelect: React.FC<CategoryTreeSelectProps> = ({
  onSelect,
  selectedCategory,
  className,
}) => {
  const { categories, createCategory } = useItemStore()

  // 当前选择的主分类和子分类
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  const [selectedChildId, setSelectedChildId] = useState<string>('')

  // 将扁平的分类数据转换为树形结构
  const categoryTree = useMemo(() => {
    const parentCategories: CategoryWithChildren[] = []
    const childCategories: CategoryWithChildren[] = []

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

  // 主分类选项
  const parentOptions = useMemo(
    () => [
      { value: 'none', label: '未分类' },
      ...categoryTree.map(parent => ({
        value: parent.id.toString(),
        label: parent.name,
      })),
    ],
    [categoryTree]
  )

  // 根据选择的主分类获取子分类选项
  const childOptions = useMemo(() => {
    if (!selectedParentId || selectedParentId === 'none') return []

    const parent = categoryTree.find(p => p.id.toString() === selectedParentId)
    return (
      parent?.children?.map(child => ({
        value: child.id.toString(),
        label: child.name,
      })) || []
    )
  }, [selectedParentId, categoryTree])

  // 处理主分类选择
  const handleParentSelect = useCallback(
    (parentId: string) => {
      console.log('handleParentSelect 被调用:', parentId)
      setSelectedParentId(parentId)
      setSelectedChildId('') // 清空子分类选择

      if (parentId === 'none') {
        console.log('选择未分类，调用 onSelect')
        onSelect('parent', null, '未分类', true) // 选择未分类时关闭弹窗
      } else if (parentId) {
        const parent = categoryTree.find(p => p.id.toString() === parentId)
        if (parent) {
          console.log('找到父分类:', parent.name, '子分类数量:', parent.children?.length || 0)
          // 选择父分类时搜索但不关闭弹窗
          console.log('选择父分类，立即调用 onSelect 但不关闭弹窗')
          onSelect('parent', parent.id, parent.name, false) // false 表示不关闭弹窗
        }
      }
    },
    [categoryTree, onSelect]
  )

  // 处理子分类选择
  const handleChildSelect = useCallback(
    (childId: string) => {
      console.log('handleChildSelect 被调用:', childId)
      setSelectedChildId(childId)

      if (childId) {
        const parent = categoryTree.find(p => p.id.toString() === selectedParentId)
        const child = parent?.children?.find(c => c.id.toString() === childId)
        if (child && parent) {
          console.log('选择子分类，调用 onSelect:', child.name)
          onSelect('child', child.id, `${parent.name} / ${child.name}`, true) // 选择子分类时关闭弹窗
        }
      }
    },
    [categoryTree, selectedParentId, onSelect]
  )

  // 处理创建主分类
  const handleCreateParent = useCallback(
    async (categoryName: string) => {
      try {
        const newCategory = await createCategory({
          name: categoryName,
          parent_id: null,
        })

        toast.success(`已创建主分类 "${categoryName}"`)
        setSelectedParentId(newCategory.id.toString())
        onSelect('parent', newCategory.id, newCategory.name, false) // 创建主分类后不关闭弹窗
      } catch (error) {
        console.error('创建主分类失败:', error)
        toast.error('创建主分类失败：' + (error instanceof Error ? error.message : '未知错误'))
      }
    },
    [createCategory, onSelect]
  )

  // 处理创建子分类
  const handleCreateChild = useCallback(
    async (categoryName: string) => {
      if (!selectedParentId || selectedParentId === 'none') {
        toast.error('请先选择主分类')
        return
      }

      try {
        const newCategory = await createCategory({
          name: categoryName,
          parent_id: Number(selectedParentId),
        })

        const parent = categoryTree.find(p => p.id.toString() === selectedParentId)
        toast.success(`已创建子分类 "${categoryName}"`)
        setSelectedChildId(newCategory.id.toString())

        if (parent) {
          onSelect('child', newCategory.id, `${parent.name} / ${newCategory.name}`, true) // 创建子分类后关闭弹窗
        }
      } catch (error) {
        console.error('创建子分类失败:', error)
        toast.error('创建子分类失败：' + (error instanceof Error ? error.message : '未知错误'))
      }
    },
    [createCategory, selectedParentId, categoryTree, onSelect]
  )

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
      // 未分类或未选择任何分类
      setSelectedParentId('none')
      setSelectedChildId('')
    }
  }, [selectedCategory, categoryTree])

  return (
    <div className={cn('space-y-3', className)}>
      {/* 主分类选择 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">主分类</Label>
        <Combobox
          options={parentOptions}
          value={selectedParentId}
          onChange={handleParentSelect}
          onCreateOption={handleCreateParent}
          placeholder="选择或创建主分类"
          emptyText="没有找到主分类"
          createText="创建主分类"
          searchText="搜索主分类..."
        />
      </div>

      {/* 子分类选择 */}
      {selectedParentId && selectedParentId !== 'none' && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">子分类（可选）</Label>
          <Combobox
            options={childOptions}
            value={selectedChildId}
            onChange={handleChildSelect}
            onCreateOption={handleCreateChild}
            placeholder="选择或创建子分类"
            emptyText="没有找到子分类"
            createText="创建子分类"
            searchText="搜索子分类..."
          />
        </div>
      )}
    </div>
  )
}

export default CategoryTreeSelect
