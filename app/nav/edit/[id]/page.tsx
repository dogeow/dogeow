"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useNavStore } from '@/stores/navStore'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { NavItem } from '@/app/nav/types'

// 创建表单的验证模式
const navItemSchema = z.object({
  nav_category_id: z.string().min(1, "请选择分类"),
  name: z.string().min(1, "名称不能为空").max(50, "名称不能超过50个字符"),
  url: z.string().url("请输入有效的URL").min(1, "URL不能为空"),
  description: z.string().optional(),
  icon: z.string().optional(),
  is_visible: z.boolean().default(true),
  is_new_window: z.boolean().default(true),
  sort_order: z.coerce.number().int().nonnegative().default(0)
})

// 表单数据类型
type FormData = z.infer<typeof navItemSchema>

export default function EditNavItem() {
  const params = useParams()
  const router = useRouter()
  const { fetchCategories, categories, items, fetchItems, updateItem } = useNavStore()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const itemId = Number(params.id)

  // 使用 react-hook-form 管理表单状态
  const form = useForm<FormData>({
    resolver: zodResolver(navItemSchema),
    defaultValues: {
      nav_category_id: "",
      name: "",
      url: "",
      description: "",
      icon: "",
      is_visible: true,
      is_new_window: true,
      sort_order: 0
    }
  })

  // 加载数据
  useEffect(() => {
    // 使用一个标记避免重复加载
    let isMounted = true;
    
    const loadData = async () => {
      if (initialLoading) {
        try {
          // 加载分类和导航项数据
          const [_, itemsResult] = await Promise.all([
            fetchCategories(),
            fetchItems()
          ])
          
          // 在已加载的items中查找当前编辑的项
          const currentItem = itemsResult.find(item => item.id === itemId)
          
          if (!currentItem) {
            // 如果在本地状态没找到，可能需要重新获取单个项
            toast.error("找不到导航项")
            router.push('/nav')
            return
          }
          
          // 仅当组件仍然挂载时才设置表单值
          if (isMounted) {
            // 设置表单默认值
            form.reset({
              nav_category_id: currentItem.nav_category_id.toString(),
              name: currentItem.name,
              url: currentItem.url,
              description: currentItem.description || "",
              icon: currentItem.icon || "",
              is_visible: currentItem.is_visible,
              is_new_window: currentItem.is_new_window,
              sort_order: currentItem.sort_order
            })
            setInitialLoading(false)
          }
        } catch (error) {
          console.error("加载数据失败:", error)
          if (isMounted) {
            toast.error("加载数据失败")
            setInitialLoading(false)
          }
        }
      }
    }
    
    loadData()
    
    // 清理函数
    return () => {
      isMounted = false
    }
  }, [fetchCategories, fetchItems, form, itemId, router, initialLoading])

  // 提交表单
  const onSubmit = async (data: FormData) => {
    setLoading(true)
    
    try {
      // 准备提交数据
      const navItemData = {
        ...data,
        nav_category_id: Number(data.nav_category_id)
      }
      
      // 提交请求
      const toast_id = toast.loading("正在更新导航项...")
      await updateItem(itemId, navItemData)
      
      toast.success("导航项更新成功", { id: toast_id })
      router.push('/nav')
    } catch (error) {
      console.error("更新导航项失败:", error)
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }
  
  if (initialLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push('/nav')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">编辑导航</h1>
        </div>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 分类选择 */}
              <FormField
                control={form.control}
                name="nav_category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分类</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 名称 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>网站名称</FormLabel>
                    <FormControl>
                      <Input placeholder="输入网站名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* URL */}
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>网站地址</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 图标 */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>图标地址</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/favicon.ico (选填)" {...field} />
                    </FormControl>
                    <FormDescription>
                      网站图标的URL地址，留空则使用默认图标
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 描述 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>描述</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="网站简短描述 (选填)" 
                        className="resize-none" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* 新窗口打开 */}
              <FormField
                control={form.control}
                name="is_new_window"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">新窗口打开</FormLabel>
                      <FormDescription>
                        点击链接时在新窗口中打开网站
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* 可见性 */}
              <FormField
                control={form.control}
                name="is_visible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">显示</FormLabel>
                      <FormDescription>
                        控制该导航项是否在导航页面显示
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* 排序 */}
              <FormField
                control={form.control}
                name="sort_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>排序</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormDescription>
                      数字越小排序越靠前，相同则按添加时间排序
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "更新中..." : "更新导航"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 