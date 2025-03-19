"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { API_BASE_URL } from '@/configs/api'

interface ItemFiltersProps {
  onApply: (filters: any) => void
}

// 定义筛选条件类型
interface FilterState {
  category_id: string;
  purchase_date_from: Date | null;
  purchase_date_to: Date | null;
  expiry_date_from: Date | null;
  expiry_date_to: Date | null;
  price_from: string;
  price_to: string;
  area_id: string;
  room_id: string;
  spot_id: string;
  is_public: boolean | null;
}

// 定义位置相关数据类型
interface Category {
  id: number;
  name: string;
}

interface Area {
  id: number;
  name: string;
}

interface Room {
  id: number;
  name: string;
}

interface Spot {
  id: number;
  name: string;
}

export default function ItemFilters({ onApply }: ItemFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(false)
  
  // 初始筛选条件
  const initialFilters: FilterState = {
    category_id: '',
    purchase_date_from: null,
    purchase_date_to: null,
    expiry_date_from: null,
    expiry_date_to: null,
    price_from: '',
    price_to: '',
    area_id: '',
    room_id: '',
    spot_id: '',
    is_public: null,
  }
  
  const [filters, setFilters] = useState<FilterState>(initialFilters)
  
  // 获取认证令牌
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
    'Accept': 'application/json',
  })
  
  // 加载分类和位置数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 并行请求数据
        const [categoriesRes, areasRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE_URL}/areas`, { headers: getAuthHeaders() })
        ])
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
        
        if (areasRes.ok) {
          const areasData = await areasRes.json()
          setAreas(areasData)
        }
      } catch (error) {
        toast.error("无法加载筛选数据")
        console.error("加载筛选数据失败:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // 当选择区域时加载房间
  useEffect(() => {
    if (!filters.area_id) {
      setRooms([])
      setFilters(prev => ({ ...prev, room_id: '', spot_id: '' }))
      return
    }
    
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/areas/${filters.area_id}/rooms`, {
          headers: getAuthHeaders(),
        })
        
        if (res.ok) {
          const data = await res.json()
          setRooms(data)
        }
      } catch (error) {
        console.error('加载房间失败', error)
      }
    }
    
    fetchRooms()
  }, [filters.area_id])
  
  // 当选择房间时加载位置
  useEffect(() => {
    if (!filters.room_id) {
      setSpots([])
      setFilters(prev => ({ ...prev, spot_id: '' }))
      return
    }
    
    const fetchSpots = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/rooms/${filters.room_id}/spots`, {
          headers: getAuthHeaders(),
        })
        
        if (res.ok) {
          const data = await res.json()
          setSpots(data)
        }
      } catch (error) {
        console.error('加载位置失败', error)
      }
    }
    
    fetchSpots()
  }, [filters.room_id])
  
  const handleChange = (field: keyof FilterState, value: any) => {
    // 将 "none" 保留为实际值，不再转换为空字符串
    setFilters(prev => ({ ...prev, [field]: value }))
  }
  
  const handleReset = () => {
    setFilters(initialFilters)
  }
  
  const handleApply = () => {
    // 过滤掉空值，确保日期正确传递
    const appliedFilters = Object.entries(filters).reduce((acc: Record<string, any>, [key, value]) => {
      // 不再添加 is_public 参数，它已经在外部处理
      if (key !== 'is_public' && value !== null) {
        acc[key] = value;
        // 特别打印category_id的值
        if (key === 'category_id') {
          console.log('FilterFilters - 添加分类ID:', value, typeof value);
        }
      }
      return acc;
    }, {});
    
    console.log('应用筛选条件:', appliedFilters);
    onApply(appliedFilters);
  }
  
  // 渲染日期选择器组件
  const renderDateRangePicker = (
    label: string, 
    fromField: 'purchase_date_from' | 'expiry_date_from', 
    toField: 'purchase_date_to' | 'expiry_date_to'
  ) => (
    <div className="space-y-3">
      <Label className="text-base font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">从</Label>
          <DatePicker
            date={filters[fromField]}
            setDate={(date) => handleChange(fromField, date)}
            placeholder="开始日期"
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">至</Label>
          <DatePicker
            date={filters[toField]}
            setDate={(date) => handleChange(toField, date)}
            placeholder="结束日期"
            className="h-11"
          />
        </div>
      </div>
    </div>
  )
  
  return (
    <div className="space-y-6 px-1">
      {renderDateRangePicker('购买日期', 'purchase_date_from', 'purchase_date_to')}
      
      {renderDateRangePicker('过期日期', 'expiry_date_from', 'expiry_date_to')}
      
      <Separator className="my-4" />
      
      <div className="space-y-3">
        <Label className="text-base font-medium">价格范围</Label>
        <div className="grid grid-cols-2 gap-3">
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
      
      <Separator className="my-4" />
      
      <div className="space-y-3">
        <Label className="text-base font-medium">位置</Label>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">区域</Label>
            <Select value={filters.area_id} onValueChange={(value) => handleChange('area_id', value)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">全部区域</SelectItem>
                {areas.map((area) => (
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
              value={filters.room_id} 
              onValueChange={(value) => handleChange('room_id', value)}
              disabled={!filters.area_id}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="选择房间" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">全部房间</SelectItem>
                {rooms.map((room) => (
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
              value={filters.spot_id} 
              onValueChange={(value) => handleChange('spot_id', value)}
              disabled={!filters.room_id}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="选择位置" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">全部位置</SelectItem>
                {spots.map((spot) => (
                  <SelectItem key={spot.id} value={spot.id.toString()}>
                    {spot.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="flex justify-between pt-6 pb-2 gap-3">
        <Button variant="outline" onClick={handleReset} className="flex-1 h-11">重置</Button>
        <Button onClick={handleApply} className="flex-1 h-11">应用筛选</Button>
      </div>
    </div>
  )
} 