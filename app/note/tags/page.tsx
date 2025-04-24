"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import useSWR, { mutate } from "swr"
import { get, post, del } from "@/utils/api"
import { toast } from "react-hot-toast"

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

  // 加载标签数据
  const { data: tags, error } = useSWR<Tag[]>("/api/note-tags", get)

  // 添加标签
  const addTag = async () => {
    if (!newTag.trim()) {
      toast.error("请输入标签名称")
      return
    }

    setLoading(true)
    try {
      await post("/api/note-tags", {
        name: newTag,
        color: newColor
      })
      setNewTag("")
      mutate("/api/note-tags")
      toast.success("标签添加成功")
    } catch (error) {
      toast.error("添加标签失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 删除标签
  const deleteTag = async (id: number) => {
    if (!confirm("确定要删除此标签吗？")) {
      return
    }

    setLoading(true)
    try {
      await del(`/api/note-tags/${id}`)
      mutate("/api/note-tags")
      toast.success("标签删除成功")
    } catch (error) {
      toast.error("删除标签失败")
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
                  onClick={() => deleteTag(tag.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 