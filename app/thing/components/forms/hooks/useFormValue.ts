import { useCallback } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import type { ItemFormData, ItemFormSchemaType } from './formConstants'

type FormDataType = ItemFormSchemaType

interface UseFormValueOptions {
  isCreateMode: boolean
  isEditMode: boolean
  formMethods?: UseFormReturn<FormDataType>
  formData?: ItemFormData
  setFormData?: React.Dispatch<React.SetStateAction<ItemFormData>>
}

export function useFormValue({
  isCreateMode,
  isEditMode,
  formMethods,
  formData,
  setFormData,
}: UseFormValueOptions) {
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
      if (isCreateMode && formMethods) {
        formMethods.setValue(field as keyof FormDataType, value as FormDataType[keyof FormDataType])
      }
      if (isEditMode && setFormData) {
        setFormData(prev => ({ ...prev, [field]: value }))
      }
    },
    [isCreateMode, formMethods, isEditMode, setFormData]
  )

  return { getCurrentValue, setCurrentValue }
}
