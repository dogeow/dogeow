"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useSWR, { mutate } from "swr"
import { get, post, put, del } from "@/lib/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// 分类类型定义
type Category = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export default function NoteCategories() {
  const router = useRouter()
  const [newCategory, setNewCategory] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)

  // 加载分类数据
  const { data: categories = [], error, isLoading } = useSWR<Category[]>('/notes/categories', get)

  // 处理API请求的通用函数
  const handleApiRequest = async (
    apiCall: () => Promise<any>,
    successMessage: string,
    errorMessage: string
  ) => {
    if (loading) return
    
    setLoading(true)
    try {
      await apiCall()
      mutate("/notes/categories")
      toast.success(successMessage)
      return true
    } catch (error) {
      toast.error(errorMessage)
      console.error(error)
      return false
    } finally {
      setLoading(false)
    }
  }

  // 添加分类
  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("请输入分类名称")
      return
    }

    const success = await handleApiRequest(
      () => post("/notes/categories", { name: newCategory.trim() }),
      "分类添加成功",
      "添加分类失败"
    )
    
    if (success) {
      setNewCategory("")
    }
  }

  // 更新分类
  const updateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("请输入分类名称")
      return
    }

    const success = await handleApiRequest(
      () => put(`/notes/categories/${editingCategory.id}`, {
        name: editingCategory.name.trim(),
      }),
      "分类更新成功",
      "更新分类失败"
    )
    
    if (success) {
      setEditingCategory(null)
    }
  }

  // 删除分类
  const deleteCategory = async (id: number) => {
    if (!confirm("确定要删除此分类吗？关联的笔记将不再属于此分类。")) {
      return
    }

    await handleApiRequest(
      () => del(`/notes/categories/${id}`),
      "分类删除成功",
      "删除分类失败"
    )
  }

  // 处理回车键提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      editingCategory ? updateCategory() : addCategory()
    }
  }

  // 渲染分类项
  const renderCategoryItem = (category: Category) => {
    const isEditing = editingCategory?.id === category.id
    
    return (
      <Card key={category.id} className="py-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {isEditing ? (
                <Input
                  value={editingCategory.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value
                    })
                  }
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              ) : (
                category.name
              )}
            </CardTitle>
            {isEditing ? (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                >
                  取消
                </Button>
                <Button 
                  size="sm" 
                  onClick={updateCategory}
                  disabled={loading || !editingCategory.name.trim()}
                >
                  保存
                </Button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingCategory(category)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => deleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/note')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回笔记
        </Button>
        <h1 className="text-2xl font-bold">笔记分类管理</h1>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">分类名称</label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入分类名称"
                disabled={loading}
              />
            </div>
            <div className="mt-6">
              <Button 
                onClick={addCategory} 
                disabled={loading || !newCategory.trim()}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加分类
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-bold mb-4">分类列表</h2>
        {error && <p className="text-red-500">加载分类失败</p>}
        {isLoading && <p>加载中...</p>}
        {categories.length === 0 && !isLoading && <p>暂无分类，请添加</p>}

        <div className="flex flex-col gap-2">
          {categories.map(renderCategoryItem)}
        </div>
      </div>
    </div>
  )
}