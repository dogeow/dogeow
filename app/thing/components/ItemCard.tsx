"use client"

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { format } from 'date-fns'
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { toast } from "sonner"
import Image from "next/image"
import { useItemStore } from '@/stores/itemStore'
import { API_BASE_URL } from '@/configs/api'

interface ItemCardProps {
  item: any
  viewMode: 'grid' | 'list'
  onEdit: () => void
  onView: () => void
}

export default function ItemCard({ item, viewMode, onEdit, onView }: ItemCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { fetchItems } = useItemStore()
  const [imageError, setImageError] = useState(false)
  const [primaryImage, setPrimaryImage] = useState<any>(null)
  
  // 从图片数组中找出主图
  useEffect(() => {
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      // 优先查找 is_primary 为 true 的图片
      const primary = item.images.find((img: any) => img.is_primary === true)
      
      // 如果没有找到主图，则使用第一张图片
      setPrimaryImage(primary || item.images[0])
    } else if (item.primary_image) {
      // 如果已经有 primary_image 属性，直接使用
      setPrimaryImage(item.primary_image)
    }
  }, [item.images, item.primary_image])
  
  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('删除失败')
      }
      
      toast.success("物品已成功删除")
      
      // 刷新物品列表，使用 Zustand store 而不是刷新页面
      fetchItems()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setDeleteDialogOpen(false)
    }
  }
  
  const getStatusColor = (status: string) => {
    const statusColors = {
      'active': 'bg-green-500',
      'inactive': 'bg-gray-500',
      'expired': 'bg-red-500',
      'default': 'bg-blue-500'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.default
  }
  
  const formatDate = (date: string) => {
    if (!date) return '无'
    try {
      return format(new Date(date), 'yyyy-MM-dd')
    } catch (e) {
      return '无效日期'
    }
  }
  
  // 渲染位置信息
  const renderLocation = () => {
    if (!item.spot?.name) return <p className="text-xs text-muted-foreground">未指定位置</p>
    
    return (
      <p className="text-xs text-muted-foreground truncate w-full">
        <span className="inline-block mr-1">📍</span>
        {item.spot.room?.area?.name ? `${item.spot.room.area.name} > ` : ''}
        {item.spot.room?.name ? `${item.spot.room.name} > ` : ''}
        {item.spot.name}
      </p>
    )
  }
  
  // 构建正确的图片URL
  const getImageUrl = (path: string) => {
    // 移除URL中可能存在的/api/部分
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}/storage/${path}`;
  }
  
  // 渲染图片
  const renderImage = (className: string) => {
    if (primaryImage && !imageError) {
      const imagePath = primaryImage.thumbnail_path || primaryImage.path
      
      if (!imagePath) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            无图片路径
          </div>
        )
      }
      
      return (
        <div className="relative w-full h-full">
          <Image
            src={getImageUrl(imagePath)}
            alt={item.name}
            fill
            className={className}
            onError={(e) => {
              console.error('图片加载失败:', imagePath, e);
              setImageError(true)
            }}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )
    }
    
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        无图片
      </div>
    )
  }
  
  // 渲染操作菜单
  const renderActionMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={viewMode === 'grid' ? "bg-background/80 backdrop-blur-sm" : "h-8 w-8"}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          查看
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
  
  // 渲染物品信息网格
  const renderInfoGrid = (columns: string) => (
    <div className={`grid ${columns} gap-x-3 gap-y-1 text-sm mb-2`}>
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground">数量</p>
        <p className="font-medium text-sm">{item.quantity}</p>
      </div>
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground">价格</p>
        <p className="font-medium text-sm">{item.purchase_price ? `¥${item.purchase_price}` : '无'}</p>
      </div>
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground">购买日期</p>
        <p className="font-medium text-sm truncate">{formatDate(item.purchase_date)}</p>
      </div>
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground">过期日期</p>
        <p className="font-medium text-sm truncate">{formatDate(item.expiry_date)}</p>
      </div>
    </div>
  )
  
  if (viewMode === 'grid') {
    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="relative aspect-square bg-muted">
          {renderImage("object-cover")}
          <div className="absolute top-2 right-2">
            {renderActionMenu()}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <div className="flex justify-between items-center">
              <Badge variant={item.is_public ? "default" : "outline"} className="bg-background/80 backdrop-blur-sm">
                {item.is_public ? '公开' : '私有'}
              </Badge>
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(item.status))} />
            </div>
          </div>
        </div>
        <div className="flex flex-col flex-grow p-3">
          <div className="mb-2">
            <h3 className="font-semibold truncate text-base">{item.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{item.category?.name || '未分类'}</p>
          </div>
          
          {renderInfoGrid("grid-cols-2")}
          
          <div className="mt-auto">
            {renderLocation()}
          </div>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex p-3">
        <div className="relative w-20 h-20 bg-muted rounded-md mr-3 flex-shrink-0">
          {renderImage("object-cover rounded-md")}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center">
            <Badge variant={item.is_public ? "default" : "outline"} className="bg-background/80 backdrop-blur-sm text-xs">
              {item.is_public ? '公开' : '私有'}
            </Badge>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-2">
              <h3 className="font-semibold truncate text-base">{item.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{item.category?.name || '未分类'}</p>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <div className={cn("w-3 h-3 rounded-full", getStatusColor(item.status))} />
              {renderActionMenu()}
            </div>
          </div>
          {renderInfoGrid("grid-cols-2 sm:grid-cols-4 mt-1")}
          <div className="mt-1">
            {renderLocation()}
          </div>
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
    </Card>
  )
} 