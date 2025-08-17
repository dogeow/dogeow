'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import useSWR, { mutate } from 'swr'
import { get, put, del } from '@/lib/api'
import { toast } from 'sonner'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import CategorySpeedDial from './components/CategorySpeedDial'

// 分类类型定义
type Category = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export default function NoteCategories() {
  const [loading, setLoading] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingName, setEditingName] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 加载分类数据
  const { data: categories, error } = useSWR<Category[]>('/notes/categories', get)

  // 打开删除确认弹窗
  const openDeleteDialog = (id: number) => {
    setCategoryToDelete(id)
    setAlertOpen(true)
  }

  // 删除分类
  const deleteCategory = async () => {
    if (!categoryToDelete) return

    setLoading(true)
    try {
      await del(`/notes/categories/${categoryToDelete}`)
      mutate('/notes/categories')
      toast.success('分类删除成功')
    } catch {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
      setAlertOpen(false)
      setCategoryToDelete(null)
    }
  }

  // 开始编辑分类
  const startEditing = (category: Category) => {
    setEditingCategory(category)
    setEditingName(category.name)
  }

  // 取消编辑
  const cancelEditing = () => {
    setEditingCategory(null)
    setEditingName('')
  }

  // 保存编辑
  const saveEditing = async () => {
    if (!editingCategory || !editingName.trim()) {
      toast.error('请输入分类名称')
      return
    }

    setLoading(true)
    try {
      await put(`/notes/categories/${editingCategory.id}`, {
        name: editingName.trim(),
      })
      mutate('/notes/categories')
      toast.success('分类更新成功')
      cancelEditing()
    } catch {
      // API的统一错误处理已经显示了错误提示，这里不需要重复显示
    } finally {
      setLoading(false)
    }
  }

  // 处理回车键提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  return (
    <div className="container mx-auto py-4 pb-24">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-foreground text-xl font-semibold">分类列表</h2>
          <div className="text-muted-foreground text-sm">共 {categories?.length || 0} 个分类</div>
        </div>

        {error && <p className="text-red-500">加载分类失败</p>}
        {!categories && !error && <p>加载中...</p>}
        {categories?.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-muted-foreground">
              <div className="mb-4 text-4xl">📝</div>
              <p className="mb-2 text-lg font-medium">暂无分类</p>
              <p className="text-sm">请添加您的第一个笔记分类</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {categories?.map(category => (
            <div key={category.id} className="flex items-center">
              {editingCategory?.id === category.id ? (
                <div className="bg-background flex items-center gap-2 rounded-full border px-3 py-1">
                  <Input
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus={!isMobile} // 移动端不自动focus，避免弹出键盘
                    className="h-6 border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                    style={{ width: `${Math.max(editingName.length * 8, 60)}px` }}
                  />
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 text-green-600 hover:bg-transparent"
                      onClick={saveEditing}
                      disabled={loading || !editingName.trim()}
                    >
                      ✓
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0 text-red-600 hover:bg-transparent"
                      onClick={cancelEditing}
                      disabled={loading}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ) : (
                <Badge className="flex h-8 items-center bg-blue-100 px-3 text-blue-800 hover:bg-blue-200">
                  {category.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 h-5 w-5 p-0 hover:bg-transparent"
                    onClick={() => startEditing(category)}
                    disabled={loading}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-1 h-5 w-5 p-0 hover:bg-transparent"
                    onClick={() => openDeleteDialog(category.id)}
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 自定义删除确认弹窗 */}
      <DeleteConfirmationDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        onConfirm={deleteCategory}
        itemName={
          categoryToDelete ? categories?.find(c => c.id === categoryToDelete)?.name || '' : ''
        }
      />

      <CategorySpeedDial onCategoryAdded={() => mutate('/notes/categories')} />
    </div>
  )
}
