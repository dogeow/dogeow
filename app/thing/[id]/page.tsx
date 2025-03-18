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
import { useItemStore } from '@/stores/itemStore'
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
import ThingNavigation from '../components/ThingNavigation'

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
        <ThingNavigation />
        <div className="container mx-auto py-6 px-4">
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
        <ThingNavigation />
        <div className="container mx-auto py-6 px-4">
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
  
  return (
    <>
      <ThingNavigation />
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center w-full">
            <Button variant="outline" size="icon" onClick={() => router.push('/thing')} className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold truncate">{item.name}</h1>
            <div className="flex justify-end gap-2 ml-auto">
              <Button variant="outline" onClick={handleEdit} className="flex-1 sm:flex-auto">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="flex-1 sm:flex-auto">
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
                  <CardTitle>物品信息</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {item.images && item.images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-sm">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${item.images[activeImageIndex].path}`}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge className={status.variant === 'bg-green-500' ? status.variant : ''} variant={status.variant !== 'bg-green-500' ? (status.variant as "outline" | "destructive" | "secondary" | "default") : undefined}>
                          {status.label}
                        </Badge>
                        <Badge variant={item.is_public ? "default" : "outline"}>
                          {item.is_public ? '公开' : '私有'}
                        </Badge>
                      </div>
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
                              src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${image.thumbnail_path}`}
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
                  <h3 className="font-medium text-xs text-muted-foreground mb-1">描述</h3>
                  <p className="text-sm">{item.description || '无描述'}</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-background p-3 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-xs text-muted-foreground">数量</h3>
                    <p className="text-sm font-semibold">{item.quantity}</p>
                  </div>
                  <div className="bg-background p-3 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-xs text-muted-foreground">分类</h3>
                    <p className="text-sm font-semibold truncate">{item.category?.name || '未分类'}</p>
                  </div>
                  <div className="bg-background p-3 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-xs text-muted-foreground">价格</h3>
                    <p className="text-sm font-semibold">{item.purchase_price ? `¥${item.purchase_price}` : '-'}</p>
                  </div>
                  <div className="bg-background p-3 rounded-lg border shadow-sm">
                    <h3 className="font-medium text-xs text-muted-foreground">状态</h3>
                    <p className="text-sm font-semibold">{status.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>详细信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-background p-3 rounded-lg border shadow-sm">
                      <h3 className="font-medium text-xs text-muted-foreground">购买日期</h3>
                      <p className="text-sm font-semibold">{formatDate(item.purchase_date)}</p>
                    </div>
                    <div className="bg-background p-3 rounded-lg border shadow-sm">
                      <h3 className="font-medium text-xs text-muted-foreground">过期日期</h3>
                      <p className="text-sm font-semibold">{formatDate(item.expiry_date)}</p>
                    </div>
                    <div className="bg-background p-3 rounded-lg border shadow-sm">
                      <h3 className="font-medium text-xs text-muted-foreground">创建时间</h3>
                      <p className="text-sm font-semibold">{formatDate(item.created_at)}</p>
                    </div>
                    <div className="bg-background p-3 rounded-lg border shadow-sm">
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
                  {item.spot ? (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-background p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">区域</h3>
                        <p className="text-sm font-semibold truncate">{item.spot.room?.area?.name || '未指定'}</p>
                      </div>
                      <div className="bg-background p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">房间</h3>
                        <p className="text-sm font-semibold truncate">{item.spot.room?.name || '未指定'}</p>
                      </div>
                      <div className="bg-background p-3 rounded-lg border shadow-sm">
                        <h3 className="font-medium text-xs text-muted-foreground">具体位置</h3>
                        <p className="text-sm font-semibold truncate">{item.spot.name}</p>
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