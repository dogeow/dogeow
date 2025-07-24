'use client'

import { useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { ItemFormData } from '@/app/thing/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ItemFormLayout from '../ItemFormLayout'
import UnifiedBasicInfoForm from './UnifiedBasicInfoForm'
import UnifiedDetailInfoForm from './UnifiedDetailInfoForm'
import CreateTagDialog from '../CreateTagDialog'
import { UploadedImage, Tag } from '../../types'
import {
  itemFormSchema,
  defaultFormValues,
  ItemFormSchemaType,
  LocationType,
  SelectedLocation,
} from './formConstants'
import { transformFormDataForSubmit } from './formUtils'
import { ApiSubmitItemData } from '../../types'

interface ItemFormWrapperProps {
  mode: 'create' | 'edit'
  title: string
  initialData?: Partial<ItemFormData>
  uploadedImages?: UploadedImage[]
  selectedTags?: string[]
  onUploadedImagesChange?: Dispatch<SetStateAction<UploadedImage[]>>
  onSelectedTagsChange?: Dispatch<SetStateAction<string[]>>
  onSubmit?: (data: ApiSubmitItemData) => Promise<void>
  autoSaving?: boolean
  lastSaved?: Date | null
  // 编辑模式特有的 props
  formData?: ItemFormData
  setFormData?: (data: ItemFormData | ((prev: ItemFormData) => ItemFormData)) => void
  locationPath?: string
  selectedLocation?: SelectedLocation
  onLocationSelect?: (type: LocationType, id: number, fullPath?: string) => void
  watchAreaId?: string
  watchRoomId?: string
  watchSpotId?: string
}

export default function ItemFormWrapper({
  mode,
  title,
  initialData,
  uploadedImages: externalUploadedImages,
  selectedTags: externalSelectedTags,
  onUploadedImagesChange,
  onSelectedTagsChange,
  onSubmit,
  autoSaving,
  lastSaved,
  formData,
  setFormData,
  locationPath,
  selectedLocation,
  onLocationSelect,
  watchAreaId,
  watchRoomId,
  watchSpotId,
}: ItemFormWrapperProps) {
  const router = useRouter()
  const { fetchCategories, fetchTags, categories, tags } = useItemStore()
  const [loading, setLoading] = useState(false)
  const [internalUploadedImages, setInternalUploadedImages] = useState<UploadedImage[]>([])
  const [internalSelectedTags, setInternalSelectedTags] = useState<string[]>([])
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)

  // 根据模式选择使用内部状态还是外部状态
  const uploadedImages = externalUploadedImages ?? internalUploadedImages
  const selectedTags = externalSelectedTags ?? internalSelectedTags
  const setUploadedImages = onUploadedImagesChange ?? setInternalUploadedImages
  const setSelectedTags = onSelectedTagsChange ?? setInternalSelectedTags

  // 创建模式使用 react-hook-form
  const formMethods = useForm<ItemFormSchemaType>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      ...defaultFormValues,
      ...initialData,
    },
  })

  const { handleSubmit, watch } = formMethods

  // 监听表单值变化 - 位置相关 (仅创建模式)
  const formWatchAreaId = watch('area_id')
  const formWatchRoomId = watch('room_id')
  const formWatchSpotId = watch('spot_id')

  // 根据模式选择监听值
  const currentWatchAreaId = mode === 'create' ? formWatchAreaId : watchAreaId
  const currentWatchRoomId = mode === 'create' ? formWatchRoomId : watchRoomId
  const currentWatchSpotId = mode === 'create' ? formWatchSpotId : watchSpotId

  // 加载分类和标签数据
  useEffect(() => {
    Promise.all([fetchCategories(), fetchTags()])
  }, [fetchCategories, fetchTags])

  // 处理标签创建
  const handleTagCreated = (tag: Tag) => {
    fetchTags()
    setSelectedTags(prev => [...prev, tag.id.toString()])
  }

  // 提交表单 (仅创建模式)
  const handleFormSubmit = async (data: ItemFormSchemaType) => {
    if (mode === 'edit' || !onSubmit) return

    setLoading(true)

    try {
      const itemData = transformFormDataForSubmit(data, uploadedImages, selectedTags)
      await onSubmit(itemData)
    } catch (error) {
      console.error('提交失败:', error)
      toast.error(error instanceof Error ? error.message : '发生错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const renderFooter = (): ReactNode => {
    if (mode === 'edit') {
      return null // 编辑模式使用自动保存，不需要提交按钮
    }

    return (
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? '处理中...' : '创建物品'}
      </Button>
    )
  }

  const renderBasicInfo = () => {
    if (mode === 'create') {
      return (
        <UnifiedBasicInfoForm
          formMethods={formMethods}
          tags={tags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          setCreateTagDialogOpen={setCreateTagDialogOpen}
          categories={categories}
          uploadedImages={uploadedImages}
          setUploadedImages={setUploadedImages}
          watchAreaId={currentWatchAreaId}
          watchRoomId={currentWatchRoomId}
          watchSpotId={currentWatchSpotId}
        />
      )
    }

    return (
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
        onLocationSelect={onLocationSelect}
        watchAreaId={currentWatchAreaId}
        watchRoomId={currentWatchRoomId}
        watchSpotId={currentWatchSpotId}
      />
    )
  }

  const renderDetailInfo = () => {
    if (mode === 'create') {
      return <UnifiedDetailInfoForm formMethods={formMethods} />
    }

    return <UnifiedDetailInfoForm formData={formData} setFormData={setFormData} />
  }

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <ItemFormLayout
          title={title}
          onBack={() => router.push('/thing')}
          footer={renderFooter()}
          autoSaving={autoSaving}
          lastSaved={lastSaved}
        >
          {{
            basicInfo: renderBasicInfo(),
            detailInfo: renderDetailInfo(),
          }}
        </ItemFormLayout>
      </form>

      {/* 创建标签对话框 */}
      <CreateTagDialog
        open={createTagDialogOpen}
        onOpenChange={setCreateTagDialogOpen}
        onTagCreated={handleTagCreated}
      />
    </>
  )
}
