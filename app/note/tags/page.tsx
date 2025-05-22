"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import useSWR, { mutate } from "swr"
import { get, post, del, ApiRequestError } from "@/lib/api"
import { toast } from "sonner"
import { isLightColor, generateRandomColor } from '@/lib/helpers'
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"

// 标签类型定义
type Tag = {
  id: number
  name: string
  color?: string
  created_at: string
  updated_at: string
}

export default function NoteTags() {
  const [newTag, setNewTag] = useState("")
  const [newColor, setNewColor] = useState("#3b82f6") // 默认蓝色
  const [loading, setLoading] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)

  // 页面加载时生成随机颜色
  useEffect(() => {
    setNewColor(generateRandomColor())
  }, []);
  
  // 刷新颜色
  const refreshColor = () => {
    setNewColor(generateRandomColor())
  }

  // 加载标签数据
  const { data: tags, error } = useSWR<Tag[]>('/notes/tags', get)

  // 添加标签
  const addTag = async () => {
    if (!newTag.trim()) {
      toast.error("请输入标签名称")
      return
    }

    setLoading(true)
    try {
      await post("/notes/tags", {
        name: newTag,
        color: newColor
      })
      setNewTag("")
      setNewColor(generateRandomColor()) // 添加成功后重新生成随机颜色
      mutate("/notes/tags")
      toast.success("标签添加成功")
    } catch (error) {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
    }
  }

  // 打开删除确认弹窗
  const openDeleteDialog = (id: number) => {
    setTagToDelete(id)
    setAlertOpen(true)
  }

  // 删除标签
  const deleteTag = async () => {
    if (!tagToDelete) return
    
    setLoading(true)
    try {
      await del(`/notes/tags/${tagToDelete}`)
      mutate("/notes/tags")
      toast.success("标签删除成功")
    } catch (error) {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
      setAlertOpen(false)
      setTagToDelete(null)
    }
  }

  // 生成标签样式
  const getTagStyle = (color: string = "#3b82f6") => {
    return {
      backgroundColor: color,
      color: isLightColor(color) ? "#000" : "#fff"
    }
  }
  
  return (
    <div className="container mx-auto py-4">
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-bold mb-4">添加新标签</h2>
        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">标签名称</label>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="输入标签名称"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">标签颜色</label>
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
                className="w-32"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={refreshColor} 
                className="h-10 w-10"
                title="生成随机颜色"
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Badge style={getTagStyle(newColor)} className="h-6 px-2 ml-2">
                {newTag || "预览"}
              </Badge>
            </div>
          </div>
          <div>
            <Button onClick={addTag} disabled={loading || !newTag.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              添加标签
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">标签列表</h2>
        {error && <p className="text-red-500">加载标签失败</p>}
        {!tags && !error && <p>加载中...</p>}
        {tags?.length === 0 && <p>暂无标签，请添加</p>}

        <div className="flex flex-wrap gap-2 mt-4">
          {tags?.map((tag) => (
            <div key={tag.id} className="flex items-center">
              <Badge
                style={getTagStyle(tag.color)}
                className="h-8 px-3 flex items-center"
              >
                {tag.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-1 p-0 hover:bg-transparent"
                  onClick={() => openDeleteDialog(tag.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* 自定义删除确认弹窗 */}
      <DeleteConfirmationDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onConfirm={deleteTag}
        itemName={tagToDelete ? tags?.find(t => t.id === tagToDelete)?.name || '' : ''}
      />
    </div>
  )
} 