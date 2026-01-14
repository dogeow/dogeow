'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Edit2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import useSWR, { mutate } from 'swr'
import { get, del, put } from '@/lib/api'
import { toast } from 'sonner'
import { isLightColor } from '@/lib/helpers'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import TagSpeedDial from './components/TagSpeedDial'

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
  const [isEditing, setIsEditing] = useState(false)
  const [editingTags, setEditingTags] = useState<Record<number, string>>({})
  const [updating, setUpdating] = useState<Record<number, boolean>>({})

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

  // 进入编辑模式
  const enterEditMode = () => {
    if (!tags) return
    const initialEditingTags: Record<number, string> = {}
    tags.forEach(tag => {
      initialEditingTags[tag.id] = tag.name
    })
    setEditingTags(initialEditingTags)
    setIsEditing(true)
  }

  // 退出编辑模式
  const exitEditMode = async () => {
    if (!tags) return

    // 保存所有未保存的更改
    const savePromises: Promise<void>[] = []
    tags.forEach(tag => {
      const editedName = editingTags[tag.id]
      if (editedName !== undefined && editedName !== tag.name) {
        savePromises.push(updateTagName(tag.id, editedName))
      }
    })

    // 等待所有保存完成
    await Promise.all(savePromises)

    setIsEditing(false)
    setEditingTags({})
  }

  // 更新标签名称
  const updateTagName = async (tagId: number, newName: string) => {
    if (!newName.trim()) {
      toast.error('标签名称不能为空')
      return
    }

    setUpdating(prev => ({ ...prev, [tagId]: true }))
    try {
      await put(`/things/tags/${tagId}`, { name: newName.trim() })
      mutate('/things/tags')
      setEditingTags(prev => ({ ...prev, [tagId]: newName.trim() }))
    } catch (error) {
      console.error('更新标签失败:', error)
      toast.error('更新标签失败')
      // 恢复原始名称
      const tag = tags?.find(t => t.id === tagId)
      if (tag) {
        setEditingTags(prev => ({ ...prev, [tagId]: tag.name }))
      }
    } finally {
      setUpdating(prev => ({ ...prev, [tagId]: false }))
    }
  }

  // 处理标签名称输入变化
  const handleTagNameChange = (tagId: number, value: string) => {
    setEditingTags(prev => ({ ...prev, [tagId]: value }))
  }

  // 处理标签名称输入失焦（自动保存）
  const handleTagNameBlur = (tagId: number) => {
    const newName = editingTags[tagId]
    const tag = tags?.find(t => t.id === tagId)
    if (tag && newName !== tag.name) {
      updateTagName(tagId, newName)
    }
  }

  // 处理标签名称输入回车（保存）
  const handleTagNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, tagId: number) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
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
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <span>共 {tags.length} 个标签</span>
                  <span>总计 {tags.reduce((sum, tag) => sum + tag.items_count, 0)} 个物品</span>
                </div>
                <div className="ml-auto">
                  {!isEditing ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={enterEditMode}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit2 className="mr-1 h-3 w-3" />
                      编辑
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={exitEditMode}
                      className="h-7 px-2 text-xs"
                    >
                      完成
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 标签列表 - 根据文字大小自适应，超过则换行 */}
            <div className="flex flex-wrap gap-4">
              {tags.map(tag => (
                <div key={tag.id} className="group relative inline-flex">
                  <div className="rounded-lg border border-gray-200 bg-white p-2 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                    {/* 标签头部 - 合并为一行 */}
                    <div className="flex items-center justify-between gap-2">
                      {isEditing ? (
                        <Input
                          value={editingTags[tag.id] ?? tag.name}
                          onChange={e => handleTagNameChange(tag.id, e.target.value)}
                          onBlur={() => handleTagNameBlur(tag.id)}
                          onKeyDown={e => handleTagNameKeyDown(e, tag.id)}
                          disabled={updating[tag.id]}
                          className="h-7 max-w-[200px] min-w-[80px] px-2 text-sm font-medium"
                          style={{
                            backgroundColor: tag.color || '#3b82f6',
                            color: isLightColor(tag.color || '#3b82f6') ? '#000' : '#fff',
                            border: 'none',
                          }}
                        />
                      ) : (
                        <Badge
                          style={getTagStyle(tag.color)}
                          className="h-7 px-3 text-sm font-medium whitespace-nowrap"
                        >
                          {tag.name}
                        </Badge>
                      )}
                      <span className="text-sm font-medium whitespace-nowrap text-gray-900 dark:text-gray-100">
                        {tag.items_count} 个
                      </span>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 flex-shrink-0 opacity-20 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          onClick={() => openDeleteDialog(tag.id)}
                          disabled={deleting}
                          title="删除标签"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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
        <TagSpeedDial />
      </div>
    </div>
  )
}
