'use client'

import { useState, useEffect, useRef } from 'react'
import { useNavStore } from '@/app/nav/stores/navStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Trash2, Check, X, ArrowLeft } from 'lucide-react'
import { NavCategory } from '@/app/nav/types'
import { useRouter } from 'next/navigation'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import CategorySpeedDial from './components/CategorySpeedDial'

export default function CategoryManager() {
  const router = useRouter()
  const { categories, fetchCategories, updateCategory, deleteCategory } = useNavStore()

  const [loading, setLoading] = useState(false)
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null)
  const [inlineEditingName, setInlineEditingName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const inlineInputRef = useRef<HTMLInputElement>(null)

  // 加载分类数据
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (inlineEditingId && inlineInputRef.current) {
      inlineInputRef.current.focus()
    }
  }, [inlineEditingId])

  const handleInlineEdit = (category: NavCategory) => {
    setInlineEditingId(category.id)
    setInlineEditingName(category.name)
  }

  const saveInlineEdit = async () => {
    if (!inlineEditingId || !inlineEditingName.trim()) {
      toast.error('分类名称不能为空')
      return
    }

    setLoading(true)
    try {
      const categoryToUpdate = categories.find(c => c.id === inlineEditingId)
      if (categoryToUpdate) {
        await updateCategory(inlineEditingId, {
          name: inlineEditingName,
          description: categoryToUpdate.description,
          is_visible: categoryToUpdate.is_visible,
          sort_order: categoryToUpdate.sort_order,
        })
        toast.success('分类更新成功')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发生错误，请重试')
    } finally {
      setLoading(false)
      setInlineEditingId(null)
      setInlineEditingName('')
    }
  }

  const cancelInlineEdit = () => {
    setInlineEditingId(null)
    setInlineEditingName('')
  }

  // 删除分类
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setLoading(true)
    try {
      await deleteCategory(categoryToDelete)

      toast.success('分类删除成功')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发生错误，请重试')
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  // 确认删除
  const confirmDelete = (id: number) => {
    setCategoryToDelete(id)
    setDeleteDialogOpen(true)
  }

  // 处理分类添加后的刷新
  const handleCategoryAdded = () => {
    fetchCategories()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/nav')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold md:text-3xl">导航分类管理</h1>
        </div>
      </div>

      <div className="py-2 pb-24">
        <Card>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-muted-foreground py-8 text-center">
                暂无分类，请添加您的第一个分类
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-full">分类名称</TableHead>
                    <TableHead className="text-center">项目数量</TableHead>
                    <TableHead className="w-[50px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(category => (
                    <TableRow key={category.id}>
                      <TableCell>
                        {inlineEditingId === category.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              ref={inlineInputRef}
                              value={inlineEditingName}
                              onChange={e => setInlineEditingName(e.target.value)}
                              className="h-8"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  saveInlineEdit()
                                } else if (e.key === 'Escape') {
                                  cancelInlineEdit()
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={saveInlineEdit}
                              disabled={loading}
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={cancelInlineEdit}
                              disabled={loading}
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <div
                              className="cursor-pointer font-medium hover:underline"
                              onClick={() => handleInlineEdit(category)}
                            >
                              {category.name}
                            </div>
                            {category.description && (
                              <div className="text-muted-foreground mt-1 text-sm">
                                {category.description}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{category.items_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(category.id)}
                            disabled={loading}
                          >
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* SpeedDial 组件 */}
        <CategorySpeedDial onCategoryAdded={handleCategoryAdded} />

        {/* 删除确认对话框 */}
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDeleteCategory}
          itemName={
            categoryToDelete ? categories.find(c => c.id === categoryToDelete)?.name || '' : ''
          }
        />
      </div>
    </div>
  )
}
