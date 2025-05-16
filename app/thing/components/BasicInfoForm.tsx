import React from 'react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ItemFormData, Category } from "../types"

interface BasicInfoFormProps {
  formData: ItemFormData;
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData>>;
  categories: Category[];
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ formData, setFormData, categories }) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
        <CardDescription>编辑物品的基本信息</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">名称</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
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
          
          <div className="space-y-2 w-1/4">
            <Label htmlFor="quantity">数量</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={handleInputChange}
            />
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
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">闲置</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="is_public" className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => handleSwitchChange('is_public', checked)}
            />
            <span>公开物品</span>
          </Label>
        </div>
      </CardContent>
    </Card>
  )
}

export default BasicInfoForm