'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import useSWR, { mutate } from 'swr'
import { get, del } from '@/lib/api'
import { toast } from 'sonner'
import { isLightColor } from '@/lib/helpers'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'

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
  const [deleting, setDeleting] = useState(false)
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

    setDeleting(true)
    try {
      await del(`/things/tags/${tagToDelete}`)
      mutate('/things/tags')
      toast.success('标签删除成功')
    } catch (deleteError) {
      console.error('删除标签失败:', deleteError)
    } finally {
      setDeleting(false)
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
    <div className="mx-auto w-full max-w-7xl py-6 pb-24">
      <div className="mx-auto max-w-4xl">
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            加载标签失败，请稍后重试
          </div>
        )}

        {!tags && !error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">加载中...</div>
          </div>
        )}

        {tags?.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-500">暂无标签</div>
            <p className="text-sm text-gray-400">您还没有创建任何标签，请先添加一些标签</p>
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="space-y-6">
            {/* 标签统计 */}
            <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>共 {tags.length} 个标签</span>
                <span>总计 {tags.reduce((sum, tag) => sum + tag.items_count, 0)} 个物品</span>
              </div>
            </div>

            {/* 标签网格 - 调整为一行显示两个 */}
            <div className="grid grid-cols-2 gap-4">
              {tags.map(tag => (
                <div key={tag.id} className="group relative">
                  <div className="rounded-lg border border-gray-200 bg-white p-2 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                    {/* 标签头部 - 合并为一行 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          style={getTagStyle(tag.color)}
                          className="h-7 px-3 text-sm font-medium"
                        >
                          {tag.name}
                        </Badge>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {tag.items_count} 个
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-20 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        onClick={() => openDeleteDialog(tag.id)}
                        disabled={deleting}
                        title="删除标签"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* 使用频率指示器 */}
                    {tag.items_count > 0 && (
                      <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (tag.items_count / Math.max(...tags.map(t => t.items_count))) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {tag.items_count > 10 ? '高频' : tag.items_count > 3 ? '中频' : '低频'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 自定义删除确认弹窗 */}
        <DeleteConfirmationDialog
          open={alertOpen}
          onOpenChange={setAlertOpen}
          onConfirm={deleteTag}
          itemName={tagToDelete ? tags?.find(t => t.id === tagToDelete)?.name || '' : ''}
        />

        {/* 添加标签Speed Dial */}
        {/* <TagSpeedDial /> */}
      </div>
    </div>
  )
}
