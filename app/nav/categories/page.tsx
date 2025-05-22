"use client"

import { useState, useEffect } from "react"
import { useNavStore } from "@/app/nav/stores/navStore"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
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
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react"
import { NavCategory } from "@/app/nav/types"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"

export default function CategoryManager() {
  const router = useRouter()
  const { 
    categories, 
    fetchCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory 
  } = useNavStore()
  
  const [loading, setLoading] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryDescription, setNewCategoryDescription] = useState("")
  const [editingCategory, setEditingCategory] = useState<NavCategory | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)

  // 加载分类数据
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // 添加分类
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("分类名称不能为空")
      return
    }

    setLoading(true)
    try {
      await createCategory({
        name: newCategoryName,
        description: newCategoryDescription || null,
        is_visible: true,
        sort_order: 0
      })
      
      toast.success("分类创建成功")
      setNewCategoryName("")
      setNewCategoryDescription("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  // 更新分类
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      toast.error("分类名称不能为空")
      return
    }

    setLoading(true)
    try {
      await updateCategory(editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description || null,
        is_visible: editingCategory.is_visible,
        sort_order: editingCategory.sort_order
      })
      
      toast.success("分类更新成功")
      setEditingCategory(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  // 删除分类
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    setLoading(true)
    try {
      await deleteCategory(categoryToDelete)
      
      toast.success("分类删除成功")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
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

  return (
    <div className="container mx-auto py-2 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push('/nav')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">导航分类管理</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 添加/编辑分类卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>{editingCategory ? "编辑分类" : "添加分类"}</CardTitle>
            <CardDescription>
              {editingCategory ? "修改现有导航分类" : "创建新的导航分类便于整理您的网站导航"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">分类名称</label>
              <Input
                value={editingCategory ? editingCategory.name : newCategoryName}
                onChange={(e) => editingCategory 
                  ? setEditingCategory({...editingCategory, name: e.target.value})
                  : setNewCategoryName(e.target.value)
                }
                placeholder="输入分类名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">分类描述（可选）</label>
              <Textarea
                value={editingCategory ? editingCategory.description || "" : newCategoryDescription}
                onChange={(e) => editingCategory 
                  ? setEditingCategory({...editingCategory, description: e.target.value})
                  : setNewCategoryDescription(e.target.value)
                }
                placeholder="输入分类描述"
                rows={3}
                className="resize-none"
              />
            </div>
            {editingCategory && (
              <div>
                <label className="block text-sm font-medium mb-1">排序</label>
                <Input
                  type="number"
                  min="0"
                  value={editingCategory.sort_order}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory, 
                    sort_order: parseInt(e.target.value) || 0
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">数字越小排序越靠前</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {editingCategory ? (
              <>
                <Button variant="outline" onClick={() => setEditingCategory(null)}>
                  取消
                </Button>
                <Button 
                  onClick={handleUpdateCategory}
                  disabled={loading || !editingCategory.name.trim()}
                >
                  {loading ? '处理中...' : '更新分类'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={handleAddCategory}
                disabled={loading || !newCategoryName.trim()}
                className="ml-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加分类
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* 分类列表卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>分类列表</CardTitle>
            <CardDescription>管理现有的导航分类</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">暂无分类，请添加一个分类</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>项目数量</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.items_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setEditingCategory(category)}
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
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCategory}
        itemName={categoryToDelete ? categories.find(c => c.id === categoryToDelete)?.name || '' : ''}
      />
    </div>
  )
} 