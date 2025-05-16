"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import type { Area, Room, Spot } from '@/app/thing/types'
import { useItemStore } from '@/stores/itemStore'
import { TagSelector, Tag } from '@/components/ui/tag-selector'
import useSWR from 'swr'
import { get } from '@/lib/api'

interface ItemFiltersProps {
  onApply: (filters: FilterState) => void
}

// 定义筛选条件类型
interface FilterState {
  name: string;
  description: string;
  status: string;
  tags: string[] | number[] | string;
  category_id: string | number;
  purchase_date_from: Date | null;
  purchase_date_to: Date | null;
  expiry_date_from: Date | null;
  expiry_date_to: Date | null;
  price_from: string | number;
  price_to: string | number;
  area_id: string | number;
  room_id: string | number;
  spot_id: string | number;
  is_public: boolean | null;
  include_null_purchase_date: boolean;
  include_null_expiry_date: boolean;
  exclude_null_purchase_date?: boolean;
  exclude_null_expiry_date?: boolean;
}

// 添加防抖函数
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
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

export default function ItemFilters({ onApply }: ItemFiltersProps) {
  const { filters: savedFilters } = useItemStore();
  const { data: categories = [] } = useSWR<any[]>('/categories', get);
  const { data: areas = [] } = useSWR<Area[]>('/areas', get);
  const { data: rooms = [] } = useSWR<Room[]>('/rooms', get);
  const { data: spots = [] } = useSWR<Spot[]>('/spots', get);
  const [activeTab, setActiveTab] = useState("basic");
  
  // 获取标签数据
  const { data: tags = [] } = useSWR<Tag[]>('/thing-tags', (url: string) => {
    return get<Tag[]>(url).catch(error => {
      console.error("获取标签失败:", error);
      return [
        { id: '1', name: '测试1' },
        { id: '2', name: '测试2' },
        { id: '3', name: '测试3' },
        { id: '4', name: '及格' }
      ];
    });
  });
  
  // 从保存的筛选条件初始化
  const getInitialState = useCallback(() => {
    if (Object.keys(savedFilters).length === 0) {
      return initialFilters;
    }
    
    // 合并保存的筛选条件和初始条件
    const mergedFilters = { ...initialFilters };
    
    // 处理普通字段
    Object.entries(savedFilters).forEach(([key, value]) => {
      if (key in mergedFilters) {
        // 特殊处理日期字段
        if (key.includes('date_from') || key.includes('date_to')) {
          if (value) {
            if (key === 'purchase_date_from' || key === 'purchase_date_to' || 
                key === 'expiry_date_from' || key === 'expiry_date_to') {
              (mergedFilters as any)[key] = new Date(value as string);
            }
          }
        } else {
          (mergedFilters as any)[key] = value;
        }
      }
    });
    
    return mergedFilters;
  }, [savedFilters]);
  
  const [filters, setFilters] = useState<FilterState>(getInitialState())
  
  // 使用防抖后的筛选条件
  const debouncedFilters = useDebounce(filters, 500);
  
  // 添加一个标志位，用于跟踪是否是首次渲染
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // 提取应用筛选逻辑为单独函数
  const applyFilters = useCallback((currentFilters: FilterState) => {
    // 创建一个新的对象，只保留非空、非"all"的值
    const appliedFilters = Object.entries(currentFilters).reduce((acc, [key, value]) => {
      const fieldKey = key as keyof FilterState;
      // 保留包含空日期的控制参数和公开状态参数，但过滤不在后端允许的过滤参数
      if ((fieldKey === 'include_null_purchase_date' || fieldKey === 'include_null_expiry_date') ||
          (fieldKey === 'is_public' || 
            (fieldKey !== 'exclude_null_purchase_date' && 
            fieldKey !== 'exclude_null_expiry_date' && 
            value !== null && value !== '' && value !== 'all'))) {
        
        // 特殊处理标签字段，将逗号分隔的字符串转换为数组
        if (fieldKey === 'tags' && typeof value === 'string' && value.trim() !== '') {
          // 分割字符串并转换为数字数组
          const tagArray = value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '')
            .map(Number);
          acc[fieldKey] = tagArray as any; // 使用类型断言处理复杂类型
        } else {
          acc[fieldKey] = value;
        }
      }
      return acc;
    }, {} as Partial<FilterState>);
    
    onApply(appliedFilters as FilterState);
  }, [onApply]);
  
  // 在筛选条件防抖后触发应用，但跳过初始渲染
  useEffect(() => {
    // 跳过初始渲染
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }
    
    applyFilters(debouncedFilters);
  }, [debouncedFilters, isInitialRender, applyFilters]);
  
  // 处理字段变更的函数 - 不再直接应用，而是通过防抖机制应用
  const handleChange = useCallback((field: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  
  // 处理标签选择 - 标签选择保持即时应用
  const handleTagsChange = useCallback((selectedTags: string[]) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        tags: selectedTags.join(',')
      };
      
      // 标签选择立即应用筛选
      applyFilters(updated);
      
      return updated;
    });
  }, [applyFilters]);
  
  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    
    // 重置后自动应用
    applyFilters(initialFilters);
  }, [applyFilters]);
  
  // 检查是否有激活的筛选条件
  const hasActiveFilters = useCallback(() => {
    // 检查是否有任何非默认值的筛选条件
    return Object.entries(filters).some(([key, value]) => {
      // 对于字符串类型的值，检查是否非空且不等于'all'
      if (typeof value === 'string') {
        return value !== '' && value !== 'all' && initialFilters[key as keyof FilterState] !== value;
      }
      // 对于数组或字符串类型的标签
      if (key === 'tags') {
        if (typeof value === 'string') {
          return value !== '';
        }
        if (Array.isArray(value)) {
          return value.length > 0;
        }
      }
      // 对于日期类型的值，检查是否非空
      if (value instanceof Date) {
        return true;
      }
      // 对于数值类型，检查是否非空
      if (typeof value === 'number') {
        return value !== 0 && initialFilters[key as keyof FilterState] !== value;
      }
      // 对于布尔类型，检查是否与初始值不同
      if (typeof value === 'boolean') {
        return initialFilters[key as keyof FilterState] !== value;
      }
      return false;
    });
  }, [filters]);
  
  const renderDateRangePicker = useCallback((
    label: string, 
    fromField: 'purchase_date_from' | 'expiry_date_from', 
    toField: 'purchase_date_to' | 'expiry_date_to',
    includeNullField: 'include_null_purchase_date' | 'include_null_expiry_date'
  ) => (
    <div className="space-y-3">
      <Label className="text-base font-medium">{label}</Label>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">开始日期</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-normal",
                  !filters[fromField] && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters[fromField] ? format(new Date(filters[fromField] as Date), 'yyyy-MM-dd') : <span>开始日期</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters[fromField] as Date}
                onSelect={(date) => handleChange(fromField, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">结束日期</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-11 justify-start text-left font-normal",
                  !filters[toField] && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters[toField] ? format(new Date(filters[toField] as Date), 'yyyy-MM-dd') : <span>结束日期</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters[toField] as Date}
                onSelect={(date) => handleChange(toField, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center space-x-2 w-full mt-1">
          <Switch 
            id={`include-null-${fromField}`}
            checked={filters[includeNullField]}
            onCheckedChange={(checked) => handleChange(includeNullField, checked)}
          />
          <Label htmlFor={`include-null-${fromField}`} className="text-xs cursor-pointer">
            包含空日期的物品
          </Label>
        </div>
      </div>
    </div>
  ), [filters, handleChange]);
  
  return (
    <div className="space-y-4 px-1">
      <div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="basic" className="text-sm">基础</TabsTrigger>
            <TabsTrigger value="detailed" className="text-sm">详细</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">名称</Label>
              <Input
                value={filters.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="h-11"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">描述</Label>
              <Input
                value={filters.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="h-11"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">状态</Label>
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleChange('status', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="archived">已归档</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">公开状态</Label>
              <Select 
                value={filters.is_public === null ? 'null' : filters.is_public === true ? 'true' : 'false'} 
                onValueChange={(value) => handleChange('is_public', value === 'null' ? null : value === 'true')}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="所有物品" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">所有物品</SelectItem>
                  <SelectItem value="true">公开</SelectItem>
                  <SelectItem value="false">私有</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">标签</Label>
              <div className="bg-background rounded-md relative">
                <TagSelector
                  tags={tags || []}
                  selectedTags={typeof filters.tags === 'string' ? 
                    filters.tags.split(',').filter(Boolean) : 
                    Array.isArray(filters.tags) ? 
                      filters.tags.map(t => t.toString()) : 
                      []}
                  onChange={handleTagsChange}
                  placeholder="选择标签"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            {renderDateRangePicker('购买日期', 'purchase_date_from', 'purchase_date_to', 'include_null_purchase_date')}
            
            {renderDateRangePicker('过期日期', 'expiry_date_from', 'expiry_date_to', 'include_null_expiry_date')}
            
            <div className="space-y-3">
              <Label className="text-base font-medium">价格范围</Label>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">最低价</Label>
                  <Input
                    type="number"
                    placeholder="最低价"
                    value={filters.price_from}
                    onChange={(e) => handleChange('price_from', e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">最高价</Label>
                  <Input
                    type="number"
                    placeholder="最高价"
                    value={filters.price_to}
                    onChange={(e) => handleChange('price_to', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-base font-medium">位置</Label>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">区域</Label>
                  <Select 
                    value={typeof filters.area_id === 'number' ? filters.area_id.toString() : filters.area_id.toString()} 
                    onValueChange={(value) => handleChange('area_id', value)}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="选择区域" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部区域</SelectItem>
                      {areas.map((area: Area) => (
                        <SelectItem key={area.id} value={area.id.toString()}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">房间</Label>
                  <Select 
                    value={typeof filters.room_id === 'number' ? filters.room_id.toString() : filters.room_id.toString()} 
                    onValueChange={(value) => handleChange('room_id', value)}
                    disabled={filters.area_id === 'all'}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="选择房间" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部房间</SelectItem>
                      {rooms.map((room: Room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">具体位置</Label>
                  <Select 
                    value={typeof filters.spot_id === 'number' ? filters.spot_id.toString() : filters.spot_id.toString()} 
                    onValueChange={(value) => handleChange('spot_id', value)}
                    disabled={filters.room_id === 'all'}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="选择位置" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部位置</SelectItem>
                      {spots.map((spot: Spot) => (
                        <SelectItem key={spot.id} value={spot.id.toString()}>
                          {spot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 