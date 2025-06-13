"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import useSWR, { mutate } from "swr"
import { get, put, del } from "@/lib/api"
import { toast } from "sonner"
import CategorySpeedDial from "./components/CategorySpeedDial"

// 分类类型定义
type Category = {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export default function NoteCategories() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)

  // 加载分类数据
  const { data: categories = [], error, isLoading } = useSWR<Category[]>('/notes/categories', get)

  // 刷新分类数据
  const refreshCategories = () => {
    mutate("/notes/categories")
  }

  // 处理API请求的通用函数
  const handleApiRequest = async (
    apiCall: () => Promise<unknown>,
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
    if (e.key === 'Enter' && editingCategory) {
      void updateCategory()
    }
  }

  // 渲染分类项
  const renderCategoryItem = (category: Category) => {
    const isEditing = editingCategory?.id === category.id
    
    return (
      <Card key={category.id} className="hover:shadow-md transition-shadow duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
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
                  className="text-lg font-medium"
                />
              ) : (
                <div>
                  <h3 className="text-lg font-medium text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    创建于 {new Date(category.created_at).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              )}
            </div>
            {isEditing ? (
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                  disabled={loading}
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
              <div className="flex space-x-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingCategory(category)}
                  className="hover:bg-primary/10"
                  disabled={loading}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteCategory(category.id)}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-4 px-4 pb-24">

      {/* 分类列表 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">分类列表</h2>
          <div className="text-sm text-muted-foreground">
            共 {categories.length} 个分类
          </div>
        </div>
        
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <p className="text-destructive">加载分类失败，请刷新页面重试</p>
            </CardContent>
          </Card>
        )}
        
        {isLoading && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground">加载中...</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {categories.length === 0 && !isLoading && !error && (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6 text-center py-12">
              <div className="text-muted-foreground">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-lg font-medium mb-2">暂无分类</p>
                <p className="text-sm">请添加您的第一个笔记分类</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {categories.map(renderCategoryItem)}
        </div>
      </div>

      <CategorySpeedDial onCategoryAdded={refreshCategories} />
    </div>
  )
}