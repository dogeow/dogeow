"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
    router.push(`/things/${params.id}/edit`)
  }
  
  const handleDelete = async () => {
    try {
      await deleteItem(Number(params.id))
      toast.success("物品已成功删除")
      router.push('/things')
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
          <Button onClick={() => router.push('/things')}>
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
          <Button variant="outline" size="icon" onClick={() => router.push('/things')} className="mr-4">
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>物品信息</CardTitle>
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(item.status)}
                <Badge variant={item.is_public ? "default" : "outline"}>
                  {item.is_public ? '公开' : '私有'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {item.images && item.images.length > 0 ? (
                  <div className="space-y-2">
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={`http://127.0.0.1:8000/storage/${item.images[activeImageIndex].path}`}
                        alt={item.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    {item.images.length > 1 && (
                      <div className="flex flex-wrap gap-2 py-2">
                        {item.images.map((image, index) => (
                          <div
                            key={image.id}
                            className={`relative w-16 h-16 rounded-md cursor-pointer border-2 ${
                              index === activeImageIndex ? 'border-primary' : 'border-transparent'
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
                
                <div>
                  <h3 className="font-medium mb-2">描述</h3>
                  <p className="text-muted-foreground">{item.description || '无描述'}</p>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-1">数量</h3>
                    <p>{item.quantity}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">分类</h3>
                    <p>{item.category?.name || '未分类'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">购买日期</h3>
                    <p>{formatDate(item.purchase_date)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">过期日期</h3>
                    <p>{formatDate(item.expiry_date)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">购买价格</h3>
                    <p>{item.purchase_price ? `¥${item.purchase_price}` : '无'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">创建时间</h3>
                    <p>{formatDate(item.created_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>存放位置</CardTitle>
            </CardHeader>
            <CardContent>
              {item.spot ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-1">区域</h3>
                    <p>{item.spot.room?.area?.name || '未指定'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">房间</h3>
                    <p>{item.spot.room?.name || '未指定'}</p>
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">具体位置</h3>
                    <p>{item.spot.name}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">未指定存放位置</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
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