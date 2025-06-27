import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from "sonner"
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useAreas, useRooms, useSpots } from '@/lib/api'
import { apiRequest } from '@/lib/api'
import { ItemFormData, UploadedImage, Room, Spot, Tag, ItemImage, LocationSelection } from '@/app/thing/types'
import { useAutoSave } from './useAutoSave'
import { INITIAL_FORM_DATA, AUTO_SAVE_DELAY, ERROR_MESSAGES } from '@/app/thing/constants'
import { convertImagesToUploadedFormat, buildLocationPath, hasDataChanged, tagsToIdStrings } from '@/app/thing/utils/dataTransform'

export function useItemEdit() {
  const params = useParams()
  const router = useRouter()
  
  // 状态管理
  const [initialLoading, setInitialLoading] = useState(true)
  const [formData, setFormData] = useState<ItemFormData>(INITIAL_FORM_DATA)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection>(undefined)
  const [locationPath, setLocationPath] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  // Store hooks
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

  // 自动保存逻辑
  const handleAutoSave = useCallback(async (data: any) => {
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
    
    await updateItem(Number(params.id), updateData)
  }, [formData, uploadedImages, selectedTags, tags, updateItem, params.id])

  const {
    autoSaving,
    lastSaved,
    triggerAutoSave,
    setInitialData
  } = useAutoSave({
    onSave: handleAutoSave,
    delay: AUTO_SAVE_DELAY
  })

  // 位置相关函数
  const loadRooms = useCallback(async (areaId: string | number) => {
    if (!areaId) return
    try {
      await apiRequest<Room[]>(`/areas/${areaId}/rooms`)
      refreshRooms()
    } catch (error) {
      console.error(ERROR_MESSAGES.LOAD_ROOMS_FAILED, error)
    }
  }, [refreshRooms])

  const loadSpots = useCallback(async (roomId: string | number) => {
    if (!roomId) return
    try {
      await apiRequest<Spot[]>(`/rooms/${roomId}/spots`)
      refreshSpots()
    } catch (error) {
      console.error(ERROR_MESSAGES.LOAD_SPOTS_FAILED, error)
    }
  }, [refreshSpots])

  // 使用工具函数替代内联函数
  const convertExistingImagesToUploadedFormat = useCallback(convertImagesToUploadedFormat, [])

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

  // 初始化数据加载
  const initializeItem = useCallback(async () => {
    try {
      const item = await getItem(Number(params.id))
      if (!item) {
        toast.error(ERROR_MESSAGES.ITEM_NOT_FOUND)
        router.push('/thing')
        return
      }
      
      const itemFormData = {
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
      }
      
      setFormData(itemFormData)
      
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
      
      // 设置位置信息
      if (item.spot_id) {
        setSelectedLocation({ type: 'spot', id: item.spot_id })
        setLocationPath(buildLocationPath(
          item.spot?.room?.area?.name,
          item.spot?.room?.name,
          item.spot?.name
        ))
      } else if (item.room_id) {
        setSelectedLocation({ type: 'room', id: item.room_id })
        setLocationPath(buildLocationPath(
          item.spot?.room?.area?.name,
          item.spot?.room?.name
        ))
      } else if (item.area_id) {
        setSelectedLocation({ type: 'area', id: item.area_id })
        setLocationPath(buildLocationPath(item.spot?.room?.area?.name))
      }
      
      if (item.tags?.length) {
        setSelectedTags(tagsToIdStrings(item.tags))
      }
      
      // 设置自动保存的初始数据
      const initialData = {
        formData: itemFormData,
        selectedTags: item.tags ? tagsToIdStrings(item.tags) : [],
        uploadedImages: item.images ? convertExistingImagesToUploadedFormat(item.images) : []
      }
      setInitialData(initialData)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL_ERROR)
    } finally {
      setInitialLoading(false)
    }
  }, [params.id, getItem, router, convertExistingImagesToUploadedFormat, fetchCategories, fetchTags, loadRooms, loadSpots, setInitialData])

  // 监听数据变化，触发自动保存
  const initialDataRef = useRef<any>(null)
  
  useEffect(() => {
    if (!initialDataRef.current || initialLoading) return
    
    // 检查是否有数据变化
    const currentData = {
      formData,
      selectedTags,
      uploadedImages: uploadedImages.map(img => ({ path: img.path, id: img.id }))
    }
    
    const hasChanges = hasDataChanged(currentData, initialDataRef.current)
    
    if (hasChanges) {
      triggerAutoSave()
      // 更新参考数据
      initialDataRef.current = currentData
    }
  }, [formData, selectedTags, uploadedImages, triggerAutoSave, initialLoading])

  // 区域变化时加载房间
  useEffect(() => {
    if (!formData.area_id) {
      setFormData(prev => ({ ...prev, room_id: '', spot_id: '' }))
      return
    }
    loadRooms(formData.area_id)
  }, [formData.area_id, loadRooms])
  
  // 房间变化时加载位置
  useEffect(() => {
    if (!formData.room_id) {
      setFormData(prev => ({ ...prev, spot_id: '' }))
      return
    }
    loadSpots(formData.room_id)
  }, [formData.room_id, loadSpots])

  // 初始化
  useEffect(() => {
    initializeItem()
    refreshAreas()
  }, [initializeItem, refreshAreas])

  return {
    // 状态
    initialLoading,
    formData,
    setFormData,
    uploadedImages,
    setUploadedImages,
    selectedLocation,
    locationPath,
    selectedTags,
    setSelectedTags,
    autoSaving,
    lastSaved,
    
    // 数据
    categories,
    tags,
    
    // 处理函数
    handleLocationSelect,
    handleTagCreated,
    
    // 导航
    router
  }
} 