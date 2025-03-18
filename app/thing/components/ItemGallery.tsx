"use client"

import { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { API_BASE_URL } from '@/configs/api'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { LayoutGrid, Grid2X2, Grid3X3, ChevronDown, ChevronUp, Globe, LockIcon } from "lucide-react"

interface ItemGalleryProps {
  items: any[]
}

export default function ItemGallery({ items }: ItemGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [imageSize, setImageSize] = useState(150) // 默认图片大小
  const [showSizeControls, setShowSizeControls] = useState(true) // 控制大小调整区域的显示/隐藏
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
  
  // 处理图片大小变化
  const handleSizeChange = (value: number[]) => {
    setImageSize(value[0])
  }
  
  // 设置预设图片大小
  const setPresetSize = (size: number) => {
    setImageSize(size)
  }
  
  // 切换大小控制区域的显示/隐藏
  const toggleSizeControls = () => {
    setShowSizeControls(!showSizeControls)
  }
  
  // 计算每行显示的列数
  const getGridCols = () => {
    if (imageSize < 100) return "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
    if (imageSize < 150) return "grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8"
    if (imageSize < 200) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
    return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  }
  
  return (
    <div>
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleSizeControls} 
          className="flex items-center gap-1 bg-primary/10 border-primary/20 mb-2"
        >
          <span className="text-sm">图片大小控制</span>
          {showSizeControls ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        
        {showSizeControls && (
          <div className="flex flex-wrap items-center gap-4 p-2 bg-primary/5 rounded-md border border-primary/10">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                className={cn("bg-primary/10 border-primary/20", imageSize === 80 && "bg-primary text-primary-foreground")}
                onClick={() => setPresetSize(80)}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className={cn("bg-primary/10 border-primary/20", imageSize === 120 && "bg-primary text-primary-foreground")}
                onClick={() => setPresetSize(120)}
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className={cn("bg-primary/10 border-primary/20", imageSize === 160 && "bg-primary text-primary-foreground")}
                onClick={() => setPresetSize(160)}
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                className={cn("bg-primary/10 border-primary/20", imageSize === 220 && "bg-primary text-primary-foreground")}
                onClick={() => setPresetSize(220)}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <div className="w-48">
              <Slider
                value={[imageSize]}
                min={80}
                max={250}
                step={10}
                onValueChange={handleSizeChange}
                className="bg-primary/10 rounded-full"
              />
            </div>
            <div className="text-xs text-primary-foreground bg-primary/20 px-2 py-1 rounded-full">{imageSize}px</div>
          </div>
        )}
      </div>
      
      <div className={cn(
        "grid gap-4",
        getGridCols()
      )}>
        {items.map((item) => (
          <div 
            key={item.id} 
            className="relative rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border shadow-sm"
            style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
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
              <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                无图片
              </div>
            )}
            
            {item.is_public && (
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm p-0.5">
                  <Globe className="h-3.5 w-3.5" />
                </Badge>
              </div>
            )}
            
            <div className="absolute top-2 right-2">
              {getStatusBadge(item.status)}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-white text-sm font-medium truncate">{item.name}</p>
              <p className="text-white/80 text-xs truncate">{item.category?.name || '未分类'}</p>
              {item.quantity !== 0 && item.quantity && (
                <p className="text-white/80 text-xs truncate">数量: {item.quantity}</p>
              )}
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
                  {selectedItem.is_public ? <><Globe className="h-3.5 w-3.5 mr-1" /> 公开</> : <><LockIcon className="h-3.5 w-3.5 mr-1" /> 私有</>}
                </Badge>
                {selectedItem.category && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {selectedItem.category.name}
                  </Badge>
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