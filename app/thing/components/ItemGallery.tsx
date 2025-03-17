"use client"

import { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { API_BASE_URL } from '@/configs/api'
import { useRouter } from 'next/navigation'

interface ItemGalleryProps {
  items: any[]
}

export default function ItemGallery({ items }: ItemGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const router = useRouter()
  
  // 构建正确的图片URL
  const getImageUrl = (path: string) => {
    if (!path) return ''
    // 移除URL中可能存在的/api/部分
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}/storage/${path}`
  }
  
  // 格式化日期
  const formatDate = (date: string) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'yyyy-MM-dd')
    } catch (e) {
      return '无效日期'
    }
  }
  
  // 获取状态标签
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
  
  // 打开物品详情页
  const handleViewDetails = (id: number) => {
    router.push(`/thing/${id}`)
  }
  
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="relative aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border shadow-sm"
            onClick={() => setSelectedItem(item)}
          >
            {item.primary_image || (item.images && item.images.length > 0) ? (
              <Image
                src={getImageUrl(item.primary_image?.thumbnail_path || item.images[0].thumbnail_path)}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-xs text-muted-foreground">无图片</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
              <h3 className="text-white text-sm font-medium truncate">{item.name}</h3>
            </div>
          </div>
        ))}
      </div>
      
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="truncate">{selectedItem.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden shadow-sm">
                <Image
                  src={getImageUrl(selectedItem.primary_image?.path || (selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images[0].path : ''))}
                  alt={selectedItem.name}
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(selectedItem.status)}
                <Badge variant={selectedItem.is_public ? "default" : "outline"}>
                  {selectedItem.is_public ? '公开' : '私有'}
                </Badge>
                {selectedItem.category && (
                  <Badge variant="secondary">{selectedItem.category.name}</Badge>
                )}
              </div>
              
              {selectedItem.description && (
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
              )}
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">数量:</span> {selectedItem.quantity}
                </div>
                <div>
                  <span className="text-muted-foreground">价格:</span> {selectedItem.purchase_price ? `¥${selectedItem.purchase_price}` : '-'}
                </div>
                <div>
                  <span className="text-muted-foreground">购买日期:</span> {formatDate(selectedItem.purchase_date)}
                </div>
                <div>
                  <span className="text-muted-foreground">过期日期:</span> {formatDate(selectedItem.expiry_date)}
                </div>
              </div>
              
              {selectedItem.spot && (
                <div className="text-sm">
                  <span className="text-muted-foreground">位置:</span> {selectedItem.spot.room?.area?.name && selectedItem.spot.room?.name ? 
                    `${selectedItem.spot.room.area.name} > ${selectedItem.spot.room.name} > ${selectedItem.spot.name}` : 
                    selectedItem.spot.name}
                </div>
              )}
              
              <div className="flex justify-end">
                <button 
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    setSelectedItem(null)
                    handleViewDetails(selectedItem.id)
                  }}
                >
                  查看详情
                </button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
} 