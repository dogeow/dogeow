import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select"
import { Tag as TagType } from "../types"
import CreateTagDialog from './CreateTagDialog'
import QuickCreateTag from './QuickCreateTag'

interface TagsSectionProps {
  selectedTags: string[];
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
  tags: TagType[];
  onTagCreated: (tag: TagType) => void;
}

const TagsSection: React.FC<TagsSectionProps> = ({ 
  selectedTags, 
  setSelectedTags, 
  tags,
  onTagCreated
}) => {
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)
  
  // 获取标签样式
  const getTagStyle = (color: string = "#3b82f6") => {
    return {
      backgroundColor: color,
      color: isLightColor(color) ? "#000" : "#fff"
    }
  }

  // 判断颜色是否为浅色
  const isLightColor = (color: string): boolean => {
    const hex = color.replace("#", "")
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 155
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>标签</CardTitle>
          <CardDescription>编辑物品的标签</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex justify-between items-center">
              <span>标签</span>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="h-7 px-2"
                onClick={() => setCreateTagDialogOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                <Tag className="h-3.5 w-3.5 mr-1" />
                新建标签
              </Button>
            </Label>
            <MultiSelect
              value={selectedTags}
              onValueChange={setSelectedTags}
              closeOnSelect={false}
            >
              <MultiSelectTrigger>
                <MultiSelectValue placeholder="选择标签" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {tags.map((tag) => (
                  <MultiSelectItem key={tag.id} value={tag.id.toString()}>
                    <Badge 
                      style={getTagStyle(tag.color)}
                      className="mr-2 py-0.5 px-2 my-0.5"
                    >
                      {tag.name}
                    </Badge>
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedTags.map(tagId => {
                const tag = tags.find(t => t.id.toString() === tagId);
                return tag ? (
                  <Badge 
                    key={tag.id} 
                    style={getTagStyle(tag.color)}
                    className="py-0.5 px-2 my-0.5"
                  >
                    {tag.name}
                  </Badge>
                ) : null;
              })}
            </div>
            
            <div className="mt-3 pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">快速创建标签:</div>
              <QuickCreateTag onTagCreated={onTagCreated} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 创建标签对话框 */}
      <CreateTagDialog 
        open={createTagDialogOpen} 
        onOpenChange={setCreateTagDialogOpen} 
        onTagCreated={onTagCreated}
      />
    </>
  )
}

export default TagsSection 