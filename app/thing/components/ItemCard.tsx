"use client"

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe } from "lucide-react"
// format from date-fns is no longer needed here directly
import { toast } from "sonner"
import Image from "next/image"
import { useItemStore } from '@/app/thing/stores/itemStore'
import { del } from '@/lib/api'
import { Item } from '@/app/thing/types'
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog" // Updated path
import { TagList } from "./TagList"
import { LocationDisplay } from "./LocationDisplay"

// 本地图片数据类型（用于组件内部状态）
interface ImageData {
  id?: number
  path?: string
  url?: string
  thumbnail_path?: string
  thumbnail_url?: string
  is_primary?: boolean
}

interface ItemCardProps {
  item: Item
  onEdit: () => void
  onView: () => void
}

export default function ItemCard({ item, onEdit, onView }: ItemCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { fetchItems } = useItemStore()
  const [imageError, setImageError] = useState(false)
  const [primaryImage, setPrimaryImage] = useState<ImageData | null>(null)

  // 状态对应的边框颜色
  const itemStatusColors = {
    'active': 'border-transparent',
    'idle': 'border-amber-500',
    'expired': 'border-red-500',
    'damaged': 'border-orange-500',
    'inactive': 'border-gray-500',
    'default': 'border-transparent'
  }

  // 从图片数组中找出主图
  useEffect(() => {
    if (item.primary_image) {
      setPrimaryImage(item.primary_image);
    } else if (item.images && item.images.length > 0) {
      const primary = item.images.find(img => img.is_primary === true);
      setPrimaryImage(primary || item.images[0]);
    } else {
      setPrimaryImage(null); // Ensure it's reset if no images
    }
  }, [item.primary_image, item.images]);
  
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
    return itemStatusColors[status as keyof typeof itemStatusColors] || itemStatusColors.default
  }
  
  // 渲染图片
  const renderImage = (className: string) => {
    if (primaryImage && !imageError) {
      // 优先使用thumbnail_url，然后是url，最后才构造URL
      const imageUrl = primaryImage.thumbnail_url || primaryImage.url;
      
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
            onError={() => setImageError(true)}
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
  
  return (
    <Card 
      className="hover:shadow-md transition-shadow py-0 cursor-pointer"
      onClick={onView}
    >
      <div className="p-2">
        <div className="flex items-center mb-1 justify-between">
          <div className={`relative w-16 h-16 bg-muted rounded-md mr-2 flex-shrink-0 border-2 ${getStatusBorderColor(item.status)}`}>
            {renderImage("object-cover rounded-md")}
            {item.is_public ? (
              <div className="absolute top-0 right-0">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm p-0.5">
                  <Globe className="h-3 w-3" />
                </Badge>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col flex-1 min-w-0 gap-0.5">
            {/* 名称和分类 */}
            <div className="flex justify-between items-start">
              <div className="flex w-full justify-between items-center">
                <h3 className="font-semibold truncate text-base">{item.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{item.category?.name || '未分类'}</p>
              </div>
            </div>
            {/* 描述 */}
            <div className="font-medium text-sm truncate">{item.description || ''}</div>
            {/* 标签 */}
            <TagList tags={item.tags || []} />
            {/* 位置 */}
            <div className="flex justify-between flex-auto">
              <LocationDisplay spot={item.spot} />
            </div>
          </div>
        </div>
      </div>
      
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={item.name}
      />
    </Card>
  )
}