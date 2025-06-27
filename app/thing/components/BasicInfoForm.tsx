import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ItemFormData, Category } from "../types"

interface BasicInfoFormProps {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  categories: Category[];
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ formData, setFormData, categories }) => {
  const [isEditingQuantity, setIsEditingQuantity] = useState(false)
  const [tempQuantity, setTempQuantity] = useState(formData.quantity.toString())

  // 当 formData.quantity 变化时更新 tempQuantity（但只在非编辑状态下）
  React.useEffect(() => {
    if (!isEditingQuantity) {
      setTempQuantity(formData.quantity.toString())
    }
  }, [formData.quantity, isEditingQuantity])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    const actualValue = value === "none" ? "" : value;
    setFormData(prev => ({ ...prev, [name]: actualValue }))
  }
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }))
  }

  const handleQuantityEdit = () => {
    setTempQuantity(formData.quantity.toString())
    setIsEditingQuantity(true)
  }

  const handleQuantitySave = () => {
    const quantity = parseInt(tempQuantity)
    if (quantity > 0) {
      setFormData(prev => ({ ...prev, quantity }))
      setIsEditingQuantity(false)
    }
  }

  const handleQuantityCancel = () => {
    setTempQuantity(formData.quantity.toString())
    setIsEditingQuantity(false)
  }

  const handleQuantityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuantitySave()
    } else if (e.key === 'Escape') {
      handleQuantityCancel()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
        <CardDescription>编辑物品的基本信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
            />
            {/* 数量显示 */}
            {isEditingQuantity ? (
              <div className="flex items-center">
                <Input
                  type="number"
                  min="1"
                  value={tempQuantity}
                  onChange={(e) => setTempQuantity(e.target.value)}
                  onKeyDown={handleQuantityKeyDown}
                  onBlur={handleQuantitySave}
                  className="w-16 h-8 text-sm text-center"
                  autoFocus
                />
              </div>
            ) : (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={handleQuantityEdit}
              >
                <span className="text-xs">× {formData.quantity}</span>
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
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
          
          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleSelectChange('status', value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">使用中</SelectItem>
                <SelectItem value="inactive">闲置</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
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