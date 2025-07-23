import React from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ItemFormData, Category } from '../types'
import { statusMap } from '../config/status'
import { FORM_PLACEHOLDERS, FORM_LABELS } from '../constants'
import { useFormHandlers } from '../hooks/useFormHandlers'
import QuantityEditor from './QuantityEditor'

// 状态选项配置
const STATUS_OPTIONS = Object.entries(statusMap).map(([value, config]) => ({
  value,
  label: config.label,
}))

interface BasicInfoFormProps {
  formData: ItemFormData
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>
  categories: Category[]
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ formData, setFormData, categories }) => {
  const { handleInputChange, handleSelectChange, handleSwitchChange, handleNumberChange } =
    useFormHandlers({ setFormData })

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
        <CardDescription>编辑物品的基本信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 名称和数量 */}
        <div className="space-y-2">
          <Label htmlFor="name">{FORM_LABELS.name}</Label>
          <div className="flex items-center gap-2">
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="flex-1"
              placeholder={FORM_PLACEHOLDERS.name}
            />
            <QuantityEditor
              quantity={formData.quantity}
              onQuantityChange={quantity => handleNumberChange('quantity', quantity)}
            />
          </div>
        </div>

        {/* 描述 */}
        <div className="space-y-2">
          <Label htmlFor="description">{FORM_LABELS.description}</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder={FORM_PLACEHOLDERS.description}
          />
        </div>

        {/* 分类、状态和公开设置 */}
        <div className="flex flex-wrap gap-4">
          {/* 分类选择 */}
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="category_id">{FORM_LABELS.category_id}</Label>
            <Select
              value={formData.category_id}
              onValueChange={value => handleSelectChange('category_id', value)}
            >
              <SelectTrigger id="category_id">
                <SelectValue placeholder={FORM_PLACEHOLDERS.category} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">未分类</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 状态选择 */}
          <div className="min-w-[200px] flex-1 space-y-2">
            <Label htmlFor="status">{FORM_LABELS.status}</Label>
            <Select
              value={formData.status}
              onValueChange={value => handleSelectChange('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder={FORM_PLACEHOLDERS.status} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 公开设置 */}
          <div className="space-y-2">
            <Label htmlFor="is_public">{FORM_LABELS.is_public}</Label>
            <div className="flex h-10 items-center">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={checked => handleSwitchChange('is_public', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BasicInfoForm
