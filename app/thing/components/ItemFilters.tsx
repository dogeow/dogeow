"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useCategories, useAreas, useRooms, useSpots } from '@/utils/api'
import type { Area, Room, Spot } from '@/app/thing/types'

interface ItemFiltersProps {
  onApply: (filters: FilterState) => void
}

// 定义筛选条件类型
interface FilterState {
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

export default function ItemFilters({ onApply }: ItemFiltersProps) {
  const { data: categories = [], error: categoriesError } = useCategories()
  const { data: areas = [], error: areasError } = useAreas()
  const { data: rooms = [], error: roomsError } = useRooms()
  const { data: spots = [], error: spotsError } = useSpots()
  const [activeTab, setActiveTab] = useState("basic")
  
  // 初始筛选条件
  const initialFilters: FilterState = {
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
  
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  
  // 获取认证令牌
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    'Accept': 'application/json',
  })
  
  // 处理错误
  useEffect(() => {
    if (categoriesError) {
      toast.error("加载分类数据失败")
      console.error("加载分类数据失败:", categoriesError)
    }
    if (areasError) {
      toast.error("加载区域数据失败")
      console.error("加载区域数据失败:", areasError)
    }
    if (roomsError) {
      toast.error("加载房间数据失败")
      console.error("加载房间数据失败:", roomsError)
    }
    if (spotsError) {
      toast.error("加载位置数据失败")
      console.error("加载位置数据失败:", spotsError)
    }
  }, [categoriesError, areasError, roomsError, spotsError])
  
  const handleChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value }
      return newFilters
    })
  }
  
  const handleReset = () => {
    setFilters(initialFilters)
  }
  
  const handleApply = () => {
    // 创建一个新的对象，只保留非空、非"all"的值
    const appliedFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      const fieldKey = key as keyof FilterState;
      // 不包含空值、"all"值和is_public为null的情况
      if (fieldKey !== 'is_public' && value !== null && value !== '' && value !== 'all') {
        acc[fieldKey] = value;
        
        // 特别打印category_id的值
        if (key === 'category_id') {
          console.log('FilterFilters - 添加分类ID:', value, typeof value);
        }
      }
      return acc;
    }, {} as Partial<FilterState>);
    
    // 如果有日期筛选条件且不包含空日期，添加特殊标记
    if (filters.purchase_date_from && !filters.include_null_purchase_date) {
      appliedFilters.exclude_null_purchase_date = true;
    }
    
    if (filters.expiry_date_from && !filters.include_null_expiry_date) {
      appliedFilters.exclude_null_expiry_date = true;
    }
    
    console.log('应用筛选条件:', appliedFilters);
    onApply(appliedFilters as FilterState);
  }
  
  // 渲染日期选择器组件
  const renderDateRangePicker = (
    label: string, 
    fromField: 'purchase_date_from' | 'expiry_date_from', 
    toField: 'purchase_date_to' | 'expiry_date_to',
    includeNullField: 'include_null_purchase_date' | 'include_null_expiry_date'
  ) => (
    <div className="space-y-3">
      <Label className="text-base font-medium">{label}</Label>
      <div className="flex flex-col gap-3 items-center">
        <div className="space-y-1.5 w-full">
          <Label className="text-xs text-muted-foreground">从</Label>
          <DatePicker
            date={filters[fromField]}
            setDate={(date) => handleChange(fromField, date)}
            placeholder="开始日期"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5 w-full">
          <Label className="text-xs text-muted-foreground">至</Label>
          <DatePicker
            date={filters[toField]}
            setDate={(date) => handleChange(toField, date)}
            placeholder="结束日期"
            className="h-11"
          />
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
  )
  
  return (
    <div className="space-y-4 px-1">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-4">
          <TabsTrigger value="basic">基础筛选</TabsTrigger>
          <TabsTrigger value="detailed">详细筛选</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {renderDateRangePicker('购买日期', 'purchase_date_from', 'purchase_date_to', 'include_null_purchase_date')}
          
          <Separator className="my-4" />
          
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
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          {renderDateRangePicker('过期日期', 'expiry_date_from', 'expiry_date_to', 'include_null_expiry_date')}
          
          <Separator className="my-4" />
          
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
      
      <div className="flex justify-between pt-4 pb-2 gap-3">
        <Button variant="outline" onClick={handleReset} className="flex-1 h-11">重置</Button>
        <Button onClick={handleApply} className="flex-1 h-11">应用筛选</Button>
      </div>
    </div>
  )
} 