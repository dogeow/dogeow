import { useState, useEffect, useCallback, startTransition } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertCircle } from 'lucide-react'
import ImageUploader from '../../ImageUploader'
import LocationComboboxSelectSimple from '../../LocationComboboxSelectSimple'
import CategoryTreeSelect, { CategorySelection } from '../../CategoryTreeSelect'
import { NameInput } from '../../forms/components/NameInput'
import { TagsSection } from '../../forms/components/TagsSection'
import { LocationSection } from '../../forms/components/LocationSection'
import { QuantityDialog } from '../../forms/components/QuantityDialog'
import { useFormValue } from '../../forms/hooks/useFormValue'
import { useLocationData } from '../../forms/hooks/useLocationData'
import { updateLocationPath, handleLocationSelectLogic } from '../../forms/utils/locationHelpers'
import type { ItemFormData, Category, Tag, UploadedImage } from '../../../types'
import type { LocationSelection } from '../../LocationComboboxSelectSimple'
import type { LocationType, ItemFormSchemaType } from '../../forms/formConstants'

type FormDataType = ItemFormSchemaType

interface UnifiedBasicInfoFormProps {
  formMethods?: UseFormReturn<FormDataType>
  formData?: ItemFormData
  setFormData?: React.Dispatch<React.SetStateAction<ItemFormData>>
  tags: Tag[]
  selectedTags: string[]
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>
  setCreateTagDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  categories: Category[]
  uploadedImages: UploadedImage[]
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>
  watchAreaId?: string
  watchRoomId?: string
  watchSpotId?: string
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
  const isCreateMode = !!formMethods
  const isEditMode = !!formData && !!setFormData

  const { getCurrentValue, setCurrentValue } = useFormValue({
    isCreateMode,
    isEditMode,
    formMethods,
    formData,
    setFormData,
  })

  const { areas, rooms, spots, loadRooms, loadSpots } = useLocationData(isCreateMode)

  const [internalLocationPath, setInternalLocationPath] = useState<string>('')
  const [internalSelectedLocation, setInternalSelectedLocation] =
    useState<LocationSelection>(undefined)

  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(1)

  const [selectedCategory, setSelectedCategory] = useState<CategorySelection>(undefined)

  const toggleTag = useCallback(
    (tagId: string) => {
      setSelectedTags(prev => {
        const newTags = prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
        return newTags
      })
    },
    [setSelectedTags]
  )

  const handleCategorySelect = useCallback(
    (type: 'parent' | 'child', id: number | null) => {
      if (id === null) {
        setSelectedCategory(undefined)
        setCurrentValue('category_id', '')
      } else {
        setSelectedCategory({ type, id })
        setCurrentValue('category_id', id.toString())
      }
    },
    [setCurrentValue]
  )

  useEffect(() => {
    const categoryId = getCurrentValue('category_id')
    startTransition(() => {
      if (categoryId && categoryId !== '') {
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
    })
  }, [formMethods, formData, categories, getCurrentValue])

  const handleLocationSelect = useCallback(
    async (type: LocationType, id: number, fullPath?: string) => {
      if (isCreateMode) {
        await handleLocationSelectLogic(
          type,
          id,
          fullPath,
          rooms,
          spots,
          getCurrentValue,
          setCurrentValue,
          loadSpots
        )

        if (id === 0 || !fullPath) {
          setInternalSelectedLocation(undefined)
          setInternalLocationPath('')
        } else {
          setInternalSelectedLocation({ type, id })
          setInternalLocationPath(fullPath || '')
        }
      } else if (isEditMode && onLocationSelect) {
        if (id === 0) {
          return
        }
        onLocationSelect(type, id)
      }
    },
    [
      isCreateMode,
      isEditMode,
      rooms,
      spots,
      getCurrentValue,
      setCurrentValue,
      loadSpots,
      onLocationSelect,
    ]
  )

  const updateLocationPathInternal = useCallback(
    (areaId?: string, roomId?: string, spotId?: string) => {
      if (!isCreateMode) return

      const { path, selectedLocation } = updateLocationPath(
        areaId,
        roomId,
        spotId,
        areas,
        rooms,
        spots
      )
      setInternalLocationPath(path)
      setInternalSelectedLocation(selectedLocation)
    },
    [areas, rooms, spots, isCreateMode]
  )

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
      startTransition(() => {
        updateLocationPathInternal(watchAreaId, watchRoomId, watchSpotId)
      })
    }
  }, [watchAreaId, watchRoomId, watchSpotId, updateLocationPathInternal, isCreateMode])

  const handleQuantityClick = useCallback(() => {
    const currentQuantity = (getCurrentValue('quantity') as number) || 1
    setTempQuantity(currentQuantity)
    setQuantityDialogOpen(true)
  }, [getCurrentValue])

  const handleQuantityConfirm = useCallback(() => {
    setCurrentValue('quantity', tempQuantity)
    setQuantityDialogOpen(false)
  }, [setCurrentValue, tempQuantity])

  const currentLocationPath = isCreateMode ? internalLocationPath : locationPath
  const currentSelectedLocation = isCreateMode ? internalSelectedLocation : selectedLocation

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <div className="flex items-center gap-2">
              <NameInput
                isCreateMode={isCreateMode}
                isEditMode={isEditMode}
                formMethods={formMethods}
                formData={formData}
                setFormData={setFormData}
              />
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
            <div className="flex items-center gap-2">
              <Label htmlFor="images">物品图片</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="查看上传说明"
                    >
                      <AlertCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      支持JPG、PNG、GIF格式，每张图片不超过20MB，最多上传10 张。点击图片可设为主图。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <ImageUploader
              onImagesChange={setUploadedImages}
              existingImages={uploadedImages}
              maxImages={10}
            />
          </div>

          <TagsSection
            tags={tags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
            onCreateTag={() => setCreateTagDialogOpen(true)}
          />

          <LocationSection
            locationPath={currentLocationPath}
            selectedLocation={currentSelectedLocation}
            onLocationSelect={handleLocationSelect}
            getCurrentValue={getCurrentValue}
            isCreateMode={isCreateMode}
          />
        </div>
      </CardContent>

      <QuantityDialog
        open={quantityDialogOpen}
        onOpenChange={setQuantityDialogOpen}
        quantity={tempQuantity}
        onQuantityChange={setTempQuantity}
        onConfirm={handleQuantityConfirm}
      />
    </Card>
  )
}
