import React, { memo } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import type { ItemFormSchemaType } from '../formConstants'
import type { ItemFormData } from '@/app/thing/types'

type FormDataType = ItemFormSchemaType

interface NameInputProps {
  isCreateMode: boolean
  isEditMode: boolean
  formMethods?: UseFormReturn<FormDataType>
  formData?: ItemFormData
  setFormData?: React.Dispatch<React.SetStateAction<ItemFormData>>
}

export const NameInput = memo<NameInputProps>(
  ({ isCreateMode, isEditMode, formMethods, formData, setFormData }) => {
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
)

NameInput.displayName = 'NameInput'
