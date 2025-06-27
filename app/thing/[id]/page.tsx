"use client"

import { useState, useEffect } from 'react'
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
import { useItem } from '@/lib/api'
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"
import { isLightColor } from '@/lib/helpers'
import { statusMap } from '../config/status'
import { Item, Tag } from '@/app/thing/types'

export default function ItemDetail() {
  const params = useParams()
  const router = useRouter()
  const { deleteItem } = useItemStore()
  const { data: item, error, isLoading: loading } = useItem(Number(params.id))
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  
  // 添加调试日志
  useEffect(() => {
    if (item) {
      console.log('获取到的物品数据:', item)
      console.log('位置信息:', {
        area_id: item.area_id,
        room_id: item.room_id,
        spot_id: item.spot_id,
        spot: item.spot
      })
    }
  }, [item])
  
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
  
  if (loading) {
    return (
      <>
        <div className="container mx-auto py-2">
          <div className="flex justify-center items-center h-64">
            <p>加载中...</p>
          </div>
        </div>
      </>
    )
  }
  
  if (error || (!loading && !item)) {
    return (
      <>
        <div className="container mx-auto py-2">
          <div className="flex flex-col justify-center items-center h-64">
            <p className="text-red-500 mb-4">{error?.message || '物品不存在'}</p>
            <Button onClick={() => router.push('/thing')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回物品列表
            </Button>
          </div>
        </div>
      </>
    )
  }
  
  // 类型守卫
  if (!item) return null
  
  const status = statusMap[item.status as keyof typeof statusMap] || { label: item.status, variant: 'secondary' }
  
  const renderTags = (item: Item) => {
    if (!item.tags || item.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        <h3 className="font-medium text-xs text-muted-foreground mt-1">标签:</h3>
        {item.tags.map((tag: Tag) => (
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
    );
  };

  return (
    <>
      <div className="container mx-auto py-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
          <div className="flex items-center w-full">
            <Button variant="ghost" size="icon" onClick={() => router.push('/thing')} className="mr-2 p-1">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold truncate">{item.name}</h1>
            <div className="flex justify-end gap-1 ml-auto">
              <Button variant="ghost" onClick={handleEdit} className="flex-1 sm:flex-auto p-1">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" className="flex-1 sm:flex-auto text-destructive hover:text-destructive hover:bg-destructive/10 p-1" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="details">详细信息</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
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
                </div>
                {renderTags(item)}
              </CardHeader>
              <CardContent className="space-y-6">
                {item.images && item.images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden shadow-sm">
                      <Image
                        src={item.images[activeImageIndex].url || ''}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {item.images.length > 1 && (
                      <div className="flex flex-wrap gap-2 py-2 justify-center">
                        {item.images.map((image, index: number) => (
                          <div
                            key={image.id}
                            className={`relative w-16 h-16 aspect-square rounded-md cursor-pointer border-2 transition-all overflow-hidden ${
                              index === activeImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/50'
                            }`}
                            onClick={() => setActiveImageIndex(index)}
                          >
                            <Image
                              src={image.thumbnail_url || ''}
                              alt={`${item.name} 图片 ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                    <p className="text-muted-foreground">无图片</p>
                  </div>
                )}
                
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">描述</h3>
                  <p className="text-xs">{item.description || '无描述'}</p>
                </div>
                
                {/* 只显示有值的信息，数量为1时不显示 */}
                {(item.quantity > 1 || item.purchase_price || item.purchase_date) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* 数量 - 只在大于1时显示 */}
                    {item.quantity > 1 && (
                      <div className="bg-background p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">数量</h3>
                        <p className="text-sm font-semibold">{item.quantity}</p>
                      </div>
                    )}
                    
                    {/* 价格 - 只在有值时显示 */}
                    {item.purchase_price && (
                      <div className="bg-background p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">价格</h3>
                        <p className="text-sm font-semibold">¥{item.purchase_price}</p>
                      </div>
                    )}
                    
                    {/* 购买日期 - 只在有值时显示 */}
                    {item.purchase_date && (
                      <div className="bg-background p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">购买日期</h3>
                        <p className="text-sm font-semibold">{formatDate(item.purchase_date)}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>时间信息</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 统一的时间轴 */}
                  <div className="relative">
                    <div className="space-y-6">
                      {/* 过期日期 - 只在有数据时显示 */}
                      {item.expiry_date && (
                        <div className="bg-background p-3 rounded-lg border shadow-sm">
                          <h3 className="font-medium text-xs text-muted-foreground">过期日期</h3>
                          <p className="text-sm font-semibold">{formatDate(item.expiry_date)}</p>
                        </div>
                      )}
                      
                      {/* 创建时间 */}
                      <div className="bg-background p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">创建时间</h3>
                        <p className="text-sm font-semibold">{formatDateTime(item.created_at)}</p>
                      </div>
                      
                      {/* 更新时间 */}
                      <div className="bg-background p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">更新时间</h3>
                        <p className="text-sm font-semibold">{formatDateTime(item.updated_at)}</p>
                      </div>
                    </div>
                    
                    {/* 过期到创建的天数差 - 只在有过期日期时显示 */}
                    {item.expiry_date && (
                      <div className="absolute right-4" style={{ top: item.expiry_date ? '23%' : 'auto' }}>
                        <div className="bg-background px-3 py-2 rounded-full border shadow-md">
                          <span className="text-xs font-medium whitespace-nowrap text-foreground">
                            {calculateDaysDifference(item.created_at, item.expiry_date) || 0}天
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* 创建到更新的天数差 */}
                    <div className="absolute right-4" style={{ top: item.expiry_date ? '59%' : '36%' }}>
                      <div className="bg-background px-3 py-2 rounded-full border shadow-md">
                        <span className="text-xs font-medium whitespace-nowrap text-foreground">
                          {calculateDaysDifference(item.created_at, item.updated_at) || 0}天
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>存放位置</CardTitle>
                </CardHeader>
                <CardContent>
                  {(item.area_id || item.room_id || item.spot_id) ? (
                    <div className="space-y-3">
                      {/* 三个位置卡片 */}
                      <div className="grid grid-cols-3 gap-3">
                        {item.spot?.room?.area?.name && (
                          <div className="bg-background p-3 rounded-lg border shadow-sm">
                            <h3 className="font-medium text-xs text-muted-foreground">区域</h3>
                            <p className="text-sm font-semibold truncate">
                              {item.spot.room.area.name}
                            </p>
                          </div>
                        )}
                        {item.spot?.room?.name && (
                          <div className="bg-background p-3 rounded-lg border shadow-sm">
                            <h3 className="font-medium text-xs text-muted-foreground">房间</h3>
                            <p className="text-sm font-semibold truncate">
                              {item.spot.room.name}
                            </p>
                          </div>
                        )}
                        {item.spot?.name && (
                          <div className="bg-background p-3 rounded-lg border shadow-sm">
                            <h3 className="font-medium text-xs text-muted-foreground">位置</h3>
                            <p className="text-sm font-semibold truncate">
                              {item.spot.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-20 bg-muted rounded-lg">
                      <p className="text-muted-foreground text-sm">未指定存放位置</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
          itemName={item.name}
        />
      </div>
    </>
  )
} 