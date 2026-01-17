'use client'

import { useState, useEffect, useCallback, useRef, startTransition } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'
import { useDebounce } from './filters/hooks/useDebounce'
import { initialFilters, type FilterState } from './filters/types'
import { applyFilters, hasActiveFilters, getInitialFilterState } from './filters/utils/filterUtils'
import { BasicFiltersTabContent } from './filters/components/BasicFiltersTabContent'
import { DetailedFiltersTab } from './filters/components/DetailedFiltersTab'
import { FilterActions } from './filters/components/FilterActions'
import CategoryTreeSelect, { CategorySelection } from './CategoryTreeSelect'
import type { Area, Room, Spot } from '@/app/thing/types'
import { Tag } from '@/components/ui/tag-selector'

interface ItemFiltersProps {
  onApply: (filters: FilterState) => void
  categories: unknown[] // As per current useSWR<any[]>
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  tags: Tag[]
}

export default function ItemFilters({
  onApply,
  areas = [],
  rooms = [],
  spots = [],
  tags = [],
}: ItemFiltersProps) {
  const { categories } = useItemStore()
  const { savedFilters } = useFilterPersistenceStore()
  const [activeTab, setActiveTab] = useState('basic')
  const [preventAutoApply, setPreventAutoApply] = useState(true) // 添加状态防止自动应用

  // 从保存的筛选条件初始化
  const getInitialState = useCallback(() => {
    return getInitialFilterState(savedFilters)
  }, [savedFilters])

  const [filters, setFilters] = useState<FilterState>(getInitialState())

  // 使用防抖后的筛选条件
  const debouncedFilters = useDebounce(filters, 500)

  // 添加一个标志位，用于跟踪是否是首次渲染
  const isInitialRenderRef = useRef(true)

  // 提取应用筛选逻辑为单独函数
  const handleApplyFilters = useCallback(
    (currentFilters: FilterState) => {
      applyFilters(currentFilters, onApply)
    },
    [onApply]
  )

  // 在筛选条件防抖后触发应用，但跳过初始渲染
  useEffect(() => {
    // 跳过初始渲染
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false
      return
    }

    // 只有当不阻止自动应用时，才自动应用筛选条件
    if (!preventAutoApply) {
      handleApplyFilters(debouncedFilters)
    }
  }, [debouncedFilters, handleApplyFilters, preventAutoApply])

  // 处理字段变更的函数
  const handleChange = useCallback((field: keyof FilterState, value: unknown) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // 处理标签选择 - 标签选择保持即时应用
  const handleTagsChange = useCallback(
    (selectedTags: string[]) => {
      setFilters(prev => {
        const updated = {
          ...prev,
          tags: selectedTags.join(','),
        }

        // 标签选择立即应用筛选
        handleApplyFilters(updated)

        return updated
      })
    },
    [handleApplyFilters]
  )

  // 分类选择状态
  const [selectedCategory, setSelectedCategory] = useState<CategorySelection>(undefined)

  // 分类筛选变化时，更新 filters 并立即应用
  const handleCategorySelect = useCallback(
    (type: 'parent' | 'child', id: number | null) => {
      if (id === null) {
        // 未分类
        setSelectedCategory(undefined)
        const updatedFilters = { ...filters, category_id: 'all' }
        setFilters(updatedFilters)
        handleApplyFilters(updatedFilters)
      } else {
        setSelectedCategory({ type, id })
        const updatedFilters = { ...filters, category_id: id.toString() }
        setFilters(updatedFilters)
        handleApplyFilters(updatedFilters)
      }
    },
    [filters, handleApplyFilters]
  )

  // 初始化分类选择状态
  useEffect(() => {
    startTransition(() => {
      if (filters.category_id && filters.category_id !== 'all') {
        const idNum = Number(filters.category_id)
        const category = categories.find(cat => cat.id === idNum)
        if (category) {
          setSelectedCategory({ type: category.parent_id ? 'child' : 'parent', id: idNum })
        }
      } else {
        setSelectedCategory(undefined)
      }
    })
  }, [filters.category_id, categories])

  // 快速清除所有筛选条件
  const handleClearAll = useCallback(() => {
    setFilters(initialFilters)
    setPreventAutoApply(false)
    setTimeout(() => {
      handleApplyFilters(initialFilters)
    }, 100)
  }, [handleApplyFilters])

  return (
    <div className="text-foreground space-y-4 px-1">
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted border-border mb-4 grid w-full grid-cols-2 rounded-lg border">
            <TabsTrigger
              value="basic"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm"
            >
              基础
            </TabsTrigger>
            <TabsTrigger
              value="detailed"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-sm"
            >
              详细
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <BasicFiltersTabContent
              filters={filters}
              selectedCategory={selectedCategory}
              tags={tags}
              onNameChange={value => handleChange('name', value)}
              onDescriptionChange={value => handleChange('description', value)}
              onStatusChange={value => handleChange('status', value)}
              onIsPublicChange={value => handleChange('is_public', value)}
              onTagsChange={handleTagsChange}
              onCategorySelect={handleCategorySelect}
            />
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <DetailedFiltersTab
              filters={filters}
              areas={areas}
              rooms={rooms}
              spots={spots}
              onPurchaseDateFromChange={date => handleChange('purchase_date_from', date || null)}
              onPurchaseDateToChange={date => handleChange('purchase_date_to', date || null)}
              onIncludeNullPurchaseDateChange={checked =>
                handleChange('include_null_purchase_date', checked)
              }
              onExpiryDateFromChange={date => handleChange('expiry_date_from', date || null)}
              onExpiryDateToChange={date => handleChange('expiry_date_to', date || null)}
              onIncludeNullExpiryDateChange={checked =>
                handleChange('include_null_expiry_date', checked)
              }
              onPriceFromChange={value => handleChange('price_from', value)}
              onPriceToChange={value => handleChange('price_to', value)}
              onAreaIdChange={value => handleChange('area_id', value)}
              onRoomIdChange={value => handleChange('room_id', value)}
              onSpotIdChange={value => handleChange('spot_id', value)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <FilterActions
        hasActiveFilters={hasActiveFilters(filters)}
        onClearAll={handleClearAll}
        onApply={() => handleApplyFilters(filters)}
      />
    </div>
  )
}
