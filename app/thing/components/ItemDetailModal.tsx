'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Modal from '@/components/ui/modal'
import { Edit, Trash2, Lock, LockOpen, X } from 'lucide-react'
import { toast } from 'sonner'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useItem } from '../services/api'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { TagsDisplay } from './item-detail/components/TagsDisplay'
import { ImageGallery } from './item-detail/components/ImageGallery'
import { InfoCard } from './item-detail/components/InfoCard'
import { LocationInfo } from './item-detail/components/LocationInfo'
import { StatusIndicator } from './item-detail/components/StatusIndicator'
import { TimeInfo } from './item-detail/components/TimeInfo'
import { formatDate } from './item-detail/utils/dateUtils'
import ImageUploader from './ImageUploader'
import CategoryTreeSelect from './CategoryTreeSelect'
import { TagsSection } from './forms/components/TagsSection'
import { LocationSection } from './forms/components/LocationSection'
import { QuantityDialog } from './forms/components/QuantityDialog'
import { Tag, ItemFormData, UploadedImage, LocationSelection, Room, Spot } from '@/app/thing/types'
import { useAuth } from '@/hooks/useAuth'
import LoadingState from './item-detail/LoadingState'
import AutoSaveStatus from './item-detail/AutoSaveStatus'
import CreateTagDialog from './item-detail/CreateTagDialog'
import {
  convertImagesToUploadedFormat,
  buildLocationPath,
  tagsToIdStrings,
  hasDataChanged,
} from '../utils/dataTransform'
import { INITIAL_FORM_DATA, AUTO_SAVE_DELAY } from '../constants'
import { useAutoSave } from '@/hooks/useAutoSave'
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
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(1)

  const mode = externalMode ?? internalMode
  const setMode = onModeChange ?? setInternalMode

  const { data: item, error, isLoading: loading } = useItem(itemId ?? 0)
  const { deleteItem } = useItemStore()
  const { user } = useAuth()

  // 检查是否可以编辑（是否为物品所有者）
  const canEdit = useMemo(() => {
    return user && item && item.user?.id === user.id
  }, [user, item])
  const trimmedDescription = item?.description?.trim()
  const hasDescription =
    Boolean(trimmedDescription) &&
    trimmedDescription !== '无描述' &&
    trimmedDescription !== '暂无描述'

  // 编辑模式状态
  const [editLoading, setEditLoading] = useState(false)
  const [formData, setFormData] = useState<ItemFormData>(INITIAL_FORM_DATA)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection>(undefined)
  const [locationPath, setLocationPath] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)
  const editInitializedRef = useRef<number | null>(null) // 记录已初始化的itemId

  const { categories, tags, fetchCategories, fetchTags, updateItem } = useItemStore()
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
      tags: selectedTags.map(id => Number(id)).filter(id => Number.isFinite(id)),
    }
    const updatedItem = await updateItem(itemId, updateData)
    const { mutate } = await import('swr')
    await mutate(`/things/items/${itemId}`, updatedItem, false)
  }, [formData, uploadedImages, selectedTags, updateItem, itemId, item, mode, open])

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
      setLocationPath(fullPath ?? '')

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
        description: currentItem.description ?? '',
        quantity: currentItem.quantity,
        status: currentItem.status,
        purchase_date: currentItem.purchase_date ? new Date(currentItem.purchase_date) : null,
        expiry_date: currentItem.expiry_date ? new Date(currentItem.expiry_date) : null,
        purchase_price: currentItem.purchase_price ?? null,
        category_id: currentItem.category_id?.toString() ?? '',
        area_id: currentItem.spot?.room?.area?.id?.toString() ?? '',
        room_id: currentItem.spot?.room?.id?.toString() ?? '',
        spot_id: currentItem.spot_id?.toString() ?? '',
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
  const formDataRef = useRef(formData)
  const selectedTagsRef = useRef(selectedTags)
  const uploadedImagesRef = useRef(uploadedImages)
  formDataRef.current = formData
  selectedTagsRef.current = selectedTags
  uploadedImagesRef.current = uploadedImages

  useEffect(() => {
    if (mode === 'edit' && !editLoading && item && formData.name) {
      const currentData: AutoSaveData = {
        formData: formDataRef.current,
        selectedTags: selectedTagsRef.current,
        uploadedImages: uploadedImagesRef.current,
      }
      // 只在 ref 为空时设置，避免覆盖已设置的初始数据
      if (!initialDataRef.current) {
        initialDataRef.current = currentData
      }
    }
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
      initializeEditData()
      refreshAreasRef.current()
    }
  }, [mode, item, editLoading, itemId, initializeEditData])

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
      setMode('view')
      setActiveImageIndex(0)
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
  }, [open, cancelAutoSave, setInitialData, setMode])

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

  const handleCategorySelect = useCallback((_type: 'parent' | 'child', id: number | null) => {
    setFormData(prev => ({
      ...prev,
      category_id: id ? String(id) : '',
    }))
  }, [])

  const selectedCategory = useMemo(() => {
    if (!formData.category_id) {
      return undefined
    }

    const category = categories.find(item => item.id.toString() === formData.category_id)
    if (!category) {
      return undefined
    }

    return {
      type: category.parent_id ? 'child' : 'parent',
      id: category.id,
    } as const
  }, [categories, formData.category_id])

  const getCurrentFormValue = useCallback(
    (field: string) => formData[field as keyof ItemFormData],
    [formData]
  )

  const handleQuantityClick = useCallback(() => {
    setTempQuantity(formData.quantity || 1)
    setQuantityDialogOpen(true)
  }, [formData.quantity])

  const handleQuantityConfirm = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      quantity: tempQuantity || 1,
    }))
    setQuantityDialogOpen(false)
  }, [tempQuantity])

  // 编辑模式初始化期间显示加载态
  if (mode === 'edit' && itemId && (editLoading || !item || loading)) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="编辑物品"
        contentClassName="flex h-[85vh] w-[calc(100vw-1rem)] max-w-4xl flex-col sm:w-[calc(100vw-2rem)]"
      >
        <div className="flex-1 overflow-y-auto">
          <LoadingState onBack={handleClose} />
        </div>
      </Modal>
    )
  }

  // 查看模式：显示物品详情
  if (loading) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="加载物品详情"
        contentClassName="flex h-[85vh] w-[calc(100vw-2rem)] max-w-4xl flex-col"
      >
        <div className="flex flex-1 items-center justify-center overflow-y-auto">
          <LoadingState onBack={handleClose} />
        </div>
      </Modal>
    )
  }

  if (error || (!loading && !item)) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="错误"
        contentClassName="w-[calc(100vw-1rem)] max-w-4xl sm:w-[calc(100vw-2rem)]"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <p className="mb-4 text-red-500">{error?.message ?? '物品不存在'}</p>
          <Button onClick={handleClose} variant="outline">
            关闭
          </Button>
        </div>
      </Modal>
    )
  }

  if (!item) return null

  const displayCategoryName =
    mode === 'edit'
      ? (categories.find(category => category.id.toString() === formData.category_id)?.name ??
        '未分类')
      : (item.category?.name ?? '未分类')
  const displayName = mode === 'edit' ? formData.name || item.name : item.name
  const isInlineEditMode = mode === 'edit'
  const isPublicItem = isInlineEditMode ? formData.is_public : item.is_public
  const nameInputWidth = `calc(${Math.min(Math.max(formData.name.trim().length || 4, 4), 18)}ch + 0.75rem)`

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={`物品详情${item.name ? ` - ${item.name}` : ''}`}
        contentClassName="flex h-[85vh] w-[calc(100vw-2rem)] max-w-4xl flex-col p-0"
      >
        <div className="bg-background sticky top-0 z-10 flex flex-shrink-0 flex-col gap-3 border-b px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            {isInlineEditMode ? (
              <div className="max-w-full shrink-0">
                <CategoryTreeSelect
                  onSelect={handleCategorySelect}
                  selectedCategory={selectedCategory}
                  helperText={null}
                  placeholder="选择分类"
                  comboboxClassName="!w-auto max-w-[14rem] rounded-full px-3 text-sm"
                />
              </div>
            ) : (
              <Badge variant="outline" className="max-w-[60%] truncate px-3 py-1 text-sm">
                {displayCategoryName}
              </Badge>
            )}
            <div className="flex items-center gap-2">
              {isInlineEditMode ? (
                <AutoSaveStatus autoSaving={autoSaving} lastSaved={lastSaved} />
              ) : canEdit ? (
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
              ) : null}
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <StatusIndicator status={item.status} />
              {isInlineEditMode ? (
                <>
                  <div className="flex min-w-0 shrink-0 items-center gap-2">
                    <Input
                      value={formData.name}
                      onChange={event =>
                        setFormData(prev => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      className="h-10 w-auto min-w-[4ch] max-w-[18rem] flex-none border-0 bg-transparent px-0 text-xl font-semibold shadow-none focus-visible:ring-0"
                      placeholder="请输入"
                      style={{ width: nameInputWidth }}
                    />
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                      aria-label={isPublicItem ? '切换为私有物品' : '切换为公开物品'}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          is_public: !prev.is_public,
                        }))
                      }
                    >
                      {isPublicItem ? (
                        <LockOpen className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-full px-3 text-xs font-medium"
                    onClick={handleQuantityClick}
                  >
                    x{formData.quantity || 1}
                  </Button>
                </>
              ) : (
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <h2 className="truncate text-xl font-semibold">{displayName}</h2>
                  <span
                    className="text-muted-foreground shrink-0"
                    aria-label={isPublicItem ? '公开物品' : '私有物品'}
                  >
                    {isPublicItem ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 内容区域 - 可滚动区域 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isInlineEditMode ? (
            <Card className="mt-6 overflow-hidden">
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">图片</h3>
                  <ImageUploader
                    onImagesChange={setUploadedImages}
                    existingImages={uploadedImages}
                    maxImages={10}
                    compactAddButton
                  />
                </div>

                <TagsSection
                  tags={tags}
                  selectedTags={selectedTags}
                  onToggleTag={tagId =>
                    setSelectedTags(prev =>
                      prev.includes(tagId)
                        ? prev.filter(currentTagId => currentTagId !== tagId)
                        : [...prev, tagId]
                    )
                  }
                  onCreateTag={() => setCreateTagDialogOpen(true)}
                />

                {hasDescription ? (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <h3 className="text-muted-foreground mb-1 text-sm font-medium">描述</h3>
                    <p className="text-xs">{trimmedDescription}</p>
                  </div>
                ) : null}

                {(item.purchase_price || item.purchase_date) && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {item.purchase_price && (
                      <InfoCard label="价格" value={`¥${item.purchase_price}`} />
                    )}
                    {item.purchase_date && (
                      <InfoCard label="购买日期" value={formatDate(item.purchase_date)} />
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-base font-semibold">时间信息</h3>
                    <TimeInfo item={item} />
                  </div>
                  <div className="space-y-3">
                    <LocationSection
                      locationPath={locationPath}
                      selectedLocation={selectedLocation}
                      onLocationSelect={handleLocationSelect}
                      getCurrentValue={getCurrentFormValue}
                      isCreateMode={false}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-6 space-y-6">
              {item.images && item.images.length > 0 ? (
                <ImageGallery
                  images={item.images}
                  itemName={item.name}
                  activeIndex={activeImageIndex}
                  onIndexChange={setActiveImageIndex}
                />
              ) : null}

              {item.tags && item.tags.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">标签</h3>
                  <TagsDisplay tags={item.tags} />
                </div>
              ) : null}

              {hasDescription ? (
                <div className="bg-muted/30 rounded-lg p-3">
                  <h3 className="text-muted-foreground mb-1 text-sm font-medium">描述</h3>
                  <p className="text-xs">{trimmedDescription}</p>
                </div>
              ) : null}

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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">时间信息</h3>
                  <TimeInfo item={item} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">存放位置</h3>
                  <LocationInfo item={item} />
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <CreateTagDialog
        open={createTagDialogOpen}
        onOpenChange={setCreateTagDialogOpen}
        onTagCreated={handleTagCreated}
      />

      <QuantityDialog
        open={quantityDialogOpen}
        onOpenChange={setQuantityDialogOpen}
        quantity={tempQuantity}
        onQuantityChange={setTempQuantity}
        onConfirm={handleQuantityConfirm}
      />

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
