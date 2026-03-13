'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import useSWR, { mutate } from 'swr'
import { get, del } from '@/lib/api'
import { toast } from 'sonner'
import { isLightColor } from '@/lib/helpers'
import { PageContainer } from '@/components/layout'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import TagSpeedDial from './components/TagSpeedDial'

// 标签类型定义
type Tag = {
  id: number
  name: string
  color?: string
  created_at: string
  updated_at: string
}

export default function NoteTags() {
  const [loading, setLoading] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)

  // 加载标签数据
  const { data: tags, error } = useSWR<Tag[]>('/notes/tags', get)

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
      mutate('/notes/tags')
      toast.success('标签删除成功')
    } catch {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
      setAlertOpen(false)
      setTagToDelete(null)
    }
  }

  // 生成标签样式
  const getTagStyle = (color: string = '#3b82f6') => {
    return {
      backgroundColor: color,
      color: isLightColor(color) ? '#000' : '#fff',
    }
  }

  return (
    <PageContainer className="pb-24">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-semibold">标签列表</h2>
          <div className="text-muted-foreground text-sm">共 {tags?.length ?? 0} 个标签</div>
        </div>

        {error && <p className="text-red-500">加载标签失败</p>}
        {!tags && !error && <p>加载中...</p>}
        {tags?.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-muted-foreground">
              <div className="mb-4 text-4xl">🏷️</div>
              <p className="mb-2 text-lg font-medium">暂无标签</p>
              <p className="text-sm">请添加您的第一个笔记标签</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {tags?.map(tag => (
            <div key={tag.id} className="flex items-center">
              <Badge style={getTagStyle(tag.color)} className="flex h-8 items-center px-3">
                {tag.name}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1 h-5 w-5 p-0 hover:bg-transparent"
                  onClick={() => openDeleteDialog(tag.id)}
                  disabled={loading}
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
        itemName={tagToDelete ? (tags?.find(t => t.id === tagToDelete)?.name ?? '') : ''}
      />

      <TagSpeedDial />
    </PageContainer>
  )
}
