"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Edit, Trash2 } from "lucide-react"
import { format } from 'date-fns'
import Image from "next/image"
import { toast } from "sonner"
import { useItemStore } from '@/app/thing/stores/itemStore'
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
import { isLightColor } from '@/lib/helpers'

export default function ItemDetail() {
  const params = useParams()
  const router = useRouter()
  const { getItem, deleteItem } = useItemStore()
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const itemData = await getItem(Number(params.id))
        if (itemData) {
          setItem(itemData)
        } else {
          setError('物品不存在')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchItem()
  }, [params.id, getItem])
  
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
  
  const formatDate = (date: string) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'yyyy-MM-dd')
    } catch (e) {
      return '无效日期'
    }
  }
  
  if (loading) {
    return (
      <>
        <div className="container mx-auto py-2 px-4">
          <div className="flex justify-center items-center h-64">
            <p>加载中...</p>
          </div>
        </div>
      </>
    )
  }
  
  if (error || !item) {
    return (
      <>
        <div className="container mx-auto py-2 px-4">
          <div className="flex flex-col justify-center items-center h-64">
            <p className="text-red-500 mb-4">{error || '物品不存在'}</p>
            <Button onClick={() => router.push('/thing')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回物品列表
            </Button>
          </div>
        </div>
      </>
    )
  }
  
  const statusMap = {
    active: { label: '正常', variant: 'bg-green-500' },
    inactive: { label: '闲置', variant: 'outline' },
    expired: { label: '已过期', variant: 'destructive' }
  }
  
  const status = statusMap[item.status as keyof typeof statusMap] || { label: item.status, variant: 'secondary' }
  
  const renderTags = (item: any) => {
    if (!item.tags || item.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mt-3">
        <h3 className="font-medium text-xs text-muted-foreground mt-1">标签:</h3>
        {item.tags.map((tag: any) => (
          <Badge
            key={tag.id}
            style={{
              backgroundColor: tag.color || '#3b82f6',
              color: isLightColor(tag.color) ? '#000' : '#fff'
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
      <div className="container mx-auto py-2 px-4">
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
                    <Badge variant={item.is_public ? "default" : "outline"}>
                      {item.is_public ? '公开' : '私有'}
                    </Badge>
                  </div>
                </div>
                {renderTags(item)}
              </CardHeader>
              <CardContent className="space-y-6">
                {item.images && item.images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-sm">
                      <Image
                        src={item.images[activeImageIndex].url || item.images[activeImageIndex].path}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    
                    {item.images.length > 1 && (
                      <div className="flex flex-wrap gap-2 py-2 justify-center">
                        {item.images.map((image: any, index: number) => (
                          <div
                            key={image.id}
                            className={`relative w-16 h-16 rounded-md cursor-pointer border-2 transition-all ${
                              index === activeImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/50'
                            }`}
                            onClick={() => setActiveImageIndex(index)}
                          >
                            <Image
                              src={image.thumbnail_url}
                              alt={`${item.name} 图片 ${index + 1}`}
                              fill
                              className="object-cover rounded-sm"
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
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-background p-3 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-xs text-muted-foreground">数量</h3>
                    <p className="text-sm font-semibold">{item.quantity}</p>
                  </div>
                  <div className="bg-background p-3 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-xs text-muted-foreground">价格</h3>
                    <p className="text-sm font-semibold">{item.purchase_price ? `¥${item.purchase_price}` : '-'}</p>
                  </div>
                  <div className="bg-background p-3 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-xs text-muted-foreground">购买日期</h3>
                    <p className="text-sm font-semibold">{formatDate(item.purchase_date)}</p>
                  </div>
                </div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-background p-3 rounded-lg border shadow-sm">
                      <h3 className="font-medium text-xs text-muted-foreground">过期日期</h3>
                      <p className="text-sm font-semibold">{formatDate(item.expiry_date)}</p>
                    </div>
                    <div className="bg-background p-3 rounded-lg border shadow-sm">
                      <h3 className="font-medium text-xs text-muted-foreground">创建时间</h3>
                      <p className="text-sm font-semibold">{formatDate(item.created_at)}</p>
                    </div>
                    <div className="bg-background p-3 rounded-lg border shadow-sm col-span-1 sm:col-span-2">
                      <h3 className="font-medium text-xs text-muted-foreground">更新时间</h3>
                      <p className="text-sm font-semibold">{formatDate(item.updated_at)}</p>
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
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">区域</h3>
                        <p className="text-sm font-semibold truncate">
                          {item.spot?.room?.area?.name || item.area?.name || (item.area_id ? `区域 ${item.area_id}` : '未指定')}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">房间</h3>
                        <p className="text-sm font-semibold truncate">
                          {item.spot?.room?.name || item.room?.name || (item.room_id ? `房间 ${item.room_id}` : '未指定')}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">具体位置</h3>
                        <p className="text-sm font-semibold truncate">
                          {item.spot?.name || ''}
                        </p>
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
        
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除 "{item.name}" 吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
} 