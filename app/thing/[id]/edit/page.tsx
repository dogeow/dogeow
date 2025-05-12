"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Upload, X, Plus, Tag } from "lucide-react"
import { toast } from "sonner"
import { useItemStore } from '@/stores/itemStore'
import Image from "next/image"
import { API_BASE_URL } from '@/utils/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from 'date-fns'
import LocationTreeSelect from '../../components/LocationTreeSelect'
import { useAreas, useRooms, useSpots, useItem } from '@/utils/api'
import { apiRequest } from '@/utils/api'
import ImageUploader from '../../components/ImageUploader'
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectLabel,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select"
import { Badge } from "@/components/ui/badge"
import CreateTagDialog from '../../components/CreateTagDialog'
import QuickCreateTag from '../../components/QuickCreateTag'

// 定义类型
interface ItemImage {
  id: number;
  thumbnail_path: string;
  thumbnail_url?: string;
  path?: string;
  url?: string;
}

// 新增上传图片类型
type UploadedImage = {
  path: string;
  thumbnail_path: string;
  url: string;
  thumbnail_url: string;
  id?: number;
}

type FormData = {
  name: string;
  description: string;
  quantity: number;
  status: string;
  purchase_date: Date | null;
  expiry_date: Date | null;
  purchase_price: string;
  category_id: string;
  area_id: string;
  room_id: string;
  spot_id: string;
  is_public: boolean;
}

type ImagePreview = {
  url: string;
  name: string;
}

export default function EditItem() {
  const params = useParams()
  const router = useRouter()
  const { getItem, updateItem, fetchCategories, categories, fetchTags, tags } = useItemStore()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [existingImages, setExistingImages] = useState<ItemImage[]>([])
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ type: 'area' | 'room' | 'spot', id: number } | undefined>(undefined)
  const [locationPath, setLocationPath] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)
  
  // 使用 SWR hooks 获取数据
  const { data: areas = [], mutate: refreshAreas } = useAreas();
  const { data: rooms = [], mutate: refreshRooms } = useRooms();
  const { data: spots = [], mutate: refreshSpots } = useSpots();
  
  // 表单数据
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    quantity: 1,
    status: 'active',
    purchase_date: null,
    expiry_date: null,
    purchase_price: '',
    category_id: '',
    area_id: '',
    room_id: '',
    spot_id: '',
    is_public: false,
  })
  
  // 加载区域，直接使用 SWR 提供的数据
  
  // 加载特定区域的房间
  const loadRooms = useCallback(async (areaId: string | number) => {
    if (!areaId) return
    
    try {
      // 这里需要获取特定区域下的房间，而不是所有房间
      const data = await apiRequest<any[]>(`/areas/${areaId}/rooms`);
      // 更新本地状态
      refreshRooms();
    } catch (error) {
      console.error('加载房间失败', error)
    }
  }, [refreshRooms])
  
  // 加载特定房间的位置
  const loadSpots = useCallback(async (roomId: string | number) => {
    if (!roomId) return
    
    try {
      // 这里需要获取特定房间下的位置，而不是所有位置
      const data = await apiRequest<any[]>(`/rooms/${roomId}/spots`);
      // 更新本地状态
      refreshSpots();
    } catch (error) {
      console.error('加载位置失败', error)
    }
  }, [refreshSpots])
  
  // 处理上传图片变化
  const handleUploadedImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images)
  }

  // 将现有图片转换为上传组件需要的格式
  const convertExistingImagesToUploadedFormat = useCallback((images: ItemImage[]): UploadedImage[] => {
    return images.map(img => ({
      path: img.path || '', 
      thumbnail_path: img.thumbnail_path || '',
      url: img.url || `${API_BASE_URL.replace('/api', '')}/storage/${img.path || ''}`,
      thumbnail_url: img.thumbnail_url || `${API_BASE_URL.replace('/api', '')}/storage/${img.thumbnail_path || ''}`,
      id: img.id
    }))
  }, [])
  
  // 加载物品数据
  useEffect(() => {
    const loadItem = async () => {
      try {
        const item = await getItem(Number(params.id))
        if (!item) {
          toast.error("物品不存在")
          router.push('/thing')
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
          // 转换为上传组件需要的格式
          const convertedImages = convertExistingImagesToUploadedFormat(item.images)
          setUploadedImages(convertedImages)
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
        
        // 设置位置选择状态
        if (item.spot_id) {
          setSelectedLocation({ type: 'spot', id: item.spot_id })
          if (item.spot?.room?.name && item.spot?.room?.area?.name) {
            setLocationPath(`${item.spot.room.area.name} / ${item.spot.room.name} / ${item.spot.name}`)
          }
        } else if (item.room_id) {
          setSelectedLocation({ type: 'room', id: item.room_id })
          if (item.spot?.room?.name && item.spot?.room?.area?.name) {
            setLocationPath(`${item.spot.room.area.name} / ${item.spot.room.name}`)
          }
        } else if (item.area_id) {
          setSelectedLocation({ type: 'area', id: item.area_id })
          if (item.spot?.room?.area?.name) {
            setLocationPath(item.spot.room.area.name)
          }
        }
        
        // 加载标签
        await fetchTags()
        
        // 如果物品有标签，设置选中的标签
        if (item.tags && Array.isArray(item.tags)) {
          setSelectedTags(item.tags.map((tag: any) => tag.id.toString()))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "发生错误，请重试")
      } finally {
        setInitialLoading(false)
      }
    }
    
    loadItem()
    refreshAreas()
  }, [params.id, getItem, fetchCategories, router, loadRooms, loadSpots, refreshAreas, convertExistingImagesToUploadedFormat, fetchTags])
  
  // 当选择区域时加载房间
  useEffect(() => {
    if (!formData.area_id) {
      // 不能直接修改 SWR 返回的数据，这里只需要加载房间即可
      setFormData(prev => ({ ...prev, room_id: '', spot_id: '' }))
      return
    }
    
    loadRooms(formData.area_id)
  }, [formData.area_id, loadRooms])
  
  // 当选择房间时加载位置
  useEffect(() => {
    if (!formData.room_id) {
      // 不能直接修改 SWR 返回的数据，这里只需要加载位置即可
      setFormData(prev => ({ ...prev, spot_id: '' }))
      return
    }
    
    loadSpots(formData.room_id)
  }, [formData.room_id, loadSpots])
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 准备数据
      const updateData: any = {
        ...formData,
        purchase_date: formData.purchase_date ? format(formData.purchase_date, 'yyyy-MM-dd') : null,
        expiry_date: formData.expiry_date ? format(formData.expiry_date, 'yyyy-MM-dd') : null,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        area_id: formData.area_id ? Number(formData.area_id) : null,
        room_id: formData.room_id ? Number(formData.room_id) : null,
        spot_id: formData.spot_id ? Number(formData.spot_id) : null,
        image_paths: uploadedImages.filter(img => !img.id).map(img => img.path),
        // 提交时将选中的标签ID转换为数字
        tags: selectedTags.map(id => Number(id))
      }
      
      // 提交更新
      const toast_id = toast.loading("正在更新物品...")
      await updateItem(Number(params.id), updateData)
      
      toast.success("物品更新成功", { id: toast_id })
      router.push(`/thing/${params.id}`)
    } catch (error) {
      console.error("更新物品失败:", error)
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
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
  
  // 获取标签样式
  const getTagStyle = (color: string = "#3b82f6") => {
    return {
      backgroundColor: color,
      color: isLightColor(color) ? "#000" : "#fff"
    }
  }

  // 判断颜色是否为浅色
  const isLightColor = (color: string): boolean => {
    const hex = color.replace("#", "")
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155
  }
  
  // 处理新创建的标签
  const handleTagCreated = (tag: any) => {
    // 刷新标签列表
    fetchTags()
    
    // 将新创建的标签添加到选中的标签中
    setSelectedTags(prev => [...prev, tag.id.toString()])
  }
  
  if (initialLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={() => router.push('/thing')} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold">编辑物品</h1>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p>加载中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push('/thing')} className="mr-4">
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
                <CardTitle>标签</CardTitle>
                <CardDescription>编辑物品的标签</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="tags" className="flex justify-between items-center">
                    <span>标签</span>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-7 px-2"
                      onClick={() => setCreateTagDialogOpen(true)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <Tag className="h-3.5 w-3.5 mr-1" />
                      新建标签
                    </Button>
                  </Label>
                  <MultiSelect
                    value={selectedTags}
                    onValueChange={setSelectedTags}
                    closeOnSelect={false}
                  >
                    <MultiSelectTrigger>
                      <MultiSelectValue placeholder="选择标签" />
                    </MultiSelectTrigger>
                    <MultiSelectContent>
                      {tags.map((tag) => (
                        <MultiSelectItem key={tag.id} value={tag.id.toString()}>
                          <Badge 
                            style={getTagStyle(tag.color)}
                            className="mr-2 py-0.5 px-2 my-0.5"
                          >
                            {tag.name}
                          </Badge>
                        </MultiSelectItem>
                      ))}
                    </MultiSelectContent>
                  </MultiSelect>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTags.map(tagId => {
                      const tag = tags.find(t => t.id.toString() === tagId);
                      return tag ? (
                        <Badge 
                          key={tag.id} 
                          style={getTagStyle(tag.color)}
                          className="py-0.5 px-2 my-0.5"
                        >
                          {tag.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                  
                  <div className="mt-3 pt-2 border-t">
                    <div className="text-xs text-muted-foreground mb-2">快速创建标签:</div>
                    <QuickCreateTag onTagCreated={handleTagCreated} />
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
                  <Label>物品图片</Label>
                  <ImageUploader 
                    onImagesChange={handleUploadedImagesChange}
                    existingImages={uploadedImages}
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
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label className="mb-2 block">存放位置</Label>
                  <LocationTreeSelect
                    onSelect={handleLocationSelect}
                    selectedLocation={selectedLocation}
                  />
                  {locationPath && (
                    <p className="text-sm text-muted-foreground mt-2">
                      当前位置: {locationPath}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? "更新中..." : "更新物品"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
      
      {/* 创建标签对话框 */}
      <CreateTagDialog 
        open={createTagDialogOpen} 
        onOpenChange={setCreateTagDialogOpen} 
        onTagCreated={handleTagCreated}
      />
    </div>
  )
}