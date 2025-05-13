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
import { API_URL } from '@/utils/api'
import { useRouter } from 'next/navigation'
import { cn } from "@/lib/utils"
import { Globe, LockIcon } from "lucide-react"

interface ItemGalleryProps {
  items: any[]
}

export default function ItemGallery({ items }: ItemGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [imageSize, setImageSize] = useState(120) // 默认图片大小为中尺寸
  const [showSizeControls, setShowSizeControls] = useState(true) // 控制大小调整区域的显示/隐藏
  const [maxSize, setMaxSize] = useState(520) // 默认最大尺寸
  const [currentSizePreset, setCurrentSizePreset] = useState<'small' | 'medium' | 'large'>('medium')
  const router = useRouter()
  
  // 监听窗口大小变化，根据屏幕宽度设置最大尺寸和调整当前尺寸
  useEffect(() => {
    const updateSizes = () => {
      const screenWidth = window.innerWidth
      const containerWidth = screenWidth - 40 // 考虑容器边距
      const gapSize = 8 // 图片之间的间距 (2px * (n-1))
      
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
    
    // 初始化时调用一次
    updateSizes()
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateSizes)
    
    // 组件卸载时移除监听器
    return () => window.removeEventListener('resize', updateSizes)
  }, [currentSizePreset]) // 依赖添加 currentSizePreset
  
  // 构建正确的图片URL
  const getImageUrl = (path: string) => {
    if (!path) return ''
    // 移除URL中可能存在的/api/部分，添加空字符串作为默认值
    const baseUrl = (API_URL || '').replace('/api', '')
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
  
  // 确保尺寸为偶数的辅助函数
  const ensureEven = (size: number) => {
    // 如果是奇数，则减1使其成为偶数
    return size % 2 === 0 ? size : size - 1
  }
  
  // 计算基于屏幕宽度的图片尺寸
  const getCalculatedSize = (preset: 'small' | 'medium' | 'large') => {
    const screenWidth = window.innerWidth
    const containerWidth = screenWidth - 40 // 考虑容器边距
    const gapSize = 8 // 图片之间的间距
    
    if (preset === 'large') {
      return ensureEven(Math.min(Math.floor((containerWidth - gapSize) / 2), maxSize)) // 大尺寸，一行2张
    } else if (preset === 'medium') {
      return ensureEven(Math.min(Math.floor((containerWidth - (gapSize * 2)) / 4), maxSize)) // 中尺寸，一行4张
    } else {
      return ensureEven(Math.min(Math.floor((containerWidth - (gapSize * 4)) / 8), maxSize)) // 小尺寸，一行8张
    }
  }
  
  // 处理图片大小变化
  const handleSizeChange = (value: number[]) => {
    // 确保滑块调整的尺寸也是偶数
    const newSize = ensureEven(value[0])
    setImageSize(newSize)
    // 清除当前预设选择状态
    setCurrentSizePreset(newSize === getCalculatedSize('small') ? 'small' : 
                         newSize === getCalculatedSize('medium') ? 'medium' : 
                         newSize === getCalculatedSize('large') ? 'large' : null as any)
  }
  
  // 设置预设图片大小
  const setPresetSize = (preset: 'small' | 'medium' | 'large') => {
    setCurrentSizePreset(preset)
    const newSize = getCalculatedSize(preset)
    setImageSize(newSize)
  }
  
  // 切换大小控制区域的显示/隐藏
  const toggleSizeControls = () => {
    setShowSizeControls(!showSizeControls)
  }
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              className={cn("bg-background border-muted px-3", currentSizePreset === 'small' && "bg-muted text-foreground")}
              onClick={() => setPresetSize('small')}
            >
              小
            </Button>
            <Button 
              variant="outline" 
              className={cn("bg-background border-muted px-3", currentSizePreset === 'medium' && "bg-muted text-foreground")}
              onClick={() => setPresetSize('medium')}
            >
              中
            </Button>
            <Button 
              variant="outline" 
              className={cn("bg-background border-muted px-3", currentSizePreset === 'large' && "bg-muted text-foreground")}
              onClick={() => setPresetSize('large')}
            >
              大
            </Button>
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
      
      <div className={cn(
        "flex flex-wrap gap-2 justify-center"
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
                src={item.primary_image?.thumbnail_url || item.images[0]?.thumbnail_url || getImageUrl(item.primary_image?.thumbnail_path || item.images[0].thumbnail_path)}
                alt={item.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                无图片
              </div>
            )}
            
            {item.is_public && imageSize >= 150 ? (
              <div className="absolute top-2 left-2">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm p-0.5">
                  <Globe className="h-3.5 w-3.5" />
                </Badge>
              </div>
            ) : null}
            
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
                  src={getImageUrl(selectedItem.primary_image?.path || (selectedItem.images && selectedItem.images.length > 0 ? selectedItem.images[0].path : ''))}
                  alt={selectedItem.name}
                  fill
                  className="object-contain"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
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