"use client"

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useItemStore } from '@/app/thing/stores/itemStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAreas, useRooms, useSpots } from '@/lib/api'
import { apiRequest } from '@/lib/api'
import BasicInfoForm from '@/app/thing/components/BasicInfoForm'
import TagsSection from '@/app/thing/components/TagsSection'
import ImageSection from '@/app/thing/components/ImageSection'
import DetailsSection from '@/app/thing/components/DetailsSection'
import { ItemFormData, UploadedImage, Room, Spot, Tag, ItemImage } from '@/app/thing/types'

export default function EditItem() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ type: 'area' | 'room' | 'spot', id: number } | undefined>(undefined)
  const [locationPath, setLocationPath] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  const { 
    categories, 
    tags, 
    fetchCategories, 
    fetchTags, 
    getItem, 
    updateItem 
  } = useItemStore()
  
  const { mutate: refreshAreas } = useAreas()
  const { data: rooms = [], mutate: refreshRooms } = useRooms<Room[]>()
  const { data: spots = [], mutate: refreshSpots } = useSpots<Spot[]>()
  
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    quantity: 1,
    status: 'active',
    purchase_date: null,
    expiry_date: null,
    purchase_price: null,
    category_id: '',
    area_id: '',
    room_id: '',
    spot_id: '',
    is_public: false,
  })

  const loadRooms = useCallback(async (areaId: string | number) => {
    if (!areaId) return
    try {
      await apiRequest<Room[]>(`/areas/${areaId}/rooms`)
      refreshRooms()
    } catch (error) {
      console.error('加载房间失败', error)
    }
  }, [refreshRooms])

  const loadSpots = useCallback(async (roomId: string | number) => {
    if (!roomId) return
    try {
      await apiRequest<Spot[]>(`/rooms/${roomId}/spots`)
      refreshSpots()
    } catch (error) {
      console.error('加载位置失败', error)
    }
  }, [refreshSpots])

  const convertExistingImagesToUploadedFormat = useCallback((images: ItemImage[]): UploadedImage[] => {
    return images.map((img: ItemImage) => ({
      path: img.path || '', 
      thumbnail_path: img.thumbnail_path || '',
      url: img.url || '',
      thumbnail_url: img.thumbnail_url || '',
      id: img.id
    }))
  }, [])

  const handleLocationSelect = useCallback((type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => {
    setSelectedLocation({ type, id })
    setLocationPath(fullPath || '')
    
    const updates: Partial<ItemFormData> = {}
    
    if (type === 'area') {
      updates.area_id = id.toString()
      updates.room_id = ''
      updates.spot_id = ''
    } else if (type === 'room') {
      updates.room_id = id.toString()
      updates.spot_id = ''
      const room = rooms.find(r => r.id === id)
      if (room?.area_id) {
        updates.area_id = room.area_id.toString()
      }
    } else if (type === 'spot') {
      updates.spot_id = id.toString()
      const spot = spots.find(s => s.id === id)
      if (spot?.room_id) {
        updates.room_id = spot.room_id.toString()
        const room = rooms.find(r => r.id === spot.room_id)
        if (room?.area_id) {
          updates.area_id = room.area_id.toString()
        }
      }
    }
    
    setFormData(prev => ({ ...prev, ...updates }))
  }, [rooms, spots])

  const handleTagCreated = useCallback((tag: Tag) => {
    fetchTags()
    setSelectedTags(prev => [...prev, tag.id.toString()])
  }, [fetchTags])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const updateData: Parameters<typeof updateItem>[1] = {
        ...formData,
        purchase_date: formData.purchase_date?.toISOString() || null,
        expiry_date: formData.expiry_date?.toISOString() || null,
        purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
        category_id: formData.category_id ? Number(formData.category_id) : null,
        area_id: formData.area_id ? Number(formData.area_id) : null,
        room_id: formData.room_id ? Number(formData.room_id) : null,
        spot_id: formData.spot_id ? Number(formData.spot_id) : null,
        image_ids: uploadedImages.filter(img => img.id).map(img => img.id!).filter((id): id is number => id !== undefined),
        image_paths: uploadedImages.filter(img => !img.id).map(img => img.path),
        tags: selectedTags.map(id => tags.find(tag => tag.id.toString() === id)).filter((tag): tag is Tag => tag !== undefined)
      }
      
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

  useEffect(() => {
    const loadItem = async () => {
      try {
        const item = await getItem(Number(params.id))
        if (!item) {
          toast.error("物品不存在")
          router.push('/thing')
          return
        }
        
        setFormData({
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          status: item.status,
          purchase_date: item.purchase_date ? new Date(item.purchase_date) : null,
          expiry_date: item.expiry_date ? new Date(item.expiry_date) : null,
          purchase_price: item.purchase_price || null,
          category_id: item.category_id?.toString() || '',
          area_id: item.spot?.room?.area?.id?.toString() || '',
          room_id: item.spot?.room?.id?.toString() || '',
          spot_id: item.spot_id?.toString() || '',
          is_public: item.is_public,
        })
        
        if (item.images && item.images.length > 0) {
          setUploadedImages(convertExistingImagesToUploadedFormat(item.images))
        }
        
        await Promise.all([fetchCategories(), fetchTags()])
        
        if (item.spot?.room?.area?.id) {
          await loadRooms(item.spot.room.area.id)
        }
        
        if (item.spot?.room?.id) {
          await loadSpots(item.spot.room.id)
        }
        
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
        
        if (item.tags?.length) {
          setSelectedTags(item.tags.map((tag: Tag) => tag.id.toString()))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "发生错误，请重试")
      } finally {
        setInitialLoading(false)
      }
    }
    
    loadItem()
    refreshAreas()
  }, [params.id, fetchCategories, fetchTags, loadRooms, loadSpots, refreshAreas, convertExistingImagesToUploadedFormat, getItem, router])


  useEffect(() => {
    if (!formData.area_id) {
      setFormData(prev => ({ ...prev, room_id: '', spot_id: '' }))
      return
    }
    
    loadRooms(formData.area_id)
  }, [formData.area_id, loadRooms])
  
  // 当选择房间时加载位置
  useEffect(() => {
    if (!formData.room_id) {
      setFormData(prev => ({ ...prev, spot_id: '' }))
      return
    }
    
    loadSpots(formData.room_id)
  }, [formData.room_id, loadSpots])
  
  if (initialLoading) {
    return (
      <div className="container mx-auto py-2">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={() => router.push('/thing')} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p>加载中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-2">
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
            <BasicInfoForm 
              formData={formData} 
              setFormData={setFormData} 
              categories={categories} 
            />

            <ImageSection 
              uploadedImages={uploadedImages} 
              setUploadedImages={setUploadedImages} 
            />

            <TagsSection 
              selectedTags={selectedTags} 
              setSelectedTags={setSelectedTags} 
              tags={tags} 
              onTagCreated={handleTagCreated} 
            />
          </TabsContent>
          
          <TabsContent value="details" className="space-y-6">
            <DetailsSection 
              formData={formData} 
              setFormData={setFormData} 
              locationPath={locationPath} 
              selectedLocation={selectedLocation} 
              onLocationSelect={handleLocationSelect} 
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "更新中..." : "更新物品"}
          </Button>
        </div>
      </form>
    </div>
  )
}