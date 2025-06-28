"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Trash2, Lock, Unlock } from "lucide-react"
import { format } from 'date-fns'
import Image from "next/image"
import { toast } from "sonner"
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useItem } from '../services/api'
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"
import { isLightColor } from '@/lib/helpers'
import { statusMap } from '../config/status'
import { Item, Tag } from '@/app/thing/types'

// 日期格式化工具函数
const formatDate = (date: string | null) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'yyyy-MM-dd')
  } catch {
    return '无效日期'
  }
}

const formatDateTime = (date: string | null) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
  } catch {
    return '无效日期'
  }
}

const calculateDaysDifference = (startDate: string | null, endDate: string | null) => {
  if (!startDate || !endDate) return null
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return null
  }
}

// 标签渲染组件
const TagsDisplay = ({ tags }: { tags: Tag[] }) => {
  if (!tags || tags.length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <h3 className="font-medium text-xs text-muted-foreground mt-1">标签:</h3>
      {tags.map((tag: Tag) => (
        <Badge
          key={tag.id}
          style={{
            backgroundColor: tag.color || '#3b82f6',
            color: isLightColor(tag.color || '#3b82f6') ? '#000' : '#fff'
          }}
          className="h-6 px-2"
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  )
}

// 图片展示组件
const ImageGallery = ({ 
  images, 
  itemName, 
  activeIndex, 
  onIndexChange 
}: { 
  images: Item['images'], 
  itemName: string, 
  activeIndex: number, 
  onIndexChange: (index: number) => void 
}) => {
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
        <p className="text-muted-foreground">无图片</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden shadow-sm">
        <Image
          src={images[activeIndex].url || ''}
          alt={itemName}
          fill
          className="object-cover"
        />
      </div>
      
      {images.length > 1 && (
        <div className="flex flex-wrap gap-2 py-2 justify-center">
          {images.map((image, index: number) => (
            <div
              key={image.id}
              className={`relative w-16 h-16 aspect-square rounded-md cursor-pointer border-2 transition-all overflow-hidden ${
                index === activeIndex ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/50'
              }`}
              onClick={() => onIndexChange(index)}
            >
              <Image
                src={image.thumbnail_url || ''}
                alt={`${itemName} 图片 ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 信息卡片组件
const InfoCard = ({ label, value, className = "" }: { label: string, value: string | number, className?: string }) => (
  <div className={`bg-background p-3 rounded-lg border shadow-sm ${className}`}>
    <h3 className="font-medium text-xs text-muted-foreground">{label}</h3>
    <p className="text-sm font-semibold">{value}</p>
  </div>
)

// 基本信息标签组件
const StatusBadges = ({ item }: { item: Item }) => {
  const status = statusMap[item.status as keyof typeof statusMap] || { label: item.status, variant: 'secondary' }
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-sm py-1 px-3">
        {item.category?.name || '未分类'}
      </Badge>
      <Badge className={status.variant === 'bg-green-500' ? status.variant : ''} variant={status.variant !== 'bg-green-500' ? (status.variant as "outline" | "destructive" | "secondary" | "default") : undefined}>
        {status.label}
      </Badge>
      <Badge variant={item.is_public ? "default" : "outline"} className="flex items-center gap-1">
        {item.is_public ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        {item.is_public ? '公开' : '私有'}
      </Badge>
    </div>
  )
}

// 位置信息组件
const LocationInfo = ({ item }: { item: Item }) => {
  const hasLocation = item.area_id || item.room_id || item.spot_id
  
  if (!hasLocation) {
    return (
      <div className="flex items-center justify-center h-20 bg-muted rounded-lg">
        <p className="text-muted-foreground text-sm">未指定存放位置</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {item.spot?.room?.area?.name && (
          <InfoCard label="区域" value={item.spot.room.area.name} />
        )}
        {item.spot?.room?.name && (
          <InfoCard label="房间" value={item.spot.room.name} />
        )}
        {item.spot?.name && (
          <InfoCard label="位置" value={item.spot.name} />
        )}
      </div>
    </div>
  )
}

// 时间信息组件
const TimeInfo = ({ item }: { item: Item }) => {
  return (
    <div className="relative">
      <div className="space-y-6">
        {item.expiry_date && (
          <InfoCard label="过期日期" value={formatDate(item.expiry_date)} />
        )}
        
        <InfoCard label="创建时间" value={formatDateTime(item.created_at)} />
        <InfoCard label="更新时间" value={formatDateTime(item.updated_at)} />
      </div>
      
      {/* 天数差显示 */}
      {item.expiry_date && (
        <div className="absolute right-4" style={{ top: '23%' }}>
          <div className="bg-background px-3 py-2 rounded-full border shadow-md">
            <span className="text-xs font-medium whitespace-nowrap text-foreground">
              {calculateDaysDifference(item.created_at, item.expiry_date) || 0}天
            </span>
          </div>
        </div>
      )}
      
      <div className="absolute right-4" style={{ top: item.expiry_date ? '59%' : '36%' }}>
        <div className="bg-background px-3 py-2 rounded-full border shadow-md">
          <span className="text-xs font-medium whitespace-nowrap text-foreground">
            {calculateDaysDifference(item.created_at, item.updated_at) || 0}天
          </span>
        </div>
      </div>
    </div>
  )
}

// 加载状态组件
const LoadingState = () => (
  <div className="container mx-auto py-2">
    <div className="flex justify-center items-center h-64">
      <p>加载中...</p>
    </div>
  </div>
)

// 错误状态组件
const ErrorState = ({ error, onBack }: { error?: Error, onBack: () => void }) => (
  <div className="container mx-auto py-2">
    <div className="flex flex-col justify-center items-center h-64">
      <p className="text-red-500 mb-4">{error?.message || '物品不存在'}</p>
      <Button onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回物品列表
      </Button>
    </div>
  </div>
)

export default function ItemDetail() {
  const params = useParams()
  const router = useRouter()
  const { deleteItem } = useItemStore()
  const { data: item, error, isLoading: loading } = useItem(Number(params.id))
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  
  const handleEdit = () => {
    router.push(`/thing/${params.id}/edit`)
  }
  
  const handleDelete = async () => {
    try {
      await deleteItem(Number(params.id))
      toast.success("物品已成功删除")
      router.push('/thing')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "发生错误，请重试")
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  const handleBack = () => router.push('/thing')
  
  if (loading) return <LoadingState />
  if (error || (!loading && !item)) return <ErrorState error={error} onBack={handleBack} />
  if (!item) return null

  return (
    <div className="container mx-auto py-2">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center w-full">
          <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold truncate">{item.name}</h1>
          <div className="flex justify-end gap-1 ml-auto">
            <Button variant="ghost" onClick={handleEdit} className="flex-1 sm:flex-auto p-1">
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1 sm:flex-auto text-destructive hover:text-destructive hover:bg-destructive/10 p-1" 
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 内容标签页 */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="details">详细信息</TabsTrigger>
        </TabsList>
        
        {/* 基本信息标签页 */}
        <TabsContent value="basic">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <StatusBadges item={item} />
              <TagsDisplay tags={item.tags || []} />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 图片展示 */}
              <ImageGallery 
                images={item.images}
                itemName={item.name}
                activeIndex={activeImageIndex}
                onIndexChange={setActiveImageIndex}
              />
              
              {/* 描述 */}
              <div className="bg-muted/30 p-3 rounded-lg">
                <h3 className="font-medium text-sm text-muted-foreground mb-1">描述</h3>
                <p className="text-xs">{item.description || '无描述'}</p>
              </div>
              
              {/* 基本信息卡片 */}
              {(item.quantity > 1 || item.purchase_price || item.purchase_date) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {item.quantity > 1 && (
                    <InfoCard label="数量" value={item.quantity} />
                  )}
                  {item.purchase_price && (
                    <InfoCard label="价格" value={`¥${item.purchase_price}`} />
                  )}
                  {item.purchase_date && (
                    <InfoCard label="购买日期" value={formatDate(item.purchase_date)} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 详细信息标签页 */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 时间信息 */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>时间信息</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeInfo item={item} />
              </CardContent>
            </Card>
            
            {/* 存放位置 */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>存放位置</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationInfo item={item} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* 删除确认对话框 */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={item.name}
      />
    </div>
  )
} 