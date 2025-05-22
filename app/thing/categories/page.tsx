"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useItemStore } from '@/app/thing/stores/itemStore'
import { put, del, get } from '@/lib/api'
import CategorySpeedDial from './components/CategorySpeedDial'
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"

export default function Categories() {
  const { categories, fetchCategories } = useItemStore()
  const [loading, setLoading] = useState(false)
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null)
  const [inlineEditingName, setInlineEditingName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [uncategorizedCount, setUncategorizedCount] = useState(0)
  const inlineInputRef = useRef<HTMLInputElement>(null)

  // 获取未分类物品数量
  const fetchUncategorizedCount = async () => {
    try {
      const response: { data: any[], meta?: { total: number } } = await get('/things/items?uncategorized=true&own=true')
      setUncategorizedCount(response.meta?.total || 0)
    } catch (error) {
      console.error('获取未分类物品数量失败:', error)
    }
  }

  useEffect(() => {
    fetchCategories()
    fetchUncategorizedCount()
  }, [fetchCategories])

  useEffect(() => {
    if (inlineEditingId && inlineInputRef.current) {
      inlineInputRef.current.focus()
    }
  }, [inlineEditingId])

  const handleInlineEdit = (category: {id: number, name: string}) => {
    setInlineEditingId(category.id)
    setInlineEditingName(category.name)
  }

  const saveInlineEdit = async () => {
    if (!inlineEditingId || !inlineEditingName.trim()) {
      toast.error("分类名称不能为空")
      return
    }

    setLoading(true)
    try {
      await put(`/things/categories/${inlineEditingId}`, { name: inlineEditingName })
      toast.success("分类更新成功")
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
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

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setLoading(true)
    try {
      await del(`/things/categories/${categoryToDelete}`)
      toast.success("分类删除成功")
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  const confirmDelete = (id: number) => {
    setCategoryToDelete(id)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="py-2 pb-24">
      <Card>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              暂无分类，请添加您的第一个分类
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-full">分类名称</TableHead>
                  <TableHead className="text-center">物品数量</TableHead>
                  <TableHead className="w-[50px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="font-medium">未分类</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {uncategorizedCount}
                  </TableCell>
                  <TableCell>
                    {/* 未分类项无法删除 */}
                  </TableCell>
                </TableRow>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      {inlineEditingId === category.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            ref={inlineInputRef}
                            value={inlineEditingName}
                            onChange={(e) => setInlineEditingName(e.target.value)}
                            className="h-8"
                            onKeyDown={(e) => {
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
                        <div 
                          className="cursor-pointer hover:underline" 
                          onClick={() => handleInlineEdit(category)}
                        >
                          {category.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {category.items_count ?? 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => confirmDelete(category.id)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCategory}
        itemName={categoryToDelete ? categories.find(c => c.id === categoryToDelete)?.name || '' : ''}
      />

      <CategorySpeedDial onCategoryAdded={fetchCategories} />
    </div>
  )
}