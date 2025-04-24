"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import useSWR, { mutate } from "swr"
import { get, post, put, del } from "@/utils/api"
import { toast } from "react-hot-toast"

// 分类类型定义
type Category = {
  id: number
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export default function NoteCategories() {
  const [newCategory, setNewCategory] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)

  // 加载分类数据
  const { data: categories, error } = useSWR<Category[]>('/note-categories', get)

  // 添加分类
  const addCategory = async () => {
    if (!newCategory.trim()) {
      toast.error("请输入分类名称")
      return
    }

    setLoading(true)
    try {
      await post("/note-categories", {
        name: newCategory,
        description: newDescription
      })
      setNewCategory("")
      setNewDescription("")
      mutate("/note-categories")
      toast.success("分类添加成功")
    } catch (error) {
      toast.error("添加分类失败")
      console.error(error)
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

    setLoading(true)
    try {
      await put(`/note-categories/${editingCategory.id}`, {
        name: editingCategory.name,
        description: editingCategory.description
      })
      setEditingCategory(null)
      mutate("/note-categories")
      toast.success("分类更新成功")
    } catch (error) {
      toast.error("更新分类失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // 删除分类
  const deleteCategory = async (id: number) => {
    if (!confirm("确定要删除此分类吗？关联的笔记将不再属于此分类。")) {
      return
    }

    setLoading(true)
    try {
      await del(`/note-categories/${id}`)
      mutate("/note-categories")
      toast.success("分类删除成功")
    } catch (error) {
      toast.error("删除分类失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-4">
      <Card>
        <CardHeader>
          <CardTitle>添加新分类</CardTitle>
          <CardDescription>创建新的笔记分类便于整理您的笔记</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">分类名称</label>
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="输入分类名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">分类描述（可选）</label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="输入分类描述"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={addCategory} disabled={loading || !newCategory.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            添加分类
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">分类列表</h2>
        {error && <p className="text-red-500">加载分类失败</p>}
        {!categories && !error && <p>加载中...</p>}
        {categories?.length === 0 && <p>暂无分类，请添加</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle>
                  {editingCategory?.id === category.id ? (
                    <Input
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value
                        })
                      }
                    />
                  ) : (
                    category.name
                  )}
                </CardTitle>
                {editingCategory?.id === category.id ? (
                  <Input
                    value={editingCategory.description || ""}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        description: e.target.value
                      })
                    }
                    placeholder="分类描述"
                    className="mt-2"
                  />
                ) : (
                  <CardDescription>{category.description || "无描述"}</CardDescription>
                )}
              </CardHeader>
              <CardFooter className="flex justify-between">
                {editingCategory?.id === category.id ? (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingCategory(null)}
                    >
                      取消
                    </Button>
                    <Button onClick={updateCategory}>保存</Button>
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
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
} 