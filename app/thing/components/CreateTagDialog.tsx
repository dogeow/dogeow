"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "react-hot-toast"
import { post } from "@/utils/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

type CreateTagDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTagCreated: (tag: Tag) => void
}

type Tag = {
  id: number
  name: string
  color: string
  user_id: number
}

export default function CreateTagDialog({
  open,
  onOpenChange,
  onTagCreated
}: CreateTagDialogProps) {
  const [newTag, setNewTag] = useState("")
  const [newColor, setNewColor] = useState("#3b82f6") // 默认蓝色
  const [loading, setLoading] = useState(false)

  // 添加标签
  const addTag = async () => {
    if (!newTag.trim()) {
      toast.error("请输入标签名称")
      return
    }

    setLoading(true)
    try {
      const response = await post<Tag>("/thing-tags", {
        name: newTag,
        color: newColor
      })
      
      setNewTag("")
      setNewColor("#3b82f6")
      onTagCreated(response)
      onOpenChange(false)
      toast.success("标签添加成功")
    } catch (error) {
      toast.error("添加标签失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 生成标签样式
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>创建新标签</DialogTitle>
          <DialogDescription>
            为您的物品创建一个新的标签并设置颜色
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">标签名称</label>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="输入标签名称"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">标签颜色</label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="#RRGGBB"
                className="w-36"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">预览</label>
            <div className="mt-2">
              <Badge style={getTagStyle(newColor)} className="h-6 px-2">
                {newTag || "标签预览"}
              </Badge>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={addTag} disabled={loading || !newTag.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            创建标签
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 