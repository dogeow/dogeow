import React, { useState, useCallback, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ItemFormData, Category } from "../types"
import { statusMap } from "../config/status"

// 状态选项配置
const STATUS_OPTIONS = Object.entries(statusMap).map(([value, config]) => ({
  value,
  label: config.label
}))

interface BasicInfoFormProps {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  categories: Category[];
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ formData, setFormData, categories }) => {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(formData.quantity.toString())

  // 当 formData.quantity 变化时更新 tempQuantity（但只在非编辑状态下）
  useEffect(() => {
    if (!isEditingQuantity) {
      setTempQuantity(formData.quantity.toString())
    }
  }, [formData.quantity, isEditingQuantity])

  // 通用输入处理函数
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [setFormData])
  
  // 通用选择处理函数
  const handleSelectChange = useCallback((name: keyof ItemFormData, value: string) => {
    const actualValue = value === "none" ? "" : value;
    setFormData(prev => ({ ...prev, [name]: actualValue }))
  }, [setFormData])
  
  // 通用开关处理函数
  const handleSwitchChange = useCallback((name: keyof ItemFormData, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }, [setFormData])

  // 数量编辑相关函数
  const handleQuantityEdit = useCallback(() => {
    setTempQuantity(formData.quantity.toString())
    setIsEditingQuantity(true)
  }, [formData.quantity])

  const handleQuantitySave = useCallback(() => {
    const quantity = parseInt(tempQuantity, 10)
    if (quantity > 0 && !isNaN(quantity)) {
      setFormData(prev => ({ ...prev, quantity }))
      setIsEditingQuantity(false)
    }
  }, [tempQuantity, setFormData])

  const handleQuantityCancel = useCallback(() => {
    setTempQuantity(formData.quantity.toString())
    setIsEditingQuantity(false)
  }, [formData.quantity])

  const handleQuantityKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuantitySave()
    } else if (e.key === 'Escape') {
      handleQuantityCancel()
    }
  }, [handleQuantitySave, handleQuantityCancel])

  const handleTempQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTempQuantity(e.target.value)
  }, [])

  // 渲染数量编辑器
  const renderQuantityEditor = () => {
    if (isEditingQuantity) {
      return (
        <Input
          type="number"
          min="1"
          value={tempQuantity}
          onChange={handleTempQuantityChange}
          onKeyDown={handleQuantityKeyDown}
          onBlur={handleQuantitySave}
          className="w-16 h-8 text-sm text-center"
          autoFocus
        />
      )
    }

    return (
      <Badge
        variant="secondary"
        className="cursor-pointer hover:bg-secondary/80 transition-colors"
        onClick={handleQuantityEdit}
      >
        <span className="text-xs">× {formData.quantity}</span>
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
        <CardDescription>编辑物品的基本信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 名称和数量 */}
        <div className="space-y-2">
          <Label htmlFor="name">名称</Label>
          <div className="flex items-center gap-2">
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="flex-1"
              placeholder="请输入物品名称"
            />
            {renderQuantityEditor()}
          </div>
        </div>
        
        {/* 描述 */}
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="请输入物品描述（可选）"
          />
        </div>
        
        {/* 分类、状态和公开设置 */}
        <div className="flex flex-wrap gap-4">
          {/* 分类选择 */}
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label htmlFor="category_id">分类</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => handleSelectChange('category_id', value)}
            >
              <SelectTrigger id="category_id">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">未分类</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 状态选择 */}
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label htmlFor="status">状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="选择状态" />
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
            <Label htmlFor="is_public">公开物品</Label>
            <div className="h-10 flex items-center">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => handleSwitchChange('is_public', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default BasicInfoForm