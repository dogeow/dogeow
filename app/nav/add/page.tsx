"use client"

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useNavStore } from '@/app/nav/stores/navStore'
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
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Combobox } from "@/components/ui/combobox"
import { apiRequest } from '@/lib/api'

// 定义表单数据类型
type FormData = {
  nav_category_id: string;
  name: string;
  url: string;
  is_visible: boolean;
  is_new_window: boolean;
  sort_order: number;
  description?: string;
  icon?: string;
}

// 创建表单的验证模式
const navItemSchema = z.object({
  nav_category_id: z.string().min(1, "请选择分类"),
  name: z.string().min(1, "名称不能为空").max(50, "名称不能超过50个字符"),
  url: z.string().url("请输入有效的URL").min(1, "URL不能为空"),
  description: z.string().optional(),
  icon: z.string().optional(),
  is_visible: z.boolean(),
  is_new_window: z.boolean(),
  sort_order: z.coerce.number().int().nonnegative()
}) as z.ZodType<FormData>;

export default function AddNavItem() {
  const router = useRouter()
  const { createItem, fetchAllCategories, allCategories, createCategory } = useNavStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

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

  // 加载分类数据
  useEffect(() => {
    console.log("开始加载所有分类...");
    fetchAllCategories()
      .then(result => {
        console.log("所有分类加载成功:", result);
      })
      .catch(error => {
        console.error("加载所有分类失败:", error);
      });
  }, [fetchAllCategories])

  // 处理创建新分类
  const handleCreateCategory = async (categoryName: string) => {
    console.log("创建分类:", categoryName);
    
    try {
      const newCategory = await createCategory({
        name: categoryName,
        is_visible: true,
        sort_order: 0
      });
      
      console.log("创建分类返回结果:", newCategory);
      
      // 设置表单值为新创建的分类ID
      form.setValue('nav_category_id', newCategory.id.toString());
      
      toast.success(`已创建分类 "${categoryName}"`);
    } catch (error) {
      console.error("创建分类失败:", error);
      toast.error("创建分类失败：" + (error instanceof Error ? error.message : "未知错误"));
    }
  }

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
      const toast_id = toast.loading("正在创建导航项...")
      await createItem(navItemData)
      
      toast.success("导航项创建成功", { id: toast_id })
      router.push('/nav')
    } catch (error) {
      console.error("创建导航项失败:", error)
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }
  
  // 将分类数据转换为Combobox选项格式
  const categoryOptions = (allCategories || [])
    .filter(category => category && typeof category === 'object' && category.id !== undefined)
    .map(category => ({
      value: category.id.toString(),
      label: category.name || '未命名分类'
    })) || []
  
  // 调试信息
  console.log("allCategories:", allCategories);
  console.log("categoryOptions:", categoryOptions);
  console.log("当前表单值:", form.getValues());

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push('/nav')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">添加导航</h1>
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
                    <FormControl>
                      <Combobox
                        options={categoryOptions}
                        value={field.value}
                        onChange={(value) => {
                          console.log("Combobox onChange:", value);
                          field.onChange(value);
                        }}
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
              
              {/* URL 先于名称 */}
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
              {/* 名称，右侧加自动获取按钮 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>网站名称</FormLabel>
                    <div className="flex gap-2 items-center">
                      {/* 图标预览在最左侧 */}
                      {form.watch('icon') && (
                        <Image
                          src={form.watch('icon')!}
                          alt="网站图标" width={32} height={32}
                          className="w-8 h-8 rounded border bg-white"
                          style={{ minWidth: 32, minHeight: 32 }}
                        />
                      )}
                      <FormControl>
                        <Input placeholder="输入网站名称" {...field} />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={fetching}
                        onClick={async () => {
                          const url = form.getValues("url");
                          if (!url) {
                            toast.error("请先填写网站地址");
                            return;
                          }
                          setFetching(true);
                          try {
                            const data = await apiRequest<{ title?: string, favicon?: string }>(`fetch-title?url=${encodeURIComponent(url)}`, 'GET');
                            if (data.title) {
                              form.setValue("name", data.title);
                              toast.success("已自动获取网站名称");
                            }
                            if (data.favicon) {
                              form.setValue("icon", data.favicon);
                            }
                          } catch {
                            toast.error("获取失败");
                          } finally {
                            setFetching(false);
                          }
                        }}
                      >
                        {fetching ? '获取中...' : '自动获取'}
                      </Button>
                    </div>
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
                      <Input 
                        type="number" 
                        min="0"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      数字越小，排序越靠前
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '创建中...' : '创建导航项'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 