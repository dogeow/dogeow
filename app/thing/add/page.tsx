"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { useItemStore } from '@/stores/itemStore'
import Image from "next/image"
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LocationTreeSelect from '../components/LocationTreeSelect'
import { apiRequest } from '@/utils/api'
import ImageUploader from '../components/ImageUploader'

// 图片上传类型
type UploadedImage = {
  path: string;
  thumbnail_path: string;
  url: string;
  thumbnail_url: string;
}

export default function AddItem() {
  const router = useRouter()
  const { createItem, fetchCategories, categories } = useItemStore()
  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [spots, setSpots] = useState<any[]>([])
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    status: 'active',
    purchase_date: null as string | null,
    expiry_date: null as string | null,
    purchase_price: null as number | null,
    category_id: '',
    area_id: '',
    room_id: '',
    spot_id: '',
    is_public: false,
  })
  
  // 添加新的状态
  const [selectedLocation, setSelectedLocation] = useState<{ type: 'area' | 'room' | 'spot', id: number } | undefined>(undefined)
  const [locationPath, setLocationPath] = useState<string>('')
  
  // 加载分类和位置数据
  useEffect(() => {
    const loadData = async () => {
      // 加载分类
      await fetchCategories()
      
      // 加载区域
      try {
        const data = await apiRequest<any[]>('/areas')
        setAreas(data)
      } catch (error) {
        console.error('加载区域失败', error)
      }
    }
    
    loadData()
  }, [fetchCategories])
  
  // 当选择区域时加载房间
  useEffect(() => {
    if (!formData.area_id) {
      setRooms([])
      setFormData(prev => ({ ...prev, room_id: '', spot_id: '' }))
      return
    }
    
    const fetchRooms = async () => {
      try {
        const data = await apiRequest<any[]>(`/areas/${formData.area_id}/rooms`)
        setRooms(data)
      } catch (error) {
        console.error('加载房间失败', error)
      }
    }
    
    fetchRooms()
  }, [formData.area_id])
  
  // 当选择房间时加载位置
  useEffect(() => {
    if (!formData.room_id) {
      setSpots([])
      setFormData(prev => ({ ...prev, spot_id: '' }))
      return
    }
    
    const fetchSpots = async () => {
      try {
        const data = await apiRequest<any[]>(`/rooms/${formData.room_id}/spots`)
        setSpots(data)
      } catch (error) {
        console.error('加载位置失败', error)
      }
    }
    
    fetchSpots()
  }, [formData.room_id])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'number') {
      // 对于数字类型的输入，转换为数字或null
      const numValue = value === '' ? null : Number(value);
      setFormData(prev => ({ ...prev, [name]: numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }
  
  const handleSelectChange = (name: string, value: string) => {
    // 将 "none" 值转换为空字符串
    const actualValue = value === "none" ? "" : value;
    setFormData(prev => ({ ...prev, [name]: actualValue }))
  }
  
  const handleDateChange = (name: 'purchase_date' | 'expiry_date', date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: date ? format(date, 'yyyy-MM-dd') : null
    }));
  }
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }
  
  const handleUploadedImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images)
  }
  
  // 处理位置选择
  const handleLocationSelect = (type: 'area' | 'room' | 'spot', id: number, fullPath: string) => {
    setSelectedLocation({ type, id })
    setLocationPath(fullPath)
    
    // 更新表单数据
    if (type === 'area') {
      setFormData(prev => ({ 
        ...prev, 
        area_id: id.toString(),
        room_id: '',
        spot_id: ''
      }))
    } else if (type === 'room') {
      setFormData(prev => ({ 
        ...prev, 
        room_id: id.toString(),
        spot_id: ''
      }))
      
      // 查找该房间所属的区域
      const room = rooms.find(r => r.id === id)
      if (room && room.area_id) {
        setFormData(prev => ({ ...prev, area_id: room.area_id.toString() }))
      }
    } else if (type === 'spot') {
      setFormData(prev => ({ ...prev, spot_id: id.toString() }))
      
      // 查找该位置所属的房间
      const spot = spots.find(s => s.id === id)
      if (spot && spot.room_id) {
        setFormData(prev => ({ ...prev, room_id: spot.room_id.toString() }))
        
        // 查找该房间所属的区域
        const room = rooms.find(r => r.id === spot.room_id)
        if (room && room.area_id) {
          setFormData(prev => ({ ...prev, area_id: room.area_id.toString() }))
        }
      }
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 准备提交数据
      const itemData = {
        ...formData,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        area_id: formData.area_id ? Number(formData.area_id) : null,
        room_id: formData.room_id ? Number(formData.room_id) : null,
        spot_id: formData.spot_id ? Number(formData.spot_id) : null,
        image_paths: uploadedImages.map(img => img.path),
      }
      
      // 提交请求
      const toast_id = toast.loading("正在创建物品...");
      const newItem = await createItem(itemData)
      
      toast.success("物品创建成功", { id: toast_id })
      router.push(`/thing/${newItem.id}`)
    } catch (error) {
      console.error("创建物品失败:", error)
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push('/thing')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">添加物品</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="pb-20">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="details">详细信息</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
                <CardDescription>填写物品的基本信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">名称</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">数量</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">状态</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">正常</SelectItem>
                        <SelectItem value="inactive">闲置</SelectItem>
                        <SelectItem value="expired">已过期</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category_id">分类</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => handleSelectChange('category_id', value)}
                    >
                      <SelectTrigger id="category_id">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">未分类</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="is_public" className="flex items-center space-x-2">
                      <Switch
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => handleSwitchChange('is_public', checked)}
                      />
                      <span>公开物品</span>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>图片</CardTitle>
                <CardDescription>上传物品的图片</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label htmlFor="images">物品图片</Label>
                  <ImageUploader 
                    onImagesChange={handleUploadedImagesChange}
                    existingImages={[]}
                    maxImages={10}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>详细信息</CardTitle>
                <CardDescription>填写物品的详细信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">购买日期</Label>
                    <DatePicker
                      date={formData.purchase_date ? new Date(formData.purchase_date) : null}
                      setDate={(date) => handleDateChange('purchase_date', date)}
                      placeholder="选择日期"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">过期日期</Label>
                    <DatePicker
                      date={formData.expiry_date ? new Date(formData.expiry_date) : null}
                      setDate={(date) => handleDateChange('expiry_date', date)}
                      placeholder="选择日期"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchase_price">购买价格</Label>
                    <Input
                      id="purchase_price"
                      name="purchase_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.purchase_price === null ? '' : formData.purchase_price}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>存放位置</CardTitle>
                <CardDescription>设置物品的存放位置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label>区域</Label>
                    <div className="text-sm font-medium mt-1">
                      {formData.area_id ? areas.find(a => a.id.toString() === formData.area_id)?.name || '未选择' : '未选择'}
                    </div>
                  </div>
                  <div>
                    <Label>房间</Label>
                    <div className="text-sm font-medium mt-1">
                      {formData.room_id ? rooms.find(r => r.id.toString() === formData.room_id)?.name || '未选择' : '未选择'}
                    </div>
                  </div>
                  <div>
                    <Label>具体位置</Label>
                    <div className="text-sm font-medium mt-1">
                      {formData.spot_id ? spots.find(s => s.id.toString() === formData.spot_id)?.name || '未选择' : '未选择'}
                    </div>
                  </div>
                </div>
                
                <LocationTreeSelect 
                  onSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                />
                
                {locationPath && (
                  <div className="text-xs text-muted-foreground">
                    当前选择: {locationPath}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 sticky bottom-4 bg-background p-4 rounded-lg shadow-lg mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/thing')}
          >
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : '保存物品'}
          </Button>
        </div>
      </form>
    </div>
  )
} 