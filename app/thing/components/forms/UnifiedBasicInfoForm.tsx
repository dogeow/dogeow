import { useState, useEffect, useCallback, startTransition } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { AlertCircle } from 'lucide-react'
import ImageUploader from '../ImageUploader'
import LocationComboboxSelectSimple from '../LocationComboboxSelectSimple'
import CategoryTreeSelect, { CategorySelection } from '../CategoryTreeSelect'
import { NameInput } from './components/NameInput'
import { TagsSection } from './components/TagsSection'
import { LocationSection } from './components/LocationSection'
import { QuantityDialog } from './components/QuantityDialog'
import { useFormValue } from './hooks/useFormValue'
import { useLocationData } from './hooks/useLocationData'
import { updateLocationPath, handleLocationSelectLogic } from './utils/locationHelpers'
import type { ItemFormData, Category, Tag, UploadedImage } from '../../types'
import type { LocationSelection } from '../LocationComboboxSelectSimple'
import type { LocationType, ItemFormSchemaType } from './formConstants'

type FormDataType = ItemFormSchemaType

interface UnifiedBasicInfoFormProps {
  // React Hook Form 相关 (用于创建页面)
  formMethods?: UseFormReturn<FormDataType>

  // 直接状态管理相关 (用于编辑页面)
  formData?: ItemFormData
  setFormData?: React.Dispatch<React.SetStateAction<ItemFormData>>

  // 共同的 props
  tags: Tag[]
  selectedTags: string[]
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>
  setCreateTagDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  categories: Category[]
  uploadedImages: UploadedImage[]
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>

  // 位置相关 (仅创建页面需要)
  watchAreaId?: string
  watchRoomId?: string
  watchSpotId?: string

  // 位置相关 (仅编辑页面需要)
  locationPath?: string
  selectedLocation?: LocationSelection
  onLocationSelect?: (type: LocationType, id: number) => void
}

export { default } from '../item-detail/forms/UnifiedBasicInfoForm'
