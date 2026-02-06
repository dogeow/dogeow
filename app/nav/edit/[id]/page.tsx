'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useNavStore } from '@/app/nav/stores/navStore'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Combobox } from '@/components/ui/combobox'
import { Switch } from '@/components/ui/switch'
import { PageContainer } from '@/components/layout'

// 定义表单数据类型
type FormData = {
  nav_category_id: string
  name: string
  url: string
  is_visible: boolean
  is_new_window: boolean
  sort_order: number
  description?: string
  icon?: string
}

// 创建表单的验证模式
const navItemSchema = z.object({
  nav_category_id: z.string().min(1, '请选择分类'),
  name: z.string().min(1, '名称不能为空').max(50, '名称不能超过50个字符'),
  url: z.string().url('请输入有效的URL').min(1, 'URL不能为空'),
  description: z.string().optional(),
  icon: z.string().optional(),
  is_visible: z.boolean(),
  is_new_window: z.boolean(),
  sort_order: z.coerce.number().int().nonnegative(),
}) as z.ZodType<FormData>

export default function EditNavPage() {
  const params = useParams()
  const router = useRouter()
  const { fetchAllCategories, allCategories, fetchItems, updateItem, createCategory } =
    useNavStore()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const itemId = Number(params.id)

  // 使用 react-hook-form 管理表单状态
  const form = useForm<FormData>({
    resolver: zodResolver(navItemSchema),
    defaultValues: {
      nav_category_id: '',
      name: '',
      url: '',
      description: '',
      icon: '',
      is_visible: true,
      is_new_window: true,
      sort_order: 0,
    },
  })

  // 加载数据
  useEffect(() => {
    // 使用一个标记避免重复加载
    let isMounted = true

    const loadData = async () => {
      if (initialLoading) {
        try {
          // 加载分类和导航项数据
          const [, itemsResult] = await Promise.all([fetchAllCategories(), fetchItems()])

          // 在已加载的items中查找当前编辑的项
          const currentItem = itemsResult.find(item => item.id === itemId)

          if (!currentItem) {
            // 如果在本地状态没找到，可能需要重新获取单个项
            toast.error('找不到导航项')
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
              description: currentItem.description || '',
              icon: currentItem.icon || '',
              is_visible: currentItem.is_visible,
              is_new_window: true,
              sort_order: currentItem.sort_order,
            })
            setInitialLoading(false)
          }
        } catch (error) {
          console.error('加载数据失败:', error)
          if (isMounted) {
            toast.error('加载数据失败')
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
  }, [fetchAllCategories, fetchItems, form, itemId, router, initialLoading])

  // 处理创建新分类
  const handleCreateCategory = async (categoryName: string) => {
    try {
      const newCategory = await createCategory({
        name: categoryName,
        is_visible: true,
        sort_order: 0,
      })

      console.log('创建分类返回结果:', newCategory)

      // 设置表单值为新创建的分类ID
      form.setValue('nav_category_id', newCategory.id.toString())

      toast.success(`已创建分类 "${categoryName}"`)
    } catch (error) {
      console.error('创建分类失败:', error)
      toast.error('创建分类失败：' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 提交表单
  const onSubmit = async (data: FormData) => {
    setLoading(true)

    try {
      // 准备提交数据
      const navItemData = {
        ...data,
        nav_category_id: Number(data.nav_category_id),
        is_new_window: true,
      }

      // 提交请求
      const toast_id = toast.loading('正在更新导航项...')
      await updateItem(itemId, navItemData)

      toast.success('导航项更新成功', { id: toast_id })
      router.push('/nav')
    } catch (error) {
      console.error('更新导航项失败:', error)
      toast.error(error instanceof Error ? error.message : '发生错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 将分类数据转换为Combobox选项格式
  const categoryOptions =
    (allCategories || [])
      .filter(category => category && typeof category === 'object' && category.id !== undefined)
      .map(category => ({
        value: category.id.toString(),
        label: category.name || '未命名分类',
      })) || []

  if (initialLoading) {
    return (
      <PageContainer className="py-2">
        <div className="flex h-40 items-center justify-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-2">
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
          <h1 className="text-2xl font-bold tracking-tight">编辑导航</h1>
        </div>
      </div>

      <Card className="mx-auto max-w-2xl">
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
                    <FormControl>
                      <Combobox
                        options={categoryOptions}
                        value={field.value}
                        onChange={field.onChange}
                        onCreateOption={handleCreateCategory}
                        placeholder="选择分类"
                        emptyText="没有找到分类"
                        createText="创建分类"
                        searchText="搜索分类..."
                      />
                    </FormControl>
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
                    <FormLabel>图标地址 (网站图标的URL地址，留空则使用默认图标)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/favicon.ico (选填)" {...field} />
                    </FormControl>
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

              {/* 可见性 */}
              <FormField
                control={form.control}
                name="is_visible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel className="text-base">显示</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                    <FormLabel>排序 (数字越小，排序越靠前)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? '更新中...' : '更新导航'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
