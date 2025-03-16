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
    if (!date) return '无'
    try {
      return format(new Date(date), 'yyyy-MM-dd')
    } catch (e) {
      return '无效日期'
    }
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">正常</Badge>
      case 'inactive':
        return <Badge variant="outline">闲置</Badge>
      case 'expired':
        return <Badge variant="destructive">已过期</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-center items-center h-64">
          <p>加载中...</p>
        </div>
      </div>
    )
  }
  
  if (error || !item) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col justify-center items-center h-64">
          <p className="text-red-500 mb-4">{error || '物品不存在'}</p>
          <Button onClick={() => router.push('/thing')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回物品列表
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="icon" onClick={() => router.push('/thing')} className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold truncate">{item.name}</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleEdit} className="flex-1 sm:flex-auto">
            <Edit className="mr-2 h-4 w-4" /> 编辑
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="flex-1 sm:flex-auto">
            <Trash2 className="mr-2 h-4 w-4" /> 删除
          </Button>
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
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(item.status)}
                  <Badge variant={item.is_public ? "default" : "outline"}>
                    {item.is_public ? '公开' : '私有'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {item.images && item.images.length > 0 ? (
                <div className="space-y-3">
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-sm">
                    <Image
                      src={`http://127.0.0.1:8000/storage/${item.images[activeImageIndex].path}`}
                      alt={item.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  {item.images.length > 1 && (
                    <div className="flex flex-wrap gap-2 py-2 justify-center">
                      {item.images.map((image, index) => (
                        <div
                          key={image.id}
                          className={`relative w-16 h-16 rounded-md cursor-pointer border-2 transition-all ${
                            index === activeImageIndex ? 'border-primary ring-2 ring-primary/20' : 'border-muted hover:border-muted-foreground/50'
                          }`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <Image
                            src={`http://127.0.0.1:8000/storage/${image.thumbnail_path}`}
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
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-medium mb-2 text-sm text-muted-foreground">描述</h3>
                <p className="text-foreground">{item.description || '无描述'}</p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-background p-4 rounded-lg border shadow-sm">
                  <h3 className="font-medium mb-1 text-sm text-muted-foreground">数量</h3>
                  <p className="text-xl font-semibold">{item.quantity}</p>
                </div>
                <div className="bg-background p-4 rounded-lg border shadow-sm">
                  <h3 className="font-medium mb-1 text-sm text-muted-foreground">分类</h3>
                  <p className="text-xl font-semibold">{item.category?.name || '未分类'}</p>
                </div>
                <div className="bg-background p-4 rounded-lg border shadow-sm">
                  <h3 className="font-medium mb-1 text-sm text-muted-foreground">价格</h3>
                  <p className="text-xl font-semibold">{item.purchase_price ? `¥${item.purchase_price}` : '无'}</p>
                </div>
                <div className="bg-background p-4 rounded-lg border shadow-sm">
                  <h3 className="font-medium mb-1 text-sm text-muted-foreground">状态</h3>
                  <p className="text-xl font-semibold">{
                    item.status === 'active' ? '正常' : 
                    item.status === 'inactive' ? '闲置' : 
                    item.status === 'expired' ? '已过期' : item.status
                  }</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-background p-4 rounded-lg border shadow-sm">
                    <h3 className="font-medium mb-1 text-sm text-muted-foreground">购买日期</h3>
                    <p className="text-lg font-semibold">{formatDate(item.purchase_date)}</p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border shadow-sm">
                    <h3 className="font-medium mb-1 text-sm text-muted-foreground">过期日期</h3>
                    <p className="text-lg font-semibold">{formatDate(item.expiry_date)}</p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border shadow-sm">
                    <h3 className="font-medium mb-1 text-sm text-muted-foreground">创建时间</h3>
                    <p className="text-lg font-semibold">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="bg-background p-4 rounded-lg border shadow-sm">
                    <h3 className="font-medium mb-1 text-sm text-muted-foreground">更新时间</h3>
                    <p className="text-lg font-semibold">{formatDate(item.updated_at)}</p>
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
                  <div className="space-y-4">
                    <div className="bg-background p-4 rounded-lg border shadow-sm">
                      <h3 className="font-medium mb-1 text-sm text-muted-foreground">区域</h3>
                      <p className="text-lg font-semibold">{item.spot.room?.area?.name || '未指定'}</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border shadow-sm">
                      <h3 className="font-medium mb-1 text-sm text-muted-foreground">房间</h3>
                      <p className="text-lg font-semibold">{item.spot.room?.name || '未指定'}</p>
                    </div>
                    <div className="bg-background p-4 rounded-lg border shadow-sm">
                      <h3 className="font-medium mb-1 text-sm text-muted-foreground">具体位置</h3>
                      <p className="text-lg font-semibold">{item.spot.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
                    <p className="text-muted-foreground">未指定存放位置</p>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 