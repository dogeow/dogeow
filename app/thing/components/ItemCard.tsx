"use client"

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe } from "lucide-react"
import { format } from 'date-fns'
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
import { API_URL } from '@/utils/api'
import { del } from '@/utils/api'
import { isLightColor } from '@/lib/utils'

interface ItemCardProps {
  item: any
  onEdit: () => void
  onView: () => void
}

export default function ItemCard({ item, onEdit, onView }: ItemCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { fetchItems } = useItemStore()
  const [imageError, setImageError] = useState(false)
  const [primaryImage, setPrimaryImage] = useState<any>(null)

  const renderTags = (item: any) => {
    if (!item.tags || item.tags.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2">
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
      await del(`/items/${item.id}`)
      
      toast.success("物品已成功删除")
      
      // 刷新物品列表，使用 Zustand store 而不是刷新页面
      fetchItems()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setDeleteDialogOpen(false)
    }
  }
  
  const getStatusBorderColor = (status: string) => {
    const statusColors = {
      'active': 'border-transparent',
      'idle': 'border-amber-500',
      'expired': 'border-red-500',
      'damaged': 'border-orange-500',
      'inactive': 'border-gray-500',
      'default': 'border-transparent'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.default
  }
  
  const formatDate = (date: string) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'yyyy-MM-dd')
    } catch (e) {
      return '无效日期'
    }
  }
  
  // 渲染位置信息
  const renderLocation = () => {
    // 检查是否有spot对象，并且有完整的位置路径
    if (item.spot?.room?.area?.name && item.spot?.room?.name && item.spot?.name) {
      return (
        <p className="text-xs text-muted-foreground truncate">
          <span className="inline-block mr-1">📍</span>
          {item.spot.room.area.name} &gt; {item.spot.room.name} &gt; {item.spot.name}
        </p>
      );
    }
    
    // 检查是否有spot对象，并且有区域和房间
    if (item.spot?.room?.area?.name && item.spot?.room?.name) {
      return (
        <p className="text-xs text-muted-foreground truncate">
          <span className="inline-block mr-1">📍</span>
          {item.spot.room.area.name} &gt; {item.spot.room.name}
        </p>
      );
    }
    
    // 检查是否有spot对象，并且只有区域
    if (item.spot?.room?.area?.name) {
      return (
        <p className="text-xs text-muted-foreground truncate">
          <span className="inline-block mr-1">📍</span>
          {item.spot.room.area.name}
        </p>
      );
    }
    
    // 直接检查area_id和room_id (即使spot为null)
    if (item.area_id || item.room_id) {
      // 尝试获取区域名称
      let locationText = '';
      
      // 尝试从不同来源获取区域名称
      if (item.area?.name) {
        locationText = item.area.name;
      } else if (item.area_id) {
        // 如果只有ID没有名称，至少显示"区域" + ID
        locationText = `区域 ${item.area_id}`;
      }
      
      // 尝试获取房间名称
      if (item.room?.name) {
        locationText += locationText ? ` > ${item.room.name}` : item.room.name;
      } else if (item.room_id && !item.room?.name) {
        // 如果只有ID没有名称
        locationText += locationText ? ` > 房间 ${item.room_id}` : `房间 ${item.room_id}`;
      }
      
      return (
        <p className="text-xs text-muted-foreground truncate">
          <span className="inline-block mr-1">📍</span>
          {locationText || '位置ID存在但名称未知'}
        </p>
      );
    }
    
    // 如果没有任何位置信息
    return <p className="text-xs text-muted-foreground"></p>;
  }
  
  // 构建正确的图片URL
  const getImageUrl = (path: string) => {
    return `${API_URL}/storage/${path}`;
  }
  
  // 渲染图片
  const renderImage = (className: string) => {
    if (primaryImage && !imageError) {
      // 优先使用thumbnail_url，然后是url，最后才构造URL
      const imageUrl = primaryImage.thumbnail_url || primaryImage.url || getImageUrl(primaryImage.thumbnail_path || primaryImage.path)
      
      if (!imageUrl) {
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            无图片路径
          </div>
        )
      }
      
      return (
        <div className="relative w-full h-full">
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className={className}
            onError={(e) => {
              setImageError(true);
              
              // 尝试使用备用URL
              if (imageUrl === primaryImage.thumbnail_url && primaryImage.url) {
                // 如果缩略图加载失败，尝试加载原图
                e.currentTarget.src = primaryImage.url;
              } else if (primaryImage.path && !imageUrl.includes(primaryImage.path)) {
                // 尝试直接构造路径
                e.currentTarget.src = getImageUrl(primaryImage.path);
              }
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
  
  // 渲染物品信息网格
  const renderInfoGrid = () => (
        <div className="font-medium text-sm truncate">{item.description || ''}</div>
  )
  
  // 防止item对象有问题
  if (!item || typeof item !== 'object') {
    return <Card className="p-4">加载错误</Card>
  }
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow py-0 cursor-pointer"
      onClick={onView}
    >
      <div className="p-3">
        <div className="flex items-center mb-2 justify-between">
          <div className={`relative w-20 h-20 bg-muted rounded-md mr-3 flex-shrink-0 border-2 ${getStatusBorderColor(item.status)}`}>
            {renderImage("object-cover rounded-md")}
            {item.is_public ? (
              <div className="absolute top-0 right-0">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm p-0.5">
                  <Globe className="h-3.5 w-3.5" />
                </Badge>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col min-w-0 gap-1">
            <div className="flex justify-between items-start">
              <div className="flex w-full justify-between items-center">
                <h3 className="font-semibold truncate text-base">{item.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{item.category?.name || '未分类'}</p>
              </div>
            </div>
            {renderInfoGrid()}
            {renderTags(item)}
            <div className="flex justify-between flex-auto">
              {renderLocation()}
            </div>
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 