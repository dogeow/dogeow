"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import LocationTreeSelect from '../components/LocationTreeSelect'
import { apiRequest } from '@/utils/api'
import ImageUploader from '../components/ImageUploader'
import { Badge } from "@/components/ui/badge"
import CreateTagDialog from '../components/CreateTagDialog'
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as SelectPrimitive from "@radix-ui/react-select"

// 图片上传类型
type UploadedImage = {
  path: string;
  thumbnail_path: string;
  url: string;
  thumbnail_url: string;
}

// 标签类型
type Tag = {
  id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export default function AddItem() {
  const router = useRouter()
  const { createItem, fetchCategories, fetchTags, categories, tags } = useItemStore()
  const [loading, setLoading] = useState(false)
  const [areas, setAreas] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [spots, setSpots] = useState<any[]>([])
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)
  
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
  
  // 加载分类、标签和位置数据
  useEffect(() => {
    const loadData = async () => {
      // 加载分类
      await fetchCategories()
      
      // 加载标签
      await fetchTags()
      
      // 加载区域
      try {
        const data = await apiRequest<any[]>('/areas')
        setAreas(data)
        
        // 检查URL是否有预设的位置信息
        const searchParams = new URLSearchParams(window.location.search);
        const areaId = searchParams.get('area_id');
        const roomId = searchParams.get('room_id');
        const spotId = searchParams.get('spot_id');
        
        if (areaId) {
          setFormData(prev => ({ ...prev, area_id: areaId }));
          
          // 如果有区域ID，加载该区域的房间
          try {
            const rooms = await apiRequest<any[]>(`/areas/${areaId}/rooms`);
            setRooms(rooms);
            
            if (roomId) {
              setFormData(prev => ({ ...prev, room_id: roomId }));
              
              // 如果有房间ID，加载该房间的位置
              try {
                const spots = await apiRequest<any[]>(`/rooms/${roomId}/spots`);
                setSpots(spots);
                
                if (spotId) {
                  setFormData(prev => ({ ...prev, spot_id: spotId }));
                }
              } catch (error) {
                console.error('加载位置失败', error);
              }
            }
          } catch (error) {
            console.error('加载房间失败', error);
          }
        }
      } catch (error) {
        console.error('加载区域失败', error)
      }
    }
    
    loadData()
  }, [fetchCategories, fetchTags])
  
  // 加载初始位置数据
  useEffect(() => {
    const loadInitialLocationData = async () => {
      // 如果已有位置ID但没有对应的位置数据，需要主动加载
      if (formData.area_id && areas.length === 0) {
        try {
          const data = await apiRequest<any[]>('/areas')
          setAreas(data)
        } catch (error) {
          console.error('加载区域失败', error)
        }
      }
      
      if (formData.room_id && rooms.length === 0 && formData.area_id) {
        try {
          const data = await apiRequest<any[]>(`/areas/${formData.area_id}/rooms`)
          setRooms(data)
        } catch (error) {
          console.error('加载房间失败', error)
        }
      }
      
      if (formData.spot_id && spots.length === 0 && formData.room_id) {
        try {
          const data = await apiRequest<any[]>(`/rooms/${formData.room_id}/spots`)
          setSpots(data)
        } catch (error) {
          console.error('加载位置失败', error)
        }
      }
    }
    
    if (formData.area_id || formData.room_id || formData.spot_id) {
      loadInitialLocationData()
    }
  }, [formData.area_id, formData.room_id, formData.spot_id, areas.length, rooms.length, spots.length])
  
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
  
  // 检查位置数据是否正在加载
  const isLocationLoading = useCallback(() => {
    if (formData.area_id && areas.length === 0) return true;
    if (formData.room_id && rooms.length === 0) return true;
    if (formData.spot_id && spots.length === 0) return true;
    return false;
  }, [formData.area_id, formData.room_id, formData.spot_id, areas.length, rooms.length, spots.length]);
  
  // 当位置信息变化时，更新位置路径显示
  useEffect(() => {
    const updateLocationPath = async () => {
      let path = '';
      
      // 有区域ID
      if (formData.area_id && areas.length > 0) {
        const area = areas.find(a => a.id.toString() === formData.area_id);
        if (area) {
          path = area.name;
          
          // 有房间ID
          if (formData.room_id && rooms.length > 0) {
            const room = rooms.find(r => r.id.toString() === formData.room_id);
            if (room) {
              path += ` > ${room.name}`;
              
              // 有具体位置ID
              if (formData.spot_id && spots.length > 0) {
                const spot = spots.find(s => s.id.toString() === formData.spot_id);
                if (spot) {
                  path += ` > ${spot.name}`;
                }
              }
            }
          }
        }
      }
      
      // 如果构建了路径，更新显示
      if (path) {
        setLocationPath(path);
        
        // 设置选中的位置类型
        if (formData.spot_id && spots.length > 0) {
          setSelectedLocation({ type: 'spot', id: Number(formData.spot_id) });
        } else if (formData.room_id && rooms.length > 0) {
          setSelectedLocation({ type: 'room', id: Number(formData.room_id) });
        } else if (formData.area_id && areas.length > 0) {
          setSelectedLocation({ type: 'area', id: Number(formData.area_id) });
        }
      } else if (!formData.area_id && !formData.room_id && !formData.spot_id) {
        // 如果没有任何位置ID，清空路径
        setLocationPath('');
        setSelectedLocation(undefined);
      }
      // 注意：如果有位置ID但没有构建路径，可能是因为数据还未加载完成，保留原来的路径不变
    };
    
    updateLocationPath();
  }, [formData.area_id, formData.room_id, formData.spot_id, areas, rooms, spots]);
  
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
      const itemData: any = {
        ...formData,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        area_id: formData.area_id ? Number(formData.area_id) : null,
        room_id: formData.room_id ? Number(formData.room_id) : null,
        spot_id: formData.spot_id ? Number(formData.spot_id) : null,
        image_paths: uploadedImages.map(img => img.path),
        tags: selectedTags.length > 0 ? selectedTags.map(id => Number(id)) : []
      }
      
      // 提交请求
      const toast_id = toast.loading("正在创建物品...")
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
  
  // 处理新创建的标签
  const handleTagCreated = (tag: any) => {
    // 刷新标签列表
    fetchTags()
    
    // 将新创建的标签添加到选中的标签中
    setSelectedTags(prev => [...prev, tag.id.toString()])
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
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">名称</Label>
                    <Input
                      id="name"
                      name="name"
                      className="h-10"
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="category_id">分类</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => handleSelectChange('category_id', value)}
                    >
                      <SelectTrigger id="category_id" className="w-full h-10">
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="start" sideOffset={4} avoidCollisions={false} className="z-[100]">
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
                    <Label htmlFor="quantity">数量</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      className="h-10"
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
                      <SelectTrigger id="status" className="w-full h-10">
                        <SelectValue placeholder="选择状态" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="start" sideOffset={4} avoidCollisions={false} className="z-[100]">
                        <SelectItem value="active">正常</SelectItem>
                        <SelectItem value="inactive">闲置</SelectItem>
                        <SelectItem value="expired">已过期</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="is_public">公开物品</Label>
                    <div className="h-10 flex items-center">
                      <Switch
                        id="is_public"
                        checked={formData.is_public}
                        onCheckedChange={(checked) => handleSwitchChange('is_public', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="images">物品图片</Label>
                    <ImageUploader 
                      onImagesChange={handleUploadedImagesChange}
                      existingImages={[]}
                      maxImages={10}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor="tags">标签</Label>
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
                    </div>
                    
                    <div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {selectedTags.length > 0 ? (
                          selectedTags.map(tagId => {
                            const tag = tags.find(t => t.id.toString() === tagId);
                            return tag ? (
                              <Badge 
                                key={tag.id} 
                                style={getTagStyle(tag.color)}
                                className="py-0.5 px-2 my-0.5 flex items-center"
                              >
                                {tag.name}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                                  onClick={() => setSelectedTags(prev => prev.filter(id => id !== tagId))}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ) : null;
                          })
                        ) : (
                          <div className="text-sm text-muted-foreground">未选择标签</div>
                        )}
                      </div>
                      
                      <div className="text-sm font-medium mb-2">可用标签：</div>
                      <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-1">
                        {tags.map(tag => (
                          <Badge 
                            key={tag.id} 
                            style={getTagStyle(tag.color)}
                            className={`py-0.5 px-2 my-0.5 cursor-pointer transition-opacity ${
                              selectedTags.includes(tag.id.toString()) ? 'opacity-50' : ''
                            }`}
                            onClick={() => {
                              if (selectedTags.includes(tag.id.toString())) {
                                setSelectedTags(prev => prev.filter(id => id !== tag.id.toString()));
                              } else {
                                setSelectedTags(prev => [...prev, tag.id.toString()]);
                              }
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
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
                      value={formData.purchase_price !== null ? formData.purchase_price : ''}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label className="mb-2 block">存放位置</Label>
                  <LocationTreeSelect 
                    onSelect={handleLocationSelect}
                    selectedLocation={
                      formData.spot_id 
                        ? { type: 'spot', id: Number(formData.spot_id) }
                        : formData.room_id 
                          ? { type: 'room', id: Number(formData.room_id) }
                          : formData.area_id 
                            ? { type: 'area', id: Number(formData.area_id) }
                            : undefined
                    }
                  />
                  {locationPath ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      {locationPath}
                    </p>
                  ) : (
                    isLocationLoading() ? (
                      <p className="text-sm text-amber-500 mt-2">
                        位置信息加载中...
                      </p>
                    ) : (
                      formData.area_id || formData.room_id || formData.spot_id ? (
                        <p className="text-sm text-orange-500 mt-2">
                          位置数据不完整，请重新选择
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          未指定位置
                        </p>
                      )
                    )
                  )}
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={loading}>
                {loading ? "处理中..." : "创建物品"}
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