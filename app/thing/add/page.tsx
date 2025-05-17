"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useItemStore } from '@/app/thing/stores/itemStore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import BasicInfoForm from '../components/forms/BasicInfoForm'
import DetailInfoForm from '../components/forms/DetailInfoForm'
import CreateTagDialog from '../components/CreateTagDialog'
import { UploadedImage, Tag } from '../types'

// 位置相关类型定义
export type LocationType = 'area' | 'room' | 'spot';

export type Location = {
  id: number;
  name: string;
  [key: string]: any;
}

export type SelectedLocation = {
  type: LocationType; 
  id: number;
} | undefined;

// 重命名标签类型，保持兼容性
export type TagType = Tag;

// 使用内部Schema，与现有组件类型保持一致
const itemSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  description: z.string(),
  quantity: z.number().int().min(1, "数量必须大于0"),
  status: z.string(),
  purchase_date: z.union([z.date(), z.null()]),
  expiry_date: z.union([z.date(), z.null()]),
  purchase_price: z.union([z.number(), z.null()]),
  category_id: z.string(),
  area_id: z.string(),
  room_id: z.string(),
  spot_id: z.string(),
  is_public: z.boolean(),
})

// 内部表单数据类型
type FormData = z.infer<typeof itemSchema>;

export default function AddItem() {
  const router = useRouter()
  const { createItem, fetchCategories, fetchTags, categories, tags } = useItemStore()
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [createTagDialogOpen, setCreateTagDialogOpen] = useState(false)
  
  // 使用 react-hook-form 管理表单状态
  const formMethods = useForm<FormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      quantity: 1,
      status: 'active',
      purchase_date: null,
      expiry_date: null,
      purchase_price: null,
      category_id: 'none',
      area_id: '',
      room_id: '',
      spot_id: '',
      is_public: false,
    }
  })
  
  const { handleSubmit, watch, setValue } = formMethods
  
  // 监听表单值变化 - 位置相关
  const watchAreaId = watch('area_id')
  const watchRoomId = watch('room_id')
  const watchSpotId = watch('spot_id')
  
  // 加载分类和标签数据
  useEffect(() => {
    Promise.all([fetchCategories(), fetchTags()])
  }, [fetchCategories, fetchTags])
  
  // 处理标签创建
  const handleTagCreated = (tag: any) => {
    // 刷新标签列表
    fetchTags()
    
    // 将新创建的标签添加到选中的标签中
    setSelectedTags(prev => [...prev, tag.id.toString()])
  }
  
  // 提交表单
  const onSubmit = async (data: FormData) => {
    setLoading(true)
    
    try {
      // 准备提交数据
      const itemData = {
        ...data,
        purchase_date: data.purchase_date ? new Date(data.purchase_date.toString()).toISOString().split('T')[0] : null,
        expiry_date: data.expiry_date ? new Date(data.expiry_date.toString()).toISOString().split('T')[0] : null,
        category_id: data.category_id && data.category_id !== "none" ? Number(data.category_id) : null,
        area_id: data.area_id ? Number(data.area_id) : null,
        room_id: data.room_id ? Number(data.room_id) : null,
        spot_id: data.spot_id ? Number(data.spot_id) : null,
        image_paths: uploadedImages.map(img => img.path),
        tags: selectedTags.length > 0 ? selectedTags.map(id => Number(id)) : undefined
      };
      
      // 提交请求
      const toast_id = toast.loading("正在创建物品...")
      const newItem = await createItem(itemData as any)
      
      toast.success("物品创建成功", { id: toast_id })
      router.push(`/thing/${newItem.id}`)
    } catch (error) {
      console.error("创建物品失败:", error)
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-2 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push('/thing')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">添加物品</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="pb-20">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="details">详细信息</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-6">
            <BasicInfoForm 
              formMethods={formMethods}
              tags={tags}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              setCreateTagDialogOpen={setCreateTagDialogOpen}
              categories={categories}
              setUploadedImages={setUploadedImages}
            />
          </TabsContent>
          
          <TabsContent value="details" className="space-y-6">
            <DetailInfoForm 
              formMethods={formMethods}
              watchAreaId={watchAreaId}
              watchRoomId={watchRoomId}
              watchSpotId={watchSpotId}
              setValue={setValue}
            />
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-6">
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? "处理中..." : "创建物品"}
          </Button>
        </div>
      </form>

      {/* 创建标签对话框 */}
      <CreateTagDialog 
        open={createTagDialogOpen} 
        onOpenChange={setCreateTagDialogOpen} 
        onTagCreated={handleTagCreated}
      />
    </div>
  )
} 