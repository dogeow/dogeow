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
import { ItemFormData, Category, Tag, Area, Room, Spot } from '../../types'
import { LocationSelection } from '../LocationComboboxSelectSimple'
import { isLightColor } from '@/lib/helpers'
import { apiRequest } from '@/lib/api'

type UploadedImage = {
  path: string
  thumbnail_path: string
  url: string
  thumbnail_url: string
}

interface BasicInfoFormProps {
  formMethods: UseFormReturn<ItemFormData>
  tags: Tag[]
  selectedTags: string[]
  setSelectedTags: Dispatch<SetStateAction<string[]>>
  setCreateTagDialogOpen: Dispatch<SetStateAction<boolean>>
  categories: Category[]
  setUploadedImages: Dispatch<SetStateAction<UploadedImage[]>>
  watchAreaId: string
  watchRoomId: string
  watchSpotId: string
}

export default function BasicInfoForm({
  formMethods,
  tags,
  selectedTags,
  setSelectedTags,
  setCreateTagDialogOpen,
  categories,
  setUploadedImages,
  watchAreaId,
  watchRoomId,
  watchSpotId,
}: BasicInfoFormProps) {
  const {
    control,
    formState: { errors },
    setValue,
  } = formMethods

  // 位置相关状态
  const [areas, setAreas] = useState<Area[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [locationPath, setLocationPath] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection>(undefined)

  // 数量设置对话框状态
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(1)

  // 分类选择状态
  const [selectedCategory, setSelectedCategory] = useState<CategorySelection>(undefined)

  // 获取标签样式
  const getTagStyle = (color: string = '#3b82f6') => ({
    backgroundColor: color,
    color: isLightColor(color) ? '#000' : '#fff',
  })

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    )
  }

  // 处理分类选择
  const handleCategorySelect = (type: 'parent' | 'child', id: number | null) => {
    if (id === null) {
      // 未分类
      setSelectedCategory(undefined)
      setValue('category_id', '')
    } else {
      setSelectedCategory({ type, id })
      setValue('category_id', id.toString())
    }
    // 注意：在表单中，我们不需要处理弹窗关闭逻辑
  }

  // 根据当前表单值设置选中的分类
  useEffect(() => {
    const categoryId = formMethods.watch('category_id')
    if (categoryId && categoryId !== 'none') {
      const category = categories.find(cat => cat.id.toString() === categoryId)
      if (category) {
        setSelectedCategory({
          type: category.parent_id ? 'child' : 'parent',
          id: category.id,
        })
      }
    } else {
      setSelectedCategory(undefined)
    }
  }, [formMethods, categories])

  // 位置相关函数
  const loadAreas = async () => {
    try {
      const data = await apiRequest<Area[]>('/areas')
      setAreas(data)
      return data
    } catch (error) {
      console.error('加载区域失败', error)
      return []
    }
  }

  const loadRooms = async (areaId: string) => {
    if (!areaId) {
      setRooms([])
      return []
    }

    try {
      const data = await apiRequest<Room[]>(`/areas/${areaId}/rooms`)
      setRooms(data)
      return data
    } catch (error) {
      console.error('加载房间失败', error)
      return []
    }
  }

  const loadSpots = async (roomId: string) => {
    if (!roomId) {
      setSpots([])
      return []
    }

    try {
      const data = await apiRequest<Spot[]>(`/rooms/${roomId}/spots`)
      setSpots(data)
      return data
    } catch (error) {
      console.error('加载位置失败', error)
      return []
    }
  }

  const handleLocationSelect = (type: 'area' | 'room' | 'spot', id: number, fullPath?: string) => {
    setSelectedLocation({ type, id })
    setLocationPath(fullPath || '')

    if (type === 'area') {
      setValue('area_id', id.toString())
      setValue('room_id', '')
      setValue('spot_id', '')
    } else if (type === 'room') {
      setValue('room_id', id.toString())
      setValue('spot_id', '')

      const room = rooms.find(r => r.id === id)
      if (room?.area_id) {
        setValue('area_id', room.area_id.toString())
      }
    } else if (type === 'spot') {
      setValue('spot_id', id.toString())

      const spot = spots.find(s => s.id === id)
      if (spot?.room_id) {
        setValue('room_id', spot.room_id.toString())

        const room = rooms.find(r => r.id === spot.room_id)
        if (room?.area_id) {
          setValue('area_id', room.area_id.toString())
        }
      }
    }
  }

  const updateLocationPath = useCallback(
    (areaId?: string, roomId?: string, spotId?: string) => {
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
        setLocationPath(path)

        if (spotId && spots.length > 0) {
          setSelectedLocation({ type: 'spot', id: Number(spotId) })
        } else if (roomId && rooms.length > 0) {
          setSelectedLocation({ type: 'room', id: Number(roomId) })
        } else if (areaId && areas.length > 0) {
          setSelectedLocation({ type: 'area', id: Number(areaId) })
        }
      } else if (!areaId && !roomId && !spotId) {
        setLocationPath('')
        setSelectedLocation(undefined)
      }
    },
    [areas, rooms, spots]
  )

  // Effects
  useEffect(() => {
    loadAreas()
  }, [])

  useEffect(() => {
    loadRooms(watchAreaId)
  }, [watchAreaId])

  useEffect(() => {
    loadSpots(watchRoomId)
  }, [watchRoomId])

  useEffect(() => {
    updateLocationPath(watchAreaId, watchRoomId, watchSpotId)
  }, [watchAreaId, watchRoomId, watchSpotId, updateLocationPath])

  const renderLocationInfo = () => {
    if (locationPath) {
      return <p className="text-muted-foreground mt-2 text-sm">{locationPath}</p>
    }

    if (watchAreaId || watchRoomId || watchSpotId) {
      return <p className="mt-2 text-sm text-orange-500">位置数据不完整，请重新选择</p>
    }

    return <p className="text-muted-foreground mt-2 text-sm">未指定位置</p>
  }

  // 处理数量设置
  const handleQuantityClick = () => {
    const currentQuantity = formMethods.watch('quantity') || 1
    setTempQuantity(currentQuantity)
    setQuantityDialogOpen(true)
  }

  const handleQuantityConfirm = () => {
    setValue('quantity', tempQuantity)
    setQuantityDialogOpen(false)
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <div className="flex items-center gap-2">
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input id="name" className="h-10 flex-1" {...field} />}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3 text-sm font-medium"
                onClick={handleQuantityClick}
              >
                X{formMethods.watch('quantity') || 1}
              </Button>
            </div>
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
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
            <ImageUploader onImagesChange={setUploadedImages} existingImages={[]} maxImages={10} />
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
              selectedLocation={selectedLocation}
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
