import { Dispatch, SetStateAction, useState, useEffect, useCallback } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Plus, Tag as TagIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ImageUploader from '../ImageUploader'
import LocationComboboxSelectSimple from '../LocationComboboxSelectSimple'
import CategoryTreeSelect, { CategorySelection } from '../CategoryTreeSelect'
import { ItemFormData, Category, Tag, UploadedImage } from '../../types'
import { LocationSelection } from '../LocationComboboxSelectSimple'
import { isLightColor } from '@/lib/helpers'
import { apiRequest } from '@/lib/api'
import { LocationType, Location, ItemFormSchemaType } from './formConstants'

// 表单数据类型
type FormDataType = ItemFormSchemaType

interface UnifiedBasicInfoFormProps {
  // React Hook Form 相关 (用于创建页面)
  formMethods?: UseFormReturn<FormDataType>

  // 直接状态管理相关 (用于编辑页面)
  formData?: ItemFormData
  setFormData?: Dispatch<SetStateAction<ItemFormData>>

  // 共同的 props
  tags: Tag[]
  selectedTags: string[]
  setSelectedTags: Dispatch<SetStateAction<string[]>>
  setCreateTagDialogOpen: Dispatch<SetStateAction<boolean>>
  categories: Category[]
  uploadedImages: UploadedImage[]
  setUploadedImages: Dispatch<SetStateAction<UploadedImage[]>>

  // 位置相关 (仅创建页面需要)
  watchAreaId?: string
  watchRoomId?: string
  watchSpotId?: string

  // 位置相关 (仅编辑页面需要)
  locationPath?: string
  selectedLocation?: LocationSelection
  onLocationSelect?: (type: LocationType, id: number) => void
}

export default function UnifiedBasicInfoForm({
  formMethods,
  formData,
  setFormData,
  tags,
  selectedTags,
  setSelectedTags,
  setCreateTagDialogOpen,
  categories,
  uploadedImages,
  setUploadedImages,
  watchAreaId,
  watchRoomId,
  watchSpotId,
  locationPath,
  selectedLocation,
  onLocationSelect,
}: UnifiedBasicInfoFormProps) {
  // 判断是创建模式还是编辑模式
  const isCreateMode = !!formMethods
  const isEditMode = !!formData && !!setFormData

  // 位置相关状态 (仅创建模式需要)
  const [areas, setAreas] = useState<Location[]>([])
  const [rooms, setRooms] = useState<Location[]>([])
  const [spots, setSpots] = useState<Location[]>([])
  const [internalLocationPath, setInternalLocationPath] = useState<string>('')
  const [internalSelectedLocation, setInternalSelectedLocation] =
    useState<LocationSelection>(undefined)

  // 数量设置对话框状态
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(1)

  // 分类选择状态
  const [selectedCategory, setSelectedCategory] = useState<CategorySelection>(undefined)

  // 获取当前表单值的辅助函数
  const getCurrentValue = useCallback(
    (field: keyof FormDataType | keyof ItemFormData) => {
      if (isCreateMode && formMethods) {
        return formMethods.watch(field as keyof FormDataType)
      }
      if (isEditMode && formData) {
        return formData[field as keyof ItemFormData]
      }
      return ''
    },
    [isCreateMode, formMethods, isEditMode, formData]
  )

  // 设置表单值的辅助函数
  const setCurrentValue = useCallback(
    (field: keyof FormDataType | keyof ItemFormData, value: unknown) => {
      console.log('setCurrentValue 被调用:', { field, value, isEditMode })
      if (isCreateMode && formMethods) {
        formMethods.setValue(field as keyof FormDataType, value as FormDataType[keyof FormDataType])
      }
      if (isEditMode && setFormData) {
        console.log('更新编辑模式的表单数据:', { field, value })
        setFormData(prev => ({ ...prev, [field]: value }))
      }
    },
    [isCreateMode, formMethods, isEditMode, setFormData]
  )

  // 获取标签样式
  const getTagStyle = (color: string = '#3b82f6') => ({
    backgroundColor: color,
    color: isLightColor(color) ? '#000' : '#fff',
  })

  const toggleTag = (tagId: string) => {
    console.log('toggleTag 被调用:', { tagId })
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
      console.log('标签更新:', { prev, newTags })
      return newTags
    })
  }

  // 处理分类选择
  const handleCategorySelect = (type: 'parent' | 'child', id: number | null) => {
    if (id === null) {
      // 未分类
      setSelectedCategory(undefined)
      setCurrentValue('category_id', '')
    } else {
      setSelectedCategory({ type, id })
      setCurrentValue('category_id', id.toString())
    }
    // 注意：在表单中，我们不需要处理弹窗关闭逻辑
  }

  // 根据当前表单值设置选中的分类
  useEffect(() => {
    const categoryId = getCurrentValue('category_id')
    if (categoryId && categoryId !== '') {
      const category = categories.find(cat => cat.id.toString() === categoryId)
      if (category) {
        setSelectedCategory({
          type: category.parent_id ? 'child' : 'parent',
          id: category.id,
        })
      }
    } else {
      // 空字符串表示未分类
      setSelectedCategory(undefined)
    }
  }, [formMethods, formData, categories, getCurrentValue])

  // 位置相关函数 (仅创建模式需要)
  const loadAreas = useCallback(async () => {
    if (!isCreateMode) return []
    try {
      const data = await apiRequest<Location[]>('/areas')
      setAreas(data)
      return data
    } catch (error) {
      console.error('加载区域失败', error)
      return []
    }
  }, [isCreateMode])

  const loadRooms = useCallback(
    async (areaId: string) => {
      if (!isCreateMode || !areaId) {
        setRooms([])
        return []
      }

      try {
        const data = await apiRequest<Location[]>(`/areas/${areaId}/rooms`)
        setRooms(data)
        return data
      } catch (error) {
        console.error('加载房间失败', error)
        return []
      }
    },
    [isCreateMode]
  )

  const loadSpots = useCallback(
    async (roomId: string) => {
      if (!isCreateMode || !roomId) {
        setSpots([])
        return []
      }

      try {
        const data = await apiRequest<Location[]>(`/rooms/${roomId}/spots`)
        setSpots(data)
        return data
      } catch (error) {
        console.error('加载位置失败', error)
        return []
      }
    },
    [isCreateMode]
  )

  const handleLocationSelect = (type: LocationType, id: number, fullPath?: string) => {
    if (isCreateMode) {
      setInternalSelectedLocation({ type, id })
      setInternalLocationPath(fullPath || '')

      if (type === 'area') {
        setCurrentValue('area_id', id.toString())
        setCurrentValue('room_id', '')
        setCurrentValue('spot_id', '')
      } else if (type === 'room') {
        setCurrentValue('room_id', id.toString())
        setCurrentValue('spot_id', '')

        const room = rooms.find(r => r.id === id)
        if (room?.area_id) {
          setCurrentValue('area_id', room.area_id.toString())
        }
      } else if (type === 'spot') {
        setCurrentValue('spot_id', id.toString())

        const spot = spots.find(s => s.id === id)
        if (spot?.room_id) {
          setCurrentValue('room_id', spot.room_id.toString())

          const room = rooms.find(r => r.id === spot.room_id)
          if (room?.area_id) {
            setCurrentValue('area_id', room.area_id.toString())
          }
        }
      }
    } else if (isEditMode && onLocationSelect) {
      onLocationSelect(type, id)
    }
  }

  const updateLocationPath = useCallback(
    (areaId?: string, roomId?: string, spotId?: string) => {
      if (!isCreateMode) return

      let path = ''

      if (areaId && areas.length > 0) {
        const area = areas.find(a => a.id.toString() === areaId)
        if (area) {
          path = area.name

          if (roomId && rooms.length > 0) {
            const room = rooms.find(r => r.id.toString() === roomId)
            if (room) {
              path += ` > ${room.name}`

              if (spotId && spots.length > 0) {
                const spot = spots.find(s => s.id.toString() === spotId)
                if (spot) {
                  path += ` > ${spot.name}`
                }
              }
            }
          }
        }
      }

      if (path) {
        setInternalLocationPath(path)

        if (spotId && spots.length > 0) {
          setInternalSelectedLocation({ type: 'spot', id: Number(spotId) })
        } else if (roomId && rooms.length > 0) {
          setInternalSelectedLocation({ type: 'room', id: Number(roomId) })
        } else if (areaId && areas.length > 0) {
          setInternalSelectedLocation({ type: 'area', id: Number(areaId) })
        }
      } else if (!areaId && !roomId && !spotId) {
        setInternalLocationPath('')
        setInternalSelectedLocation(undefined)
      }
    },
    [areas, rooms, spots, isCreateMode]
  )

  // Effects
  useEffect(() => {
    if (isCreateMode) {
      loadAreas()
    }
  }, [isCreateMode, loadAreas])

  useEffect(() => {
    if (isCreateMode && watchAreaId) {
      loadRooms(watchAreaId)
    }
  }, [watchAreaId, isCreateMode, loadRooms])

  useEffect(() => {
    if (isCreateMode && watchRoomId) {
      loadSpots(watchRoomId)
    }
  }, [watchRoomId, isCreateMode, loadSpots])

  useEffect(() => {
    if (
      isCreateMode &&
      watchAreaId !== undefined &&
      watchRoomId !== undefined &&
      watchSpotId !== undefined
    ) {
      updateLocationPath(watchAreaId, watchRoomId, watchSpotId)
    }
  }, [watchAreaId, watchRoomId, watchSpotId, updateLocationPath, isCreateMode])

  const renderLocationInfo = () => {
    const currentLocationPath = isCreateMode ? internalLocationPath : locationPath
    const currentAreaId = getCurrentValue('area_id')
    const currentRoomId = getCurrentValue('room_id')
    const currentSpotId = getCurrentValue('spot_id')

    if (currentLocationPath) {
      return <p className="text-muted-foreground mt-2 text-sm">{currentLocationPath}</p>
    }

    if (currentAreaId || currentRoomId || currentSpotId) {
      return <p className="mt-2 text-sm text-orange-500">位置数据不完整，请重新选择</p>
    }

    return <p className="text-muted-foreground mt-2 text-sm">未指定位置</p>
  }

  // 处理数量设置
  const handleQuantityClick = () => {
    const currentQuantity = (getCurrentValue('quantity') as number) || 1
    setTempQuantity(currentQuantity)
    setQuantityDialogOpen(true)
  }

  const handleQuantityConfirm = () => {
    setCurrentValue('quantity', tempQuantity)
    setQuantityDialogOpen(false)
  }

  // 渲染名称输入框
  const renderNameInput = () => {
    if (isCreateMode && formMethods) {
      return (
        <Controller
          name="name"
          control={formMethods.control}
          render={({ field }) => <Input id="name" className="h-10 flex-1" {...field} />}
        />
      )
    }

    if (isEditMode && formData && setFormData) {
      return (
        <Input
          id="name"
          className="h-10 flex-1"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
      )
    }

    return null
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <div className="flex items-center gap-2">
              {renderNameInput()}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3 text-sm font-medium"
                onClick={handleQuantityClick}
              >
                X{(getCurrentValue('quantity') as number) || 1}
              </Button>
            </div>
            {isCreateMode && formMethods?.formState.errors.name && (
              <p className="text-sm text-red-500">{formMethods.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_id">分类</Label>
            <CategoryTreeSelect
              onSelect={handleCategorySelect}
              selectedCategory={selectedCategory}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">物品图片</Label>
            <ImageUploader
              onImagesChange={setUploadedImages}
              existingImages={uploadedImages}
              maxImages={10}
            />
          </div>

          <div className="space-y-2">
            <div className="mb-2 flex items-center justify-between">
              <Label htmlFor="tags">标签</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2"
                onClick={() => setCreateTagDialogOpen(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                <TagIcon className="mr-1 h-3.5 w-3.5" />
                新建标签
              </Button>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap gap-1">
                {selectedTags.length > 0 ? (
                  selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id.toString() === tagId)
                    return tag ? (
                      <Badge
                        key={tag.id}
                        style={getTagStyle(tag.color)}
                        className="my-0.5 flex items-center px-2 py-0.5"
                      >
                        {tag.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => toggleTag(tagId)}
                        >
                          <X size={12} />
                        </Button>
                      </Badge>
                    ) : null
                  })
                ) : (
                  <div className="text-muted-foreground text-sm">未选择标签</div>
                )}
              </div>

              <div className="mb-2 text-sm font-medium">可用标签：</div>
              <div className="flex max-h-40 flex-wrap gap-1 overflow-y-auto p-1">
                {tags.map(tag => (
                  <Badge
                    key={tag.id}
                    style={getTagStyle(tag.color)}
                    className={`my-0.5 cursor-pointer px-2 py-0.5 transition-opacity ${
                      selectedTags.includes(tag.id.toString()) ? 'opacity-50' : ''
                    }`}
                    onClick={() => toggleTag(tag.id.toString())}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="mb-2 block">存放位置</Label>
            <LocationComboboxSelectSimple
              onSelect={handleLocationSelect}
              selectedLocation={isCreateMode ? internalSelectedLocation : selectedLocation}
            />
            {renderLocationInfo()}
          </div>
        </div>
      </CardContent>

      {/* 数量设置对话框 */}
      <Dialog open={quantityDialogOpen} onOpenChange={setQuantityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>设置数量</DialogTitle>
            <DialogDescription>设置物品的数量</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="temp-quantity">数量</Label>
              <Input
                id="temp-quantity"
                type="number"
                min="1"
                value={tempQuantity}
                onChange={e => setTempQuantity(e.target.valueAsNumber || 1)}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setQuantityDialogOpen(false)}>
              取消
            </Button>
            <Button type="button" onClick={handleQuantityConfirm}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
