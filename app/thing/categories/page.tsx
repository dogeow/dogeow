"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useItemStore } from '@/stores/itemStore'
import ThingNavigation from '../components/ThingNavigation'
import { post, put, del } from '@/utils/api'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Categories() {
  const { categories, fetchCategories } = useItemStore()
  const [loading, setLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<{id: number, name: string} | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("分类名称不能为空")
      return
    }

    setLoading(true)
    try {
      await post('/categories', { name: newCategoryName })
      
      toast.success("分类创建成功")
      setNewCategoryName('')
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("分类名称不能为空")
      return
    }

    setLoading(true)
    try {
      await put(`/categories/${editingCategory.id}`, { name: editingCategory.name })
      
      toast.success("分类更新成功")
      setEditingCategory(null)
      fetchCategories()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setLoading(true)
    try {
      await del(`/categories/${categoryToDelete}`)
      
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
    <div className="grid gap-6 md:grid-cols-2">
      {/* 添加/编辑分类卡片 */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            id="categoryName"
            placeholder="输入分类名称"
            value={editingCategory ? editingCategory.name : newCategoryName}
            onChange={(e) => editingCategory ? setEditingCategory({...editingCategory, name: e.target.value}) : setNewCategoryName(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {editingCategory && (
            <Button variant="outline" onClick={() => setEditingCategory(null)}>取消</Button>
          )}
          <Button 
            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
            disabled={loading}
          >
            {loading ? '处理中...' : editingCategory ? '更新分类' : '添加分类'}
          </Button>
        </div>
      </div>

      {/* 分类列表卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>分类列表</CardTitle>
          <CardDescription>管理您的物品分类</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              暂无分类，请添加您的第一个分类
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setEditingCategory({id: category.id, name: category.name})}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => confirmDelete(category.id)}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除此分类吗？此操作无法撤销，且可能影响已分类的物品。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 