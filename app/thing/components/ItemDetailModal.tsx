'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Edit, Trash2, Lock, Unlock, X } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import ImagePlaceholder from '@/components/ui/icons/image-placeholder'
import { toast } from 'sonner'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useItem } from '../services/api'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { TagsDisplay } from './item-detail/components/TagsDisplay'
import { ImageGallery } from './item-detail/components/ImageGallery'
import { InfoCard } from './item-detail/components/InfoCard'
import { StatusBadges } from './item-detail/components/StatusBadges'
import { LocationInfo } from './item-detail/components/LocationInfo'
import { TimeInfo } from './item-detail/components/TimeInfo'
import { formatDate, formatDateTime } from './item-detail/utils/dateUtils'
import {
  Item,
  Tag,
  ItemFormData,
  UploadedImage,
  LocationSelection,
  Room,
  Spot,
} from '@/app/thing/types'
import { ItemRelationsDisplay } from './ItemRelationsDisplay'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from './LoadingState'
import AutoSaveStatus from './AutoSaveStatus'
import UnifiedBasicInfoForm from './forms/UnifiedBasicInfoForm'
import UnifiedDetailInfoForm from './forms/UnifiedDetailInfoForm'
import CreateTagDialog from './CreateTagDialog'
import {
  convertImagesToUploadedFormat,
  buildLocationPath,
  tagsToIdStrings,
  hasDataChanged,
} from '../utils/dataTransform'
import { INITIAL_FORM_DATA, AUTO_SAVE_DELAY } from '../constants'
import { useAutoSave } from '../hooks/useAutoSave'
import { useAreas, useRooms, useSpots } from '../services/api'
import { apiRequest } from '@/lib/api'

interface ItemDetailModalProps {
  itemId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: 'view' | 'edit'
  onModeChange?: (mode: 'view' | 'edit') => void
  onItemDeleted?: () => void
}

export function ItemDetailModal({
  itemId,
  open,
  onOpenChange,
  mode: externalMode,
  onModeChange,
  onItemDeleted,
}: ItemDetailModalProps) {
  const [internalMode, setInternalMode] = useState<'view' | 'edit'>('view')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'basic' | 'details'>('basic')

  const mode = externalMode ?? internalMode
  const setMode = onModeChange ?? setInternalMode

  const { data: item, error, isLoading: loading } = useItem(itemId ?? 0)
  const { deleteItem } = useItemStore()
  const { user } = useAuth()

  // 检查是否可以编辑（是否为物品所有者）
  const canEdit = useMemo(() => {
    return user && item && item.user?.id === user.id
  }, [user, item])

  // 编辑模式状态
  const [editLoading, setEditLoading] = useState(false)
  const [formData, setFormData] = useState<ItemFormData>(INITIAL_FORM_DATA)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection>(undefined)
  const [locationPath, setLocationPath] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)
  const editInitializedRef = useRef<number | null>(null) // 记录已初始化的itemId

  const { categories, tags, fetchCategories, fetchTags, getItem, updateItem } = useItemStore()
  const { mutate: refreshAreas } = useAreas()
  const { data: rooms = [], mutate: refreshRooms } = useRooms<Room[]>()
  const { data: spots = [], mutate: refreshSpots } = useSpots<Spot[]>()

  // 使用 ref 存储 refreshAreas，避免依赖变化
  const refreshAreasRef = useRef(refreshAreas)
  useEffect(() => {
    refreshAreasRef.current = refreshAreas
  }, [refreshAreas])

  // 自动保存
  interface AutoSaveData {
    formData: ItemFormData
    selectedTags: string[]
    uploadedImages: UploadedImage[]
  }

  const handleAutoSave = useCallback(async () => {
    // 检查是否还在编辑模式且弹窗打开
    if (!itemId || !item || mode !== 'edit' || !open) {
      return
    }

    // 验证表单数据是否有效
    if (!formData.name || !formData.name.trim()) {
      // 如果名称为空，不保存
      return
    }

    const updateData: Parameters<typeof updateItem>[1] = {
      ...formData,
      purchase_date: formData.purchase_date ?? null,
      expiry_date: formData.expiry_date ?? null,
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
      category_id: formData.category_id ? String(formData.category_id) : '',
      area_id: formData.area_id ? String(formData.area_id) : '',
      room_id: formData.room_id ? String(formData.room_id) : '',
      spot_id: formData.spot_id ? String(formData.spot_id) : '',
      image_ids: uploadedImages
        .filter(img => img.id)
        .map(img => img.id!)
        .filter((id): id is number => id !== undefined),
      image_paths: uploadedImages.filter(img => !img.id).map(img => img.path),
      tags: selectedTags
        .map(id => tags.find(tag => tag.id.toString() === id))
        .filter((tag): tag is Tag => tag !== undefined),
    }
    await updateItem(itemId, updateData)
  }, [formData, uploadedImages, selectedTags, tags, updateItem, itemId, item, mode, open])

  const { autoSaving, lastSaved, triggerAutoSave, setInitialData, cancelAutoSave } =
    useAutoSave<AutoSaveData>({
      onSave: handleAutoSave,
      delay: AUTO_SAVE_DELAY,
    })

  // 位置相关函数
  const loadRooms = useCallback(
    async (areaId: string | number) => {
      if (!areaId) return
      try {
        await apiRequest<Room[]>(`/areas/${areaId}/rooms`)
        refreshRooms()
      } catch (error) {
        console.error('加载房间失败', error)
      }
    },
    [refreshRooms]
  )

  const loadSpots = useCallback(
    async (roomId: string | number) => {
      if (!roomId) return
      try {
        await apiRequest<Spot[]>(`/rooms/${roomId}/spots`)
        refreshSpots()
      } catch (error) {
        console.error('加载位置失败', error)
      }
    },
    [refreshSpots]
  )

  const handleLocationSelect = useCallback(
    (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => {
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
    },
    [rooms, spots]
  )

  const handleTagCreated = useCallback(
    (tag: Tag) => {
      fetchTags()
      setSelectedTags(prev => [...prev, tag.id.toString()])
    },
    [fetchTags]
  )

  // 初始化编辑数据 - 使用 ref 访问 item，避免依赖变化
  const itemRef = useRef(item)
  useEffect(() => {
    itemRef.current = item
  }, [item])

  const initializeEditData = useCallback(async () => {
    const currentItem = itemRef.current
    if (!itemId || !currentItem) return

    // 如果已经初始化过这个item，不再重复初始化
    if (editInitializedRef.current === itemId) return

    setEditLoading(true)
    editInitializedRef.current = itemId
    try {
      const itemFormData: ItemFormData = {
        name: currentItem.name,
        description: currentItem.description || '',
        quantity: currentItem.quantity,
        status: currentItem.status,
        purchase_date: currentItem.purchase_date ? new Date(currentItem.purchase_date) : null,
        expiry_date: currentItem.expiry_date ? new Date(currentItem.expiry_date) : null,
        purchase_price: currentItem.purchase_price || null,
        category_id: currentItem.category_id?.toString() || '',
        area_id: currentItem.spot?.room?.area?.id?.toString() || '',
        room_id: currentItem.spot?.room?.id?.toString() || '',
        spot_id: currentItem.spot_id?.toString() || '',
        is_public: currentItem.is_public,
      }

      setFormData(itemFormData)

      if (currentItem.images && currentItem.images.length > 0) {
        setUploadedImages(convertImagesToUploadedFormat(currentItem.images))
      }

      await Promise.all([fetchCategories(), fetchTags()])

      if (currentItem.spot?.room?.area?.id) {
        await loadRooms(currentItem.spot.room.area.id)
      }

      if (currentItem.spot?.room?.id) {
        await loadSpots(currentItem.spot.room.id)
      }

      // 设置位置信息
      if (currentItem.spot_id) {
        setSelectedLocation({ type: 'spot', id: currentItem.spot_id })
        setLocationPath(
          buildLocationPath(
            currentItem.spot?.room?.area?.name,
            currentItem.spot?.room?.name,
            currentItem.spot?.name
          )
        )
      } else if (currentItem.room_id) {
        setSelectedLocation({ type: 'room', id: currentItem.room_id })
        setLocationPath(
          buildLocationPath(currentItem.spot?.room?.area?.name, currentItem.spot?.room?.name)
        )
      } else if (currentItem.area_id) {
        setSelectedLocation({ type: 'area', id: currentItem.area_id })
        setLocationPath(buildLocationPath(currentItem.spot?.room?.area?.name))
      }

      if (currentItem.tags?.length) {
        setSelectedTags(tagsToIdStrings(currentItem.tags))
      }

      // 设置自动保存的初始数据
      const initialData: AutoSaveData = {
        formData: itemFormData,
        selectedTags: currentItem.tags ? tagsToIdStrings(currentItem.tags) : [],
        uploadedImages: currentItem.images ? convertImagesToUploadedFormat(currentItem.images) : [],
      }
      setInitialData(initialData)
    } catch (error) {
      console.error('初始化编辑数据失败', error)
      toast.error('加载编辑数据失败')
    } finally {
      setEditLoading(false)
    }
  }, [
    itemId,
    fetchCategories,
    fetchTags,
    loadRooms,
    loadSpots,
    setInitialData,
    // item 通过 ref 访问，不放在依赖项中
  ])

  // 监听数据变化，触发自动保存
  const initialDataRef = useRef<AutoSaveData | null>(null)

  useEffect(() => {
    // 只在编辑模式、弹窗打开、数据加载完成时才触发自动保存
    if (mode !== 'edit' || editLoading || !item || !open) return

    const currentData: AutoSaveData = {
      formData,
      selectedTags,
      uploadedImages: uploadedImages,
    }

    // 如果是第一次设置数据，直接保存为初始数据
    if (!initialDataRef.current) {
      initialDataRef.current = currentData
      return
    }

    // 检查是否有数据变化
    const hasChanges = hasDataChanged(currentData, initialDataRef.current)
    if (hasChanges) {
      triggerAutoSave()
      // 更新参考数据
      initialDataRef.current = currentData
    }
  }, [formData, selectedTags, uploadedImages, mode, editLoading, item, open, triggerAutoSave])

  // 当初始数据设置时，更新 ref（在 initializeEditData 完成后）
  useEffect(() => {
    if (mode === 'edit' && !editLoading && item && formData.name) {
      const currentData: AutoSaveData = {
        formData,
        selectedTags,
        uploadedImages: uploadedImages,
      }
      // 只在 ref 为空时设置，避免覆盖已设置的初始数据
      if (!initialDataRef.current) {
        initialDataRef.current = currentData
      }
    }
    // formData, selectedTags, uploadedImages 通过 ref 访问，不需要放在依赖项中
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, editLoading, item, formData.name])

  // 区域变化时加载房间
  useEffect(() => {
    if (mode !== 'edit' || !formData.area_id) {
      if (mode === 'edit') {
        setFormData(prev => ({ ...prev, room_id: '', spot_id: '' }))
      }
      return
    }
    loadRooms(formData.area_id)
  }, [formData.area_id, loadRooms, mode])

  // 房间变化时加载位置
  useEffect(() => {
    if (mode !== 'edit' || !formData.room_id) {
      if (mode === 'edit') {
        setFormData(prev => ({ ...prev, spot_id: '' }))
      }
      return
    }
    loadSpots(formData.room_id)
  }, [formData.room_id, loadSpots, mode])

  // 切换到编辑模式时初始化数据
  useEffect(() => {
    // 只在满足所有条件且未初始化时才执行
    if (
      mode === 'edit' &&
      item &&
      !editLoading &&
      itemId &&
      editInitializedRef.current !== itemId
    ) {
      // 重置Tab到基本信息
      setActiveTab('basic')
      initializeEditData()
      refreshAreasRef.current()
    }
  }, [mode, item, editLoading, itemId, initializeEditData])

  const watchAreaId = formData.area_id
  const watchRoomId = formData.room_id
  const watchSpotId = formData.spot_id

  // 当itemId变化时，重置初始化标记
  useEffect(() => {
    if (itemId && editInitializedRef.current !== itemId) {
      // itemId变化时，重置初始化标记，允许重新初始化
      if (editInitializedRef.current !== null) {
        editInitializedRef.current = null
      }
    }
  }, [itemId])

  // 当弹窗关闭时重置状态
  useEffect(() => {
    if (!open) {
      // 清除自动保存定时器
      cancelAutoSave()
      setInternalMode('view')
      setActiveImageIndex(0)
      setActiveTab('basic')
      setDeleteDialogOpen(false)
      editInitializedRef.current = null // 重置初始化标记
      setEditLoading(false)
      setFormData(INITIAL_FORM_DATA)
      setUploadedImages([])
      setSelectedTags([])
      setSelectedLocation(undefined)
      setLocationPath('')
      // 清空自动保存的初始数据
      setInitialData({
        formData: INITIAL_FORM_DATA,
        selectedTags: [],
        uploadedImages: [],
      })
    }
  }, [open, cancelAutoSave, setInitialData])

  // 当itemId变化时，如果是编辑模式，需要重新初始化编辑数据
  useEffect(() => {
    if (open && itemId && mode === 'edit' && item) {
      // useItemEdit hook会自动处理数据初始化
    }
  }, [open, itemId, mode, item])

  // Keep active image index within bounds whenever images change
  useEffect(() => {
    const length = item?.images?.length ?? 0
    if (length === 0) {
      if (activeImageIndex !== 0) setActiveImageIndex(0)
      return
    }
    if (activeImageIndex > length - 1) setActiveImageIndex(0)
    if (activeImageIndex < 0) setActiveImageIndex(0)
  }, [item?.images, activeImageIndex])

  const handleEdit = useCallback(() => {
    if (!itemId || !canEdit) return
    setMode('edit')
  }, [itemId, canEdit, setMode])

  const handleDelete = useCallback(async () => {
    try {
      if (!itemId) throw new Error('无效的物品编号')
      await deleteItem(itemId)
      toast.success('物品已成功删除')
      setDeleteDialogOpen(false)
      onOpenChange(false)
      onItemDeleted?.()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发生错误，请重试')
    }
  }, [deleteItem, itemId, onOpenChange, onItemDeleted])

  const handleClose = useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  // 编辑模式：显示编辑表单
  if (mode === 'edit' && itemId) {
    // 如果数据还在加载或者item还没有加载完成，显示加载状态
    if (editLoading || !item || loading) {
      return (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="flex h-[85vh] w-[calc(100vw-1rem)] max-w-4xl flex-col sm:w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle className="sr-only">编辑物品</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <LoadingState onBack={handleClose} />
            </div>
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="flex h-[85vh] w-[calc(100vw-1rem)] max-w-4xl flex-col p-0 sm:w-[calc(100vw-2rem)]">
            <DialogHeader className="sr-only">
              <DialogTitle>编辑物品{item?.name ? ` - ${item.name}` : ''}</DialogTitle>
            </DialogHeader>
            {/* 顶部Tab和X按钮 */}
            <div className="bg-background sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b px-6 py-4">
              <Tabs
                value={activeTab}
                onValueChange={v => setActiveTab(v as 'basic' | 'details')}
                className="flex-1"
              >
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="details">详细信息</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                {autoSaving !== undefined && lastSaved !== undefined && (
                  <AutoSaveStatus autoSaving={autoSaving} lastSaved={lastSaved} />
                )}
                <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* 编辑表单内容 - 可滚动区域 */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <Tabs
                value={activeTab}
                onValueChange={v => setActiveTab(v as 'basic' | 'details')}
                className="w-full"
              >
                <TabsContent value="basic" className="mt-6 space-y-6">
                  <UnifiedBasicInfoForm
                    formData={formData}
                    setFormData={setFormData}
                    tags={tags}
                    selectedTags={selectedTags}
                    setSelectedTags={setSelectedTags}
                    setCreateTagDialogOpen={setCreateTagDialogOpen}
                    categories={categories}
                    uploadedImages={uploadedImages}
                    setUploadedImages={setUploadedImages}
                    locationPath={locationPath}
                    selectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    watchAreaId={watchAreaId}
                    watchRoomId={watchRoomId}
                    watchSpotId={watchSpotId}
                  />
                </TabsContent>
                <TabsContent value="details" className="mt-6 space-y-6">
                  <UnifiedDetailInfoForm formData={formData} setFormData={setFormData} />
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>

        {/* 创建标签对话框 */}
        <CreateTagDialog
          open={createTagDialogOpen}
          onOpenChange={setCreateTagDialogOpen}
          onTagCreated={handleTagCreated}
        />

        {/* 删除确认对话框 */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          itemName={item?.name || ''}
        />
      </>
    )
  }

  // 查看模式：显示物品详情
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[85vh] w-[calc(100vw-2rem)] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle className="sr-only">加载物品详情</DialogTitle>
          </DialogHeader>
          <div className="flex flex-1 items-center justify-center overflow-y-auto">
            <LoadingState onBack={handleClose} />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error || (!loading && !item)) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-4xl sm:w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle className="sr-only">错误</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-red-500">{error?.message || '物品不存在'}</p>
            <Button onClick={handleClose} variant="outline">
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!item) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[85vh] w-[calc(100vw-2rem)] max-w-4xl flex-col p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>物品详情{item.name ? ` - ${item.name}` : ''}</DialogTitle>
          </DialogHeader>
          {/* 顶部Tab和X按钮 */}
          <div className="bg-background sticky top-0 z-10 flex flex-shrink-0 items-center justify-between border-b px-6 py-4">
            <Tabs
              value={activeTab}
              onValueChange={v => setActiveTab(v as 'basic' | 'details')}
              className="flex-1"
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="details">详细信息</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleEdit} className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 内容区域 - 可滚动区域 */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <Tabs
              value={activeTab}
              onValueChange={v => setActiveTab(v as 'basic' | 'details')}
              className="w-full"
            >
              {/* 基本信息标签页 */}
              <TabsContent value="basic" className="mt-6">
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <StatusBadges item={item} />
                    <TagsDisplay tags={item.tags || []} />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 图片展示 */}
                    <ImageGallery
                      images={item.images}
                      itemName={item.name}
                      activeIndex={activeImageIndex}
                      onIndexChange={setActiveImageIndex}
                    />

                    {/* 描述 */}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <h3 className="text-muted-foreground mb-1 text-sm font-medium">描述</h3>
                      <p className="text-xs">{item.description || '无描述'}</p>
                    </div>

                    {/* 基本信息卡片 */}
                    {(item.quantity > 1 || item.purchase_price || item.purchase_date) && (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {item.quantity > 1 && <InfoCard label="数量" value={item.quantity} />}
                        {item.purchase_price && (
                          <InfoCard label="价格" value={`¥${item.purchase_price}`} />
                        )}
                        {item.purchase_date && (
                          <InfoCard label="购买日期" value={formatDate(item.purchase_date)} />
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 详细信息标签页 */}
              <TabsContent value="details" className="mt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* 时间信息 */}
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle>时间信息</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeInfo item={item} />
                    </CardContent>
                  </Card>

                  {/* 存放位置 */}
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle>存放位置</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LocationInfo item={item} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={item.name}
      />
    </>
  )
}
