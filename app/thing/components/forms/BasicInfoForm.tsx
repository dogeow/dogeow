import { Dispatch, SetStateAction } from 'react'
import { Controller, UseFormReturn } from 'react-hook-form'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Tag as TagIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import ImageUploader from '../ImageUploader'
import { ItemFormData } from '../../types'
import { TagType } from '../../add/page'
import { isLightColor } from '@/lib/utils'

type UploadedImage = {
  path: string;
  thumbnail_path: string;
  url: string;
  thumbnail_url: string;
}

interface BasicInfoFormProps {
  formMethods: UseFormReturn<ItemFormData>;
  tags: TagType[];
  selectedTags: string[];
  setSelectedTags: Dispatch<SetStateAction<string[]>>;
  setCreateTagDialogOpen: Dispatch<SetStateAction<boolean>>;
  categories: any[];
  setUploadedImages: Dispatch<SetStateAction<UploadedImage[]>>;
}

export default function BasicInfoForm({
  formMethods,
  tags,
  selectedTags,
  setSelectedTags,
  setCreateTagDialogOpen,
  categories,
  setUploadedImages
}: BasicInfoFormProps) {
  const { control, formState: { errors } } = formMethods

  // 获取标签样式
  const getTagStyle = (color: string = "#3b82f6") => {
    return {
      backgroundColor: color,
      color: isLightColor(color) ? "#000" : "#fff"
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">名称</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  id="name"
                  className="h-10"
                  {...field}
                />
              )}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="description"
                  rows={4}
                  {...field}
                />
              )}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category_id">分类</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="category_id" className="w-full h-10">
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start" sideOffset={4} avoidCollisions={false} className="z-[100]">
                    <SelectItem value="none">未分类</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">数量</Label>
            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  className="h-10"
                  {...field}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              )}
            />
            {errors.quantity && <p className="text-sm text-red-500">{errors.quantity.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger id="status" className="w-full h-10">
                    <SelectValue placeholder="选择状态" />
                  </SelectTrigger>
                  <SelectContent position="popper" align="start" sideOffset={4} avoidCollisions={false} className="z-[100]">
                    <SelectItem value="active">正常</SelectItem>
                    <SelectItem value="inactive">闲置</SelectItem>
                    <SelectItem value="expired">已过期</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_public">公开物品</Label>
            <div className="h-10 flex items-center">
              <Controller
                name="is_public"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="is_public"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="images">物品图片</Label>
            <ImageUploader 
              onImagesChange={setUploadedImages}
              existingImages={[]}
              maxImages={10}
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="tags">标签</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-7 px-2"
                onClick={() => setCreateTagDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <TagIcon className="h-3.5 w-3.5 mr-1" />
                新建标签
              </Button>
            </div>
            
            <div>
              <div className="flex flex-wrap gap-1 mb-3">
                {selectedTags.length > 0 ? (
                  selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id.toString() === tagId);
                    return tag ? (
                      <Badge 
                        key={tag.id} 
                        style={getTagStyle(tag.color)}
                        className="py-0.5 px-2 my-0.5 flex items-center"
                      >
                        {tag.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                          onClick={() => setSelectedTags(prev => prev.filter(id => id !== tagId))}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </Button>
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <div className="text-sm text-muted-foreground">未选择标签</div>
                )}
              </div>
              
              <div className="text-sm font-medium mb-2">可用标签：</div>
              <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-1">
                {tags.map(tag => (
                  <Badge 
                    key={tag.id} 
                    style={getTagStyle(tag.color)}
                    className={`py-0.5 px-2 my-0.5 cursor-pointer transition-opacity ${
                      selectedTags.includes(tag.id.toString()) ? 'opacity-50' : ''
                    }`}
                    onClick={() => {
                      if (selectedTags.includes(tag.id.toString())) {
                        setSelectedTags(prev => prev.filter(id => id !== tag.id.toString()));
                      } else {
                        setSelectedTags(prev => [...prev, tag.id.toString()]);
                      }
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 