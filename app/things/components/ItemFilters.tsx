"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { API_BASE_URL } from '@/configs/api'

interface ItemFiltersProps {
  onApply: (filters: any) => void
}

export default function ItemFilters({ onApply }: ItemFiltersProps) {
  const [categories, setCategories] = useState<any[]>([])
  const [areas, setAreas] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [spots, setSpots] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // 筛选条件
  const [filters, setFilters] = useState({
    category_id: '',
    purchase_date_from: null as Date | null,
    purchase_date_to: null as Date | null,
    expiry_date_from: null as Date | null,
    expiry_date_to: null as Date | null,
    price_from: '',
    price_to: '',
    area_id: '',
    room_id: '',
    spot_id: '',
    is_public: null as boolean | null,
  })
  
  // 加载分类和位置数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 获取分类
        const categoriesRes = await fetch(`${API_BASE_URL}/categories`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Accept': 'application/json',
          },
        })
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData)
        }
        
        // 获取区域
        const areasRes = await fetch(`${API_BASE_URL}/areas`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Accept': 'application/json',
          },
        })
        
        if (areasRes.ok) {
          const areasData = await areasRes.json()
          setAreas(areasData)
        }
      } catch (error) {
        toast.error("无法加载筛选数据")
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
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Accept': 'application/json',
          },
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
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Accept': 'application/json',
          },
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
  
  const handleChange = (field: string, value: any) => {
    // 将 "none" 值转换为空字符串
    const actualValue = value === "none" ? "" : value;
    setFilters(prev => ({ ...prev, [field]: actualValue }))
  }
  
  const handleReset = () => {
    setFilters({
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
    })
  }
  
  const handleApply = () => {
    // 过滤掉空值
    const appliedFilters = Object.entries(filters).reduce((acc: Record<string, any>, [key, value]) => {
      if (value !== '' && value !== null) {
        acc[key] = value
      }
      return acc
    }, {})
    
    onApply(appliedFilters)
  }
  
  return (
    <div className="space-y-6 px-1">
      <div className="space-y-3">
        <Label className="text-base font-medium">分类</Label>
        <Select value={filters.category_id} onValueChange={(value) => handleChange('category_id', value)}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">全部分类</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-3">
        <Label className="text-base font-medium">购买日期</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">从</Label>
            <DatePicker
              date={filters.purchase_date_from}
              setDate={(date) => handleChange('purchase_date_from', date)}
              placeholder="开始日期"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">至</Label>
            <DatePicker
              date={filters.purchase_date_to}
              setDate={(date) => handleChange('purchase_date_to', date)}
              placeholder="结束日期"
              className="h-11"
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <Label className="text-base font-medium">过期日期</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">从</Label>
            <DatePicker
              date={filters.expiry_date_from}
              setDate={(date) => handleChange('expiry_date_from', date)}
              placeholder="开始日期"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">至</Label>
            <DatePicker
              date={filters.expiry_date_to}
              setDate={(date) => handleChange('expiry_date_to', date)}
              placeholder="结束日期"
              className="h-11"
            />
          </div>
        </div>
      </div>
      
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
      
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">公开状态</Label>
        <Select 
          value={filters.is_public !== null ? filters.is_public.toString() : 'none'}
          onValueChange={(value) => {
            if (value === 'none') {
              handleChange('is_public', null)
            } else {
              handleChange('is_public', value === 'true')
            }
          }}
        >
          <SelectTrigger className="w-[120px] h-11">
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">全部</SelectItem>
            <SelectItem value="true">公开</SelectItem>
            <SelectItem value="false">私有</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-between pt-6 pb-2 gap-3">
        <Button variant="outline" onClick={handleReset} className="flex-1 h-11">重置</Button>
        <Button onClick={handleApply} className="flex-1 h-11">应用筛选</Button>
      </div>
    </div>
  )
} 