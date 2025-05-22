"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import useSWR, { mutate } from "swr"
import { get, del } from "@/lib/api"
import { toast } from "sonner"
import { isLightColor } from '@/lib/helpers'
import TagSpeedDial from './components/TagSpeedDial'
import { Card, CardContent } from "@/components/ui/card"
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"

// 标签类型定义
type Tag = {
  id: number
  name: string
  color?: string
  items_count: number
  created_at: string
  updated_at: string
}

export default function ThingTags() {
  const [loading, setLoading] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)

  // 加载标签数据
  const { data: tags, error } = useSWR<Tag[]>('/things/tags', get)

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
      await del(`/things/tags/${tagToDelete}`)
      mutate("/things/tags")
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
    <div className="py-2 pb-24">
      <Card className="border">
        <CardContent>
          {error && <p className="text-red-500">加载标签失败</p>}
          {!tags && !error && <p>加载中...</p>}
          {tags?.length === 0 && <p>暂无标签，请添加</p>}

          <div className="flex flex-wrap gap-2 mt-2">
            {tags?.map((tag) => (
              <div key={tag.id} className="relative flex items-center">
                {tag.items_count > 0 && (
                  <div 
                    className="absolute -top-3 -right-1 z-10 flex items-center justify-center w-5 h-5 text-sm font-medium text-primary"
                  >
                    {tag.items_count}
                  </div>
                )}
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
        </CardContent>
      </Card>

      {/* 自定义删除确认弹窗 */}
      <DeleteConfirmationDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onConfirm={deleteTag}
        itemName={tagToDelete ? tags?.find(t => t.id === tagToDelete)?.name || '' : ''}
      />

      {/* 添加标签Speed Dial */}
      <TagSpeedDial />
    </div>
  )
} 