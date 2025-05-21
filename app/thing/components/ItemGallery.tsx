"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { API_URL } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/helpers"
import { Globe, LockIcon } from "lucide-react"

interface ItemGalleryProps {
  items: any[]
}

export default function ItemGallery({ items }: ItemGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [imageSize, setImageSize] = useState(120) // 默认图片大小为中尺寸
  const [maxSize, setMaxSize] = useState(520) // 默认最大尺寸
  const [currentSizePreset, setCurrentSizePreset] = useState<'small' | 'medium' | 'large'>('medium')
  const router = useRouter()
  
  // 监听窗口大小变化，根据屏幕宽度设置最大尺寸和调整当前尺寸
  useEffect(() => {
    const updateSizes = () => {
      const screenWidth = window.innerWidth
      const containerWidth = screenWidth - 40 // 考虑容器边距
      const gapSize = 8 // 图片之间的间距
      
      // 计算不同预设的尺寸，考虑每行显示的图片数和间距
      const largeSize = ensureEven(Math.floor((containerWidth - gapSize) / 2)) // 大尺寸，一行2张
      const mediumSize = ensureEven(Math.floor((containerWidth - (gapSize * 2)) / 4)) // 中尺寸，一行4张
      const smallSize = ensureEven(Math.floor((containerWidth - (gapSize * 4)) / 8)) // 小尺寸，一行8张
      
      // 设置最大单个图片尺寸
      const newMaxSize = Math.min(520, containerWidth)
      setMaxSize(newMaxSize)
      
      // 根据当前选择的预设调整图片尺寸
      if (currentSizePreset === 'large') {
        setImageSize(Math.min(largeSize, newMaxSize))
      } else if (currentSizePreset === 'medium') {
        setImageSize(Math.min(mediumSize, newMaxSize))
      } else if (currentSizePreset === 'small') {
        setImageSize(Math.min(smallSize, newMaxSize))
      }
    }
    
    updateSizes() // 初始化时调用一次
    
    window.addEventListener('resize', updateSizes)
    return () => window.removeEventListener('resize', updateSizes)
  }, [currentSizePreset])
  
  // 格式化日期
  const formatDate = (date: string) => {
    if (!date) return '-'
    try {
      return format(new Date(date), 'yyyy-MM-dd')
    } catch {
      return '无效日期'
    }
  }
  
  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusMap = {
      'active': <Badge className="bg-green-500">正常</Badge>,
      'inactive': <Badge variant="outline">闲置</Badge>,
      'expired': <Badge variant="destructive">已过期</Badge>
    }
    
    return statusMap[status as keyof typeof statusMap] || <Badge variant="secondary">{status}</Badge>
  }
  
  // 打开物品详情页
  const handleViewDetails = (id: number) => {
    router.push(`/thing/${id}`)
  }
  
  // 确保尺寸为偶数的辅助函数
  const ensureEven = (size: number) => size % 2 === 0 ? size : size - 1
  
  // 计算基于屏幕宽度的图片尺寸
  const getCalculatedSize = (preset: 'small' | 'medium' | 'large') => {
    const screenWidth = window.innerWidth
    const containerWidth = screenWidth - 40 // 考虑容器边距
    const gapSize = 8 // 图片之间的间距
    
    const sizeMap = {
      'large': ensureEven(Math.min(Math.floor((containerWidth - gapSize) / 2), maxSize)),
      'medium': ensureEven(Math.min(Math.floor((containerWidth - (gapSize * 2)) / 4), maxSize)),
      'small': ensureEven(Math.min(Math.floor((containerWidth - (gapSize * 4)) / 8), maxSize))
    }
    
    return sizeMap[preset]
  }
  
  // 处理图片大小变化
  const handleSizeChange = (value: number[]) => {
    const newSize = ensureEven(value[0])
    setImageSize(newSize)
    
    // 根据新尺寸设置当前预设
    const smallSize = getCalculatedSize('small')
    const mediumSize = getCalculatedSize('medium')
    const largeSize = getCalculatedSize('large')
    
    if (newSize === smallSize) {
      setCurrentSizePreset('small')
    } else if (newSize === mediumSize) {
      setCurrentSizePreset('medium')
    } else if (newSize === largeSize) {
      setCurrentSizePreset('large')
    }
  }
  
  // 设置预设图片大小
  const setPresetSize = (preset: 'small' | 'medium' | 'large') => {
    setCurrentSizePreset(preset)
    setImageSize(getCalculatedSize(preset))
  }
  
  // 获取图片缩略图URL
  const getThumbnailUrl = (item: any) => {
    if (item.primary_image?.thumbnail_url) return item.primary_image.thumbnail_url
    if (item.images?.[0]?.thumbnail_url) return item.images[0].thumbnail_url
    
    return item.primary_image?.thumbnail_path || item.images?.[0]?.thumbnail_path
  }
  
  // 获取图片完整URL
  const getFullImageUrl = (item: any) => {
    return item.primary_image?.path || (item.images?.length > 0 ? item.images[0].path : '')
  }
  
  // 获取位置完整路径
  const getLocationPath = (spot: any) => {
    if (!spot) return ''
    
    const roomName = spot.room?.name || ''
    const areaName = spot.room?.area?.name || ''
    
    if (areaName && roomName) {
      return `${areaName} > ${roomName} > ${spot.name}`
    }
    
    return spot.name
  }
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 justify-center">
            {['small', 'medium', 'large'].map((size) => (
              <Button 
                key={size}
                variant="outline" 
                className={cn("bg-background border-muted px-3", currentSizePreset === size && "bg-muted text-foreground")}
                onClick={() => setPresetSize(size as 'small' | 'medium' | 'large')}
              >
                {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
              </Button>
            ))}
          </div>
          <div className="flex items-center w-full max-w-md gap-3">
            <div className="flex-grow">
              <Slider
                value={[imageSize]}
                min={40}
                max={maxSize}
                step={10}
                onValueChange={handleSizeChange}
              />
            </div>
            <div className="text-base font-medium text-primary">
              {imageSize}px
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="relative rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border shadow-sm"
            style={{ width: `${imageSize}px`, height: `${imageSize}px` }}
            onClick={() => setSelectedItem(item)}
          >
            {getThumbnailUrl(item) ? (
              <Image
                src={getThumbnailUrl(item)}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                无图片
              </div>
            )}
            
            {item.is_public && imageSize >= 150 && (
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm p-0.5">
                  <Globe className="h-3.5 w-3.5" />
                </Badge>
              </div>
            )}
            
            {imageSize >= 150 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                <p className="text-white/80 text-xs truncate">{item.category?.name || '未分类'}</p>
              </div>
            )}
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
                  src={getFullImageUrl(selectedItem)}
                  alt={selectedItem.name}
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant={selectedItem.is_public ? "default" : "outline"}>
                  {selectedItem.is_public ? 
                    <><Globe className="h-3.5 w-3.5 mr-1" /> 公开</> : 
                    <><LockIcon className="h-3.5 w-3.5 mr-1" /> 私有</>}
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
                  <span className="text-muted-foreground">位置:</span> {getLocationPath(selectedItem.spot)}
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