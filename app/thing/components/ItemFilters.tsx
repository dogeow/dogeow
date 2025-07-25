'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/helpers'
import { CalendarIcon } from 'lucide-react'
import type { Area, Room, Spot } from '@/app/thing/types'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { TagSelector, Tag } from '@/components/ui/tag-selector'
import CategoryTreeSelect, { CategorySelection } from './CategoryTreeSelect'

// import useSWR from 'swr' // SWR will be removed
// import { get } from '@/lib/api' // get will be removed

interface ItemFiltersProps {
  onApply: (filters: FilterState) => void
  categories: unknown[] // As per current useSWR<any[]>
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  tags: Tag[]
}

// 定义筛选条件类型
interface FilterState {
  name: string
  description: string
  status: string
  tags: string[] | number[] | string
  category_id: string | number
  purchase_date_from: Date | null
  purchase_date_to: Date | null
  expiry_date_from: Date | null
  expiry_date_to: Date | null
  price_from: string | number
  price_to: string | number
  area_id: string | number
  room_id: string | number
  spot_id: string | number
  is_public: boolean | null
  include_null_purchase_date: boolean
  include_null_expiry_date: boolean
  exclude_null_purchase_date?: boolean
  exclude_null_expiry_date?: boolean
  [key: string]: unknown
}

// 添加防抖函数
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// 初始筛选条件
const initialFilters: FilterState = {
  name: '',
  description: '',
  status: 'all',
  tags: '',
  category_id: 'all',
  purchase_date_from: null,
  purchase_date_to: null,
  expiry_date_from: null,
  expiry_date_to: null,
  price_from: '',
  price_to: '',
  area_id: 'all',
  room_id: 'all',
  spot_id: 'all',
  is_public: null,
  include_null_purchase_date: true,
  include_null_expiry_date: true,
}

// 在组件外部添加调试函数
function debugFilterState(label: string, filters: FilterState) {
  console.log(`[调试] ${label}:`, {
    hasActiveFilters: Object.keys(filters).some(
      key => filters[key as keyof FilterState] !== initialFilters[key as keyof FilterState]
    ),
    fieldsWithValues: Object.keys(filters).filter(
      key => filters[key as keyof FilterState] !== initialFilters[key as keyof FilterState]
    ),
    filters,
  })
}

export default function ItemFilters({
  onApply,
  areas = [],
  rooms = [],
  spots = [],
  tags = [],
}: ItemFiltersProps) {
  console.log('[ItemFilters] 组件被渲染')

  const { filters: savedFilters, categories } = useItemStore()
  // SWR hooks for _categories, areas, rooms, spots, tags are removed.
  // These are now passed as props.
  const [activeTab, setActiveTab] = useState('basic')
  const [preventAutoApply, setPreventAutoApply] = useState(true) // 添加状态防止自动应用

  // 从保存的筛选条件初始化
  const getInitialState = useCallback(() => {
    console.log('[ItemFilters] 获取初始状态, 保存的筛选条件:', savedFilters)

    if (Object.keys(savedFilters).length === 0) {
      return initialFilters
    }

    // 合并保存的筛选条件和初始条件
    const mergedFilters = { ...initialFilters }

    // 处理普通字段
    Object.entries(savedFilters).forEach(([key, value]) => {
      if (key in mergedFilters) {
        // 特殊处理日期字段
        if (key.includes('date_from') || key.includes('date_to')) {
          if (value) {
            if (
              key === 'purchase_date_from' ||
              key === 'purchase_date_to' ||
              key === 'expiry_date_from' ||
              key === 'expiry_date_to'
            ) {
              // 使用 Object.assign 避免类型错误
              Object.assign(mergedFilters, { [key]: new Date(value as string) })
            }
          }
        } else {
          // 使用 Object.assign 避免类型错误
          Object.assign(mergedFilters, { [key]: value })
        }
      }
    })

    debugFilterState('合并后的初始筛选条件', mergedFilters)
    return mergedFilters
  }, [savedFilters])

  const [filters, setFilters] = useState<FilterState>(getInitialState())

  // 使用防抖后的筛选条件
  const debouncedFilters = useDebounce(filters, 500)

  // 添加一个标志位，用于跟踪是否是首次渲染
  const [isInitialRender, setIsInitialRender] = useState(true)

  // 提取应用筛选逻辑为单独函数
  const applyFilters = useCallback(
    (currentFilters: FilterState) => {
      // 创建一个新的对象，只保留非空、非"all"的值
      const appliedFilters = Object.entries(currentFilters).reduce((acc, [key, value]) => {
        const fieldKey = key as keyof FilterState
        // 保留包含空日期的控制参数和公开状态参数，但过滤不在后端允许的过滤参数
        if (
          fieldKey === 'include_null_purchase_date' ||
          fieldKey === 'include_null_expiry_date' ||
          fieldKey === 'is_public' ||
          (fieldKey !== 'exclude_null_purchase_date' &&
            fieldKey !== 'exclude_null_expiry_date' &&
            value !== null &&
            value !== '' &&
            value !== 'all')
        ) {
          // 特殊处理标签字段，将逗号分隔的字符串转换为数组
          if (fieldKey === 'tags' && typeof value === 'string' && value.trim() !== '') {
            // 分割字符串并转换为数字数组
            const tagArray = value
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag !== '')
              .map(Number)
            // 使用 Object.assign 避免类型错误
            Object.assign(acc, { [fieldKey]: tagArray })
          } else {
            acc[fieldKey] = value
          }
        }
        return acc
      }, {} as Partial<FilterState>)

      onApply(appliedFilters as FilterState)
    },
    [onApply]
  )

  // 在筛选条件防抖后触发应用，但跳过初始渲染
  useEffect(() => {
    // 跳过初始渲染
    if (isInitialRender) {
      console.log('跳过初始渲染, 防止筛选侧边栏打开时自动触发筛选')
      setIsInitialRender(false)
      return
    }

    console.log('筛选条件变化(防抖后):', debouncedFilters, '是否阻止自动应用:', preventAutoApply)
    // 只有当不阻止自动应用时，才自动应用筛选条件
    if (!preventAutoApply) {
      applyFilters(debouncedFilters)
    }
  }, [debouncedFilters, isInitialRender, applyFilters, preventAutoApply])

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = Object.keys(filters).some(key => {
    const fieldKey = key as keyof FilterState
    const currentValue = filters[fieldKey]
    const initialValue = initialFilters[fieldKey]

    // 特殊处理日期字段
    if (
      typeof fieldKey === 'string' &&
      (fieldKey.includes('date_from') || fieldKey.includes('date_to'))
    ) {
      return currentValue !== null && initialValue === null
    }

    return currentValue !== initialValue
  })

  // 快速清除所有筛选条件
  const handleClearAll = () => {
    setFilters(initialFilters)
    setPreventAutoApply(false)
    setTimeout(() => {
      applyFilters(initialFilters)
    }, 100)
  }

  // 处理字段变更的函数 - 不再直接应用，而是通过防抖机制应用
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
        applyFilters(updated)

        return updated
      })
    },
    [applyFilters]
  )

  // 分类选择状态
  const [selectedCategory, setSelectedCategory] = useState<CategorySelection>(undefined)

  // 分类筛选变化时，更新 filters 并立即应用
  const handleCategorySelect = useCallback(
    (type: 'parent' | 'child', id: number | null) => {
      if (id === null) {
        // 未分类
        setSelectedCategory(undefined)
        setFilters(prev => ({
          ...prev,
          category_id: 'all',
        }))
        // 立即应用筛选
        applyFilters({
          ...filters,
          category_id: 'all',
        })
      } else {
        setSelectedCategory({ type, id })
        setFilters(prev => ({
          ...prev,
          category_id: id.toString(),
        }))
        // 立即应用筛选
        applyFilters({
          ...filters,
          category_id: id.toString(),
        })
      }
      // 注意：在筛选器对话框中，我们不需要处理弹窗关闭逻辑，因为这是在一个固定的对话框内
    },
    [applyFilters, filters]
  )

  // 初始化分类选择状态
  useEffect(() => {
    if (filters.category_id && filters.category_id !== 'all') {
      const idNum = Number(filters.category_id)
      const category = categories.find(cat => cat.id === idNum)
      if (category) {
        setSelectedCategory({ type: category.parent_id ? 'child' : 'parent', id: idNum })
      }
    } else {
      setSelectedCategory(undefined)
    }
  }, [filters.category_id, categories])

  const renderDateRangePicker = useCallback(
    (
      label: string,
      fromField: 'purchase_date_from' | 'expiry_date_from',
      toField: 'purchase_date_to' | 'expiry_date_to',
      includeNullField: 'include_null_purchase_date' | 'include_null_expiry_date'
    ) => (
      <div className="space-y-3">
        <Label className="text-base font-medium">{label}</Label>
        <div className="space-y-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-11 w-full justify-start text-left font-normal',
                  !filters[fromField] && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters[fromField] ? (
                  format(new Date(filters[fromField] as Date), 'yyyy-MM-dd')
                ) : (
                  <span>开始日期</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters[fromField] as Date}
                onSelect={date => handleChange(fromField, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-11 w-full justify-start text-left font-normal',
                  !filters[toField] && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters[toField] ? (
                  format(new Date(filters[toField] as Date), 'yyyy-MM-dd')
                ) : (
                  <span>结束日期</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters[toField] as Date}
                onSelect={date => handleChange(toField, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="mt-1 flex w-full items-center space-x-2">
            <Switch
              id={`include-null-${fromField}`}
              checked={filters[includeNullField]}
              onCheckedChange={checked => handleChange(includeNullField, checked)}
            />
            <Label htmlFor={`include-null-${fromField}`} className="cursor-pointer text-xs">
              包含空日期的物品
            </Label>
          </div>
        </div>
      </div>
    ),
    [filters, handleChange]
  )

  // 在组件每次渲染时执行，仅用于调试
  useEffect(() => {
    debugFilterState('当前筛选条件', filters)
  }, [filters])

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
            <div className="space-y-3">
              <Label className="text-base font-medium">名称</Label>
              <Input
                value={filters.name}
                onChange={e => handleChange('name', e.target.value)}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">描述</Label>
              <Input
                value={filters.description}
                onChange={e => handleChange('description', e.target.value)}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
              />
            </div>

            {/* 分类筛选：父子级联，可清空 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">分类</Label>
              <CategoryTreeSelect
                onSelect={handleCategorySelect}
                selectedCategory={selectedCategory}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground mt-2 text-xs"
                onClick={() => handleCategorySelect('parent', null)}
                disabled={!selectedCategory}
              >
                清空分类筛选
              </Button>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">状态</Label>
              <div className="bg-muted border-border rounded-lg border px-2 py-1">
                <Select
                  value={filters.status}
                  onValueChange={value => handleChange('status', value)}
                >
                  <SelectTrigger className="bg-background text-foreground h-11 border-none">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground border">
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="active">使用中</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                    <SelectItem value="expired">已过期</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">公开状态</Label>
              <Select
                value={
                  filters.is_public === null
                    ? 'null'
                    : filters.is_public === true
                      ? 'true'
                      : 'false'
                }
                onValueChange={value =>
                  handleChange('is_public', value === 'null' ? null : value === 'true')
                }
              >
                <SelectTrigger className="bg-background border-input text-foreground h-11 border">
                  <SelectValue placeholder="所有物品" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-popover-foreground border">
                  <SelectItem value="null">所有物品</SelectItem>
                  <SelectItem value="true">公开</SelectItem>
                  <SelectItem value="false">私有</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">标签</Label>
              <div className="bg-muted border-border rounded-lg border px-2 py-1">
                <TagSelector
                  tags={tags}
                  selectedTags={
                    typeof filters.tags === 'string'
                      ? filters.tags.split(',').filter(Boolean)
                      : Array.isArray(filters.tags)
                        ? filters.tags.map(t => t.toString())
                        : []
                  }
                  onChange={handleTagsChange}
                  placeholder="选择标签"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            {renderDateRangePicker(
              '购买日期',
              'purchase_date_from',
              'purchase_date_to',
              'include_null_purchase_date'
            )}

            <div className="space-y-3">
              <Label className="text-base font-medium">价格范围</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低价"
                  value={filters.price_from}
                  onChange={e => handleChange('price_from', e.target.value)}
                  className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="最高价"
                  value={filters.price_to}
                  onChange={e => handleChange('price_to', e.target.value)}
                  className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">位置</Label>
              <div className="space-y-3">
                <Select
                  value={
                    typeof filters.area_id === 'number'
                      ? filters.area_id.toString()
                      : filters.area_id.toString()
                  }
                  onValueChange={value => handleChange('area_id', value)}
                >
                  <SelectTrigger className="bg-background border-input text-foreground h-11 border">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground border">
                    <SelectItem value="all">全部区域</SelectItem>
                    {areas.map((area: Area) => (
                      <SelectItem key={area.id} value={area.id.toString()}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={
                    typeof filters.room_id === 'number'
                      ? filters.room_id.toString()
                      : filters.room_id.toString()
                  }
                  onValueChange={value => handleChange('room_id', value)}
                  disabled={
                    filters.area_id === 'all' || filters.area_id === null || filters.area_id === ''
                  }
                >
                  <SelectTrigger className="bg-background border-input text-foreground h-11 border disabled:opacity-60">
                    <SelectValue placeholder="选择房间" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground border">
                    <SelectItem value="all">全部房间</SelectItem>
                    {rooms
                      .filter(
                        room =>
                          filters.area_id === 'all' ||
                          room.area_id?.toString() === filters.area_id?.toString()
                      )
                      .map((room: Room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Select
                  value={
                    typeof filters.spot_id === 'number'
                      ? filters.spot_id.toString()
                      : filters.spot_id.toString()
                  }
                  onValueChange={value => handleChange('spot_id', value)}
                  disabled={
                    filters.room_id === 'all' || filters.room_id === null || filters.room_id === ''
                  }
                >
                  <SelectTrigger className="bg-background border-input text-foreground h-11 border disabled:opacity-60">
                    <SelectValue placeholder="选择位置" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border text-popover-foreground border">
                    <SelectItem value="all">全部位置</SelectItem>
                    {spots
                      .filter(
                        spot =>
                          filters.room_id === 'all' ||
                          spot.room_id?.toString() === filters.room_id?.toString()
                      )
                      .map((spot: Spot) => (
                        <SelectItem key={spot.id} value={spot.id.toString()}>
                          {spot.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="bg-background sticky bottom-0 z-10 mt-6 flex justify-between border-t py-3">
        <Button
          variant="outline"
          onClick={handleClearAll}
          disabled={!hasActiveFilters}
          className="disabled:bg-background disabled:border-border disabled:text-muted-foreground disabled:opacity-50"
        >
          重置
        </Button>
        <Button
          onClick={() => applyFilters(filters)}
          disabled={!hasActiveFilters}
          className="disabled:bg-muted disabled:text-muted-foreground disabled:opacity-50"
        >
          应用筛选
        </Button>
      </div>
    </div>
  )
}
