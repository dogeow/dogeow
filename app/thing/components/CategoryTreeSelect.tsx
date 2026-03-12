'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Combobox } from '@/components/ui/combobox'
import { cn } from '@/lib/helpers'
import { useItemStore } from '../stores/itemStore'
import { toast } from 'sonner'

export type CategorySelection =
  | {
      type: 'parent' | 'child'
      id: number
    }
  | undefined

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
    id: number | null,
    fullPath?: string,
    shouldClosePopup?: boolean
  ) => void
  selectedCategory?: CategorySelection
  className?: string
  comboboxClassName?: string
  placeholder?: string
  helperText?: string | null
  noneOptionLabel?: string
}

interface FlatCategoryOption {
  value: string
  label: string
  type: 'parent' | 'child' | 'none'
  id: number | null
  parentId?: number | null
  parentName?: string
}

const CATEGORY_PATH_SEPARATOR = /\s*[\/／]\s*/

const CategoryTreeSelect: React.FC<CategoryTreeSelectProps> = ({
  onSelect,
  selectedCategory,
  className,
  comboboxClassName,
  placeholder = '选择或创建分类',
  helperText = '可直接搜索完整分类路径，例如：电子产品 / 手机',
  noneOptionLabel = '未分类',
}) => {
  const { categories, createCategory, fetchCategories } = useItemStore()

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories()
    }
  }, [categories.length, fetchCategories])

  const categoryTree = useMemo(() => {
    const parentCategories: CategoryWithChildren[] = []
    const childCategories: CategoryWithChildren[] = []

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

    childCategories.forEach(child => {
      const parent = parentCategories.find(p => p.id === child.parent_id)
      if (parent) {
        parent.children!.push(child)
      }
    })

    return parentCategories
  }, [categories])

  const noneOption = useMemo<FlatCategoryOption>(
    () => ({
      value: 'none',
      label: noneOptionLabel,
      type: 'none',
      id: null,
    }),
    [noneOptionLabel]
  )

  const flatOptions = useMemo<FlatCategoryOption[]>(
    () => [
      noneOption,
      ...categoryTree.flatMap(parent => {
        const parentOption: FlatCategoryOption = {
          value: `parent:${parent.id}`,
          label: parent.name,
          type: 'parent',
          id: parent.id,
        }

        const childOptions =
          parent.children?.map(child => ({
            value: `child:${child.id}`,
            label: `${parent.name} / ${child.name}`,
            type: 'child' as const,
            id: child.id,
            parentId: parent.id,
            parentName: parent.name,
          })) ?? []

        return [parentOption, ...childOptions]
      }),
    ],
    [categoryTree, noneOption]
  )

  const derivedValue = useMemo(() => {
    if (!selectedCategory) {
      return noneOption.value
    }

    const candidateValue = `${selectedCategory.type}:${selectedCategory.id}`
    return flatOptions.some(option => option.value === candidateValue)
      ? candidateValue
      : noneOption.value
  }, [flatOptions, noneOption.value, selectedCategory])

  const [localValue, setLocalValue] = useState(derivedValue)

  useEffect(() => {
    setLocalValue(derivedValue)
  }, [derivedValue])

  const handleSelect = useCallback(
    (value: string) => {
      setLocalValue(value)

      const option = flatOptions.find(item => item.value === value) ?? noneOption
      if (option.type === 'none') {
        onSelect('parent', null, noneOption.label, true)
        return
      }

      onSelect(option.type, option.id, option.label, true)
    },
    [flatOptions, noneOption, onSelect]
  )

  const handleCreateCategory = useCallback(
    async (inputName: string) => {
      const normalizedInput = inputName.trim()
      if (!normalizedInput) {
        return
      }

      const parts = normalizedInput
        .split(CATEGORY_PATH_SEPARATOR)
        .map(part => part.trim())
        .filter(Boolean)

      const currentOption = flatOptions.find(option => option.value === localValue)

      const createParentCategory = async (name: string) => {
        const newParent = await createCategory({
          name,
          parent_id: null,
        })

        toast.success(`已创建主分类 "${newParent.name}"`)
        const nextValue = `parent:${newParent.id}`
        setLocalValue(nextValue)
        onSelect('parent', newParent.id, newParent.name, true)
      }

      const createChildCategory = async (parentName: string, childName: string) => {
        let parent =
          categoryTree.find(
            category => category.parent_id == null && category.name.trim() === parentName.trim()
          ) ?? null

        if (!parent) {
          const newParent = await createCategory({
            name: parentName,
            parent_id: null,
          })
          parent = {
            ...newParent,
            children: [],
          }
        }

        const newChild = await createCategory({
          name: childName,
          parent_id: parent.id,
        })

        toast.success(`已创建分类 "${parent.name} / ${newChild.name}"`)
        const nextValue = `child:${newChild.id}`
        setLocalValue(nextValue)
        onSelect('child', newChild.id, `${parent.name} / ${newChild.name}`, true)
      }

      try {
        if (parts.length >= 2) {
          const [parentName, ...childNameParts] = parts
          await createChildCategory(parentName, childNameParts.join(' / '))
          return
        }

        if (currentOption?.type === 'parent' && currentOption.id !== null) {
          const newChild = await createCategory({
            name: normalizedInput,
            parent_id: currentOption.id,
          })

          toast.success(`已创建分类 "${currentOption.label} / ${newChild.name}"`)
          const nextValue = `child:${newChild.id}`
          setLocalValue(nextValue)
          onSelect('child', newChild.id, `${currentOption.label} / ${newChild.name}`, true)
          return
        }

        await createParentCategory(normalizedInput)
      } catch (error) {
        console.error('创建分类失败:', error)
        toast.error('创建分类失败：' + (error instanceof Error ? error.message : '未知错误'))
      }
    },
    [categoryTree, createCategory, flatOptions, localValue, onSelect]
  )

  return (
    <div className={cn('space-y-2', className)}>
      <Combobox
        options={flatOptions}
        value={localValue}
        onChange={handleSelect}
        onCreateOption={handleCreateCategory}
        placeholder={placeholder}
        emptyText="没有找到分类"
        createText="创建分类"
        searchText="搜索"
        className={comboboxClassName}
      />
      {helperText ? <p className="text-muted-foreground text-xs">{helperText}</p> : null}
    </div>
  )
}

export default CategoryTreeSelect
