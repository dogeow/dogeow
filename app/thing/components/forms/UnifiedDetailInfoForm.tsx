import { Dispatch, SetStateAction, useCallback } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { ItemFormData } from '../../types'
import { ItemFormSchemaType } from './formConstants'

// 表单数据类型
type FormDataType = ItemFormSchemaType

interface UnifiedDetailInfoFormProps {
  // React Hook Form 相关 (用于创建页面)
  formMethods?: UseFormReturn<FormDataType>
  
  // 直接状态管理相关 (用于编辑页面)
  formData?: ItemFormData
  setFormData?: Dispatch<SetStateAction<ItemFormData>>
}

export default function UnifiedDetailInfoForm({
  formMethods,
  formData,
  setFormData,
}: UnifiedDetailInfoFormProps) {
  // 判断是创建模式还是编辑模式
  const isCreateMode = !!formMethods
  const isEditMode = !!formData && !!setFormData

  // 获取当前表单值的辅助函数
  const getCurrentValue = useCallback((field: keyof FormDataType | keyof ItemFormData) => {
    if (isCreateMode && formMethods) {
      return formMethods.watch(field as keyof FormDataType)
    }
    if (isEditMode && formData) {
      return formData[field as keyof ItemFormData]
    }
    return ''
  }, [isCreateMode, formMethods, isEditMode, formData])

  // 设置表单值的辅助函数
  const setCurrentValue = useCallback((field: keyof FormDataType | keyof ItemFormData, value: unknown) => {
    if (isCreateMode && formMethods) {
      formMethods.setValue(field as keyof FormDataType, value as FormDataType[keyof FormDataType])
    }
    if (isEditMode && setFormData) {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }, [isCreateMode, formMethods, isEditMode, setFormData])

  // 渲染描述输入框
  const renderDescriptionInput = () => {
    if (isCreateMode && formMethods) {
      return (
        <Controller
          name="description"
          control={formMethods.control}
          render={({ field }) => <Textarea id="description" rows={4} {...field} />}
        />
      )
    }

    if (isEditMode && formData && setFormData) {
      return (
        <Textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        />
      )
    }

    return null
  }

  // 渲染状态选择器
  const renderStatusSelect = () => {
    const currentStatus = getCurrentValue('status')

    const handleStatusChange = (value: string) => {
      setCurrentValue('status', value)
    }

    if (isCreateMode && formMethods) {
      return (
        <Controller
          name="status"
          control={formMethods.control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="status" className="h-10 w-full">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
                sideOffset={4}
                avoidCollisions={false}
                className="z-[100]"
              >
                <SelectItem value="active">使用中</SelectItem>
                <SelectItem value="inactive">闲置</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      )
    }

    if (isEditMode) {
      return (
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger id="status" className="h-10 w-full">
            <SelectValue placeholder="选择状态" />
          </SelectTrigger>
          <SelectContent
            position="popper"
            align="start"
            sideOffset={4}
            avoidCollisions={false}
            className="z-[100]"
          >
            <SelectItem value="active">使用中</SelectItem>
            <SelectItem value="inactive">闲置</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    return null
  }

  // 渲染公开开关
  const renderPublicSwitch = () => {
    const currentIsPublic = getCurrentValue('is_public')

    const handlePublicChange = (checked: boolean) => {
      setCurrentValue('is_public', checked)
    }

    if (isCreateMode && formMethods) {
      return (
        <Controller
          name="is_public"
          control={formMethods.control}
          render={({ field }) => (
            <Switch id="is_public" checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      )
    }

    if (isEditMode) {
      return (
        <Switch id="is_public" checked={currentIsPublic} onCheckedChange={handlePublicChange} />
      )
    }

    return null
  }

  // 渲染日期选择器
  const renderDatePicker = (fieldName: string, placeholder: string) => {
    const currentDate = getCurrentValue(fieldName)

    const handleDateChange = (date: Date | null) => {
      if (isCreateMode && formMethods) {
        formMethods.setValue(fieldName, date)
      }
      if (isEditMode && setFormData) {
        setFormData(prev => ({ ...prev, [fieldName]: date }))
      }
    }

    if (isCreateMode && formMethods) {
      return (
        <Controller
          name={fieldName}
          control={formMethods.control}
          render={({ field }) => (
            <DatePicker
              date={field.value ? new Date(field.value) : null}
              setDate={field.onChange}
              placeholder={placeholder}
            />
          )}
        />
      )
    }

    if (isEditMode) {
      return (
        <DatePicker
          date={currentDate}
          setDate={handleDateChange}
          placeholder={placeholder}
        />
      )
    }

    return null
  }

  // 渲染价格输入框
  const renderPriceInput = () => {
    const currentPrice = getCurrentValue('purchase_price')

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      const numericValue = value === '' ? null : Number(value)
      setCurrentValue('purchase_price', numericValue)
    }

    if (isCreateMode && formMethods) {
      return (
        <Controller
          name="purchase_price"
          control={formMethods.control}
          render={({ field }) => (
            <Input
              id="purchase_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={field.value !== null ? field.value : ''}
              onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
            />
          )}
        />
      )
    }

    if (isEditMode) {
      return (
        <Input
          id="purchase_price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={currentPrice !== null ? currentPrice : ''}
          onChange={handlePriceChange}
        />
      )
    }

    return null
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            {renderDescriptionInput()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            {renderStatusSelect()}
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_public">公开物品</Label>
            <div className="flex h-10 items-center">
              {renderPublicSwitch()}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">购买日期</Label>
              {renderDatePicker('purchase_date', '选择日期')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry_date">过期日期</Label>
              {renderDatePicker('expiry_date', '选择日期')}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchase_price">购买价格</Label>
              {renderPriceInput()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}