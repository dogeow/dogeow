"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Upload, X } from "lucide-react"
import { toast } from "sonner"
import { useItemStore } from '@/stores/itemStore'
import Image from "next/image"
import { API_BASE_URL } from '@/configs/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from 'date-fns'

export default function EditItem() {
  const params = useParams()
  const router = useRouter()
  const { getItem, updateItem, fetchCategories, categories } = useItemStore()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [areas, setAreas] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [spots, setSpots] = useState<any[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<{url: string, name: string}[]>([])
  const [existingImages, setExistingImages] = useState<any[]>([])
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    status: 'active',
    purchase_date: null as Date | null,
    expiry_date: null as Date | null,
    purchase_price: '',
    category_id: '',
    area_id: '',
    room_id: '',
    spot_id: '',
    is_public: false,
  })
  
  // 加载物品数据
  useEffect(() => {
    const loadItem = async () => {
      try {
        const item = await getItem(Number(params.id))
        if (!item) {
          toast.error("物品不存在")
          router.push('/things')
          return
        }
        
        // 设置表单数据
        setFormData({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          status: item.status,
          purchase_date: item.purchase_date ? new Date(item.purchase_date) : null,
          expiry_date: item.expiry_date ? new Date(item.expiry_date) : null,
          purchase_price: item.purchase_price?.toString() || '',
          category_id: item.category_id?.toString() || '',
          area_id: item.spot?.room?.area?.id?.toString() || '',
          room_id: item.spot?.room?.id?.toString() || '',
          spot_id: item.spot_id?.toString() || '',
          is_public: item.is_public,
        })
        
        // 设置现有图片
        if (item.images && item.images.length > 0) {
          setExistingImages(item.images)
        }
        
        // 加载分类
        await fetchCategories()
        
        // 如果有区域，加载房间
        if (item.spot?.room?.area?.id) {
          await loadRooms(item.spot.room.area.id)
        }
        
        // 如果有房间，加载位置
        if (item.spot?.room?.id) {
          await loadSpots(item.spot.room.id)
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "发生错误，请重试")
      } finally {
        setInitialLoading(false)
      }
    }
    
    // 加载区域
    const loadAreas = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/areas`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            'Accept': 'application/json',
          },
        })
        
        if (res.ok) {
          const data = await res.json()
          setAreas(data)
        }
      } catch (error) {
        console.error('加载区域失败', error)
      }
    }
    
    loadItem()
    loadAreas()
  }, [params.id, getItem, fetchCategories, router])
  
  // 加载房间
  const loadRooms = async (areaId: string | number) => {
    if (!areaId) return
    
    try {
      const res = await fetch(`${API_BASE_URL}/areas/${areaId}/rooms`, {
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
  
  // 加载位置
  const loadSpots = async (roomId: string | number) => {
    if (!roomId) return
    
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/${roomId}/spots`, {
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
  
  // 当选择区域时加载房间
  useEffect(() => {
    if (!formData.area_id) {
      setRooms([])
      setFormData(prev => ({ ...prev, room_id: '', spot_id: '' }))
      return
    }
    
    loadRooms(formData.area_id)
  }, [formData.area_id])
  
  // 当选择房间时加载位置
  useEffect(() => {
    if (!formData.room_id) {
      setSpots([])
      setFormData(prev => ({ ...prev, spot_id: '' }))
      return
    }
    
    loadSpots(formData.room_id)
  }, [formData.room_id])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    // 将 "none" 值转换为空字符串
    const actualValue = value === "none" ? "" : value;
    setFormData(prev => ({ ...prev, [name]: actualValue }))
  }
  
  const handleDateChange = (name: string, date: Date | null) => {
    setFormData(prev => ({ ...prev, [name]: date }))
  }
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const files = Array.from(e.target.files)
    
    // 添加新文件到现有文件列表
    setImageFiles(prev => [...prev, ...files])
    
    // 创建预览URL
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }))
    
    setImagePreviews(prev => [...prev, ...newPreviews])
  }
  
  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    
    // 释放预览URL
    URL.revokeObjectURL(imagePreviews[index].url)
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }
  
  const removeExistingImage = (imageId: number) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 准备提交数据
      const itemData = {
        ...formData,
        purchase_date: formData.purchase_date ? format(formData.purchase_date, 'yyyy-MM-dd') : null,
        expiry_date: formData.expiry_date ? format(formData.expiry_date, 'yyyy-MM-dd') : null,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        spot_id: formData.spot_id ? Number(formData.spot_id) : null,
        images: imageFiles,
        // 添加要保留的现有图片ID
        image_ids: existingImages.map(img => img.id),
        is_public: Boolean(formData.is_public), // 确保 is_public 是布尔值
      }
      
      // 添加日志输出，查看提交的数据
      console.log('提交的数据:', itemData);
      console.log('is_public 类型:', typeof itemData.is_public);
      console.log('is_public 值:', itemData.is_public);
      
      await updateItem(Number(params.id), itemData)
      
      toast.success("物品已成功更新")
      
      router.push(`/things/${params.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }
  
  if (initialLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <p>加载中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push(`/things/${params.id}`)} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">编辑物品</h1>
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
                <CardDescription>编辑物品的基本信息</CardDescription>
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
                <CardDescription>编辑物品的图片</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>现有图片</Label>
                  {existingImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((image) => (
                        <div key={image.id} className="relative">
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                            <Image
                              src={`http://127.0.0.1:8000/storage/${image.thumbnail_path}`}
                              alt={formData.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={() => removeExistingImage(image.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">无现有图片</p>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="images">上传新图片</Label>
                    <div className="flex flex-wrap items-start gap-4">
                      <label htmlFor="images" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg hover:bg-muted/50">
                          <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">添加图片</span>
                        </div>
                        <input
                          type="file"
                          id="images"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                      
                      {imagePreviews.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative">
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden">
                                <Image
                                  src={preview.url}
                                  alt={preview.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => removeNewImage(index)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>详细信息</CardTitle>
                <CardDescription>编辑物品的详细信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_date">购买日期</Label>
                    <DatePicker
                      date={formData.purchase_date}
                      setDate={(date) => handleDateChange('purchase_date', date)}
                      placeholder="选择日期"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiry_date">过期日期</Label>
                    <DatePicker
                      date={formData.expiry_date}
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
                      value={formData.purchase_price}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>存放位置</CardTitle>
                <CardDescription>编辑物品的存放位置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="area_id">区域</Label>
                  <Select
                    value={formData.area_id}
                    onValueChange={(value) => handleSelectChange('area_id', value)}
                  >
                    <SelectTrigger id="area_id">
                      <SelectValue placeholder="选择区域" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未指定</SelectItem>
                      {areas.map((area) => (
                        <SelectItem key={area.id} value={area.id.toString()}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="room_id">房间</Label>
                  <Select
                    value={formData.room_id}
                    onValueChange={(value) => handleSelectChange('room_id', value)}
                    disabled={!formData.area_id}
                  >
                    <SelectTrigger id="room_id">
                      <SelectValue placeholder={formData.area_id ? "选择房间" : "请先选择区域"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未指定</SelectItem>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="spot_id">具体位置</Label>
                  <Select
                    value={formData.spot_id}
                    onValueChange={(value) => handleSelectChange('spot_id', value)}
                    disabled={!formData.room_id}
                  >
                    <SelectTrigger id="spot_id">
                      <SelectValue placeholder={formData.room_id ? "选择位置" : "请先选择房间"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未指定</SelectItem>
                      {spots.map((spot) => (
                        <SelectItem key={spot.id} value={spot.id.toString()}>
                          {spot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 sticky bottom-4 bg-background p-4 rounded-lg shadow-lg mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/things/${params.id}`)}
          >
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : '保存修改'}
          </Button>
        </div>
      </form>
    </div>
  )
} 