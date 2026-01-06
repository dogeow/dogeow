'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Edit, Trash2, Lock, Unlock } from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'
import ImagePlaceholder from '@/components/ui/icons/image-placeholder'
import { toast } from 'sonner'
import { useItemStore } from '@/app/thing/stores/itemStore'
import { useItem } from '../services/api'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { isLightColor } from '@/lib/helpers'
import { statusMap } from '../config/status'
import { Item, Tag } from '@/app/thing/types'
import { ItemRelationsDisplay } from '../components/ItemRelationsDisplay'
import { useAuth } from '@/hooks/useAuth'

// 日期格式化工具函数
const formatDate = (date: string | null) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'yyyy-MM-dd')
  } catch {
    return '无效日期'
  }
}

const formatDateTime = (date: string | null) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
  } catch {
    return '无效日期'
  }
}

const calculateDaysDifference = (startDate: string | null, endDate: string | null) => {
  if (!startDate || !endDate) return null
  try {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return null
  }
}

// 标签渲染组件
const TagsDisplay = ({ tags }: { tags: Tag[] }) => {
  if (!tags || tags.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <h3 className="text-muted-foreground mt-1 text-xs font-medium">标签:</h3>
      {tags.map((tag: Tag) => (
        <Badge
          key={tag.id}
          style={{
            backgroundColor: tag.color || '#3b82f6',
            color: isLightColor(tag.color || '#3b82f6') ? '#000' : '#fff',
          }}
          className="h-6 px-2"
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  )
}

// 图片展示组件
const ImageGallery = ({
  images,
  itemName,
  activeIndex,
  onIndexChange,
}: {
  images: Item['images']
  itemName: string
  activeIndex: number
  onIndexChange: (index: number) => void
}) => {
  if (!images || images.length === 0) {
    return (
      <div className="bg-muted flex h-48 items-center justify-center rounded-lg">
        <ImagePlaceholder className="text-gray-400 opacity-40" size={64} />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-lg shadow-sm">
        {(() => {
          const safeIndex = Math.min(Math.max(activeIndex, 0), images.length - 1)
          const url = images[safeIndex]?.url || ''
          return (
            <Image
              src={url}
              alt={itemName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )
        })()}
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 py-2">
          {images.map((image, index: number) => (
            <div
              key={image.id}
              className={`relative aspect-square h-16 w-16 cursor-pointer overflow-hidden rounded-md border-2 transition-all ${
                index === activeIndex
                  ? 'border-primary ring-primary/20 ring-2'
                  : 'border-muted hover:border-muted-foreground/50'
              }`}
              onClick={() => onIndexChange(index)}
            >
              <Image
                src={image.thumbnail_url || ''}
                alt={`${itemName} 图片 ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 信息卡片组件
const InfoCard = ({
  label,
  value,
  className = '',
}: {
  label: string
  value: string | number
  className?: string
}) => (
  <div className={`bg-background rounded-lg border p-3 shadow-sm ${className}`}>
    <h3 className="text-muted-foreground text-xs font-medium">{label}</h3>
    <p className="text-sm font-semibold">{value}</p>
  </div>
)

// 基本信息标签组件
const StatusBadges = ({ item }: { item: Item }) => {
  const status = statusMap[item.status as keyof typeof statusMap] || {
    label: item.status,
    variant: 'secondary',
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="px-3 py-1 text-sm">
        {item.category?.name || '未分类'}
      </Badge>
      <Badge
        className={status.variant === 'bg-green-500' ? status.variant : ''}
        variant={
          status.variant !== 'bg-green-500'
            ? (status.variant as 'outline' | 'destructive' | 'secondary' | 'default')
            : undefined
        }
      >
        {status.label}
      </Badge>
      <Badge variant={item.is_public ? 'default' : 'outline'} className="flex items-center gap-1">
        {item.is_public ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
        {item.is_public ? '公开' : '私有'}
      </Badge>
    </div>
  )
}

// 位置信息组件
const LocationInfo = ({ item }: { item: Item }) => {
  const hasLocation = item.area_id || item.room_id || item.spot_id

  if (!hasLocation) {
    return (
      <div className="bg-muted flex h-20 items-center justify-center rounded-lg">
        <p className="text-muted-foreground text-sm">未指定存放位置</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {item.spot?.room?.area?.name && <InfoCard label="区域" value={item.spot.room.area.name} />}
        {item.spot?.room?.name && <InfoCard label="房间" value={item.spot.room.name} />}
        {item.spot?.name && <InfoCard label="位置" value={item.spot.name} />}
      </div>
    </div>
  )
}

// 时间信息组件
const TimeInfo = ({ item }: { item: Item }) => {
  return (
    <div className="relative">
      <div className="space-y-6">
        {item.expiry_date && <InfoCard label="过期日期" value={formatDate(item.expiry_date)} />}

        <InfoCard label="创建时间" value={formatDateTime(item.created_at)} />
        <InfoCard label="更新时间" value={formatDateTime(item.updated_at)} />
      </div>

      {/* 天数差显示 */}
      {item.expiry_date && (
        <div className="absolute right-4" style={{ top: '23%' }}>
          <div className="bg-background rounded-full border px-3 py-2 shadow-md">
            <span className="text-foreground text-xs font-medium whitespace-nowrap">
              {calculateDaysDifference(item.created_at, item.expiry_date) || 0}天
            </span>
          </div>
        </div>
      )}

      <div className="absolute right-4" style={{ top: item.expiry_date ? '59%' : '36%' }}>
        <div className="bg-background rounded-full border px-3 py-2 shadow-md">
          <span className="text-foreground text-xs font-medium whitespace-nowrap">
            {calculateDaysDifference(item.created_at, item.updated_at) || 0}天
          </span>
        </div>
      </div>
    </div>
  )
}

// 加载状态组件
const LoadingState = () => (
  <div className="container mx-auto py-2">
    <div className="flex h-64 items-center justify-center">
      <p>加载中...</p>
    </div>
  </div>
)

// 错误状态组件
const ErrorState = ({ error, onBack }: { error?: Error; onBack: () => void }) => (
  <div className="container mx-auto py-2">
    <div className="flex h-64 flex-col items-center justify-center">
      <p className="mb-4 text-red-500">{error?.message || '物品不存在'}</p>
      <Button onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" /> 返回物品列表
      </Button>
    </div>
  </div>
)

export default function ItemDetail() {
  const params = useParams()
  const router = useRouter()
  const { deleteItem } = useItemStore()
  const { user } = useAuth()
  const itemId = useMemo(() => {
    const raw = (params as Record<string, string | string[] | undefined>)?.id
    const idString = Array.isArray(raw) ? raw[0] : raw
    const parsed = Number.parseInt(idString ?? '', 10)
    return Number.isFinite(parsed) ? parsed : NaN
  }, [params])

  const { data: item, error, isLoading: loading } = useItem(itemId)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // 检查是否可以编辑（是否为物品所有者）
  const canEdit = useMemo(() => {
    return user && item && item.user?.id === user.id
  }, [user, item])

  const handleEdit = useCallback(() => {
    if (!Number.isFinite(itemId)) return
    router.push(`/thing/${itemId}/edit`)
  }, [router, itemId])

  const handleDelete = useCallback(async () => {
    try {
      if (!Number.isFinite(itemId)) throw new Error('无效的物品编号')
      await deleteItem(itemId)
      toast.success('物品已成功删除')
      router.push('/thing')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '发生错误，请重试')
    } finally {
      setDeleteDialogOpen(false)
    }
  }, [deleteItem, itemId, router])

  const handleBack = useCallback(() => router.push('/thing'), [router])

  // Keep active image index within bounds whenever images change
  useEffect(() => {
    const length = item?.images?.length ?? 0
    if (length === 0) {
      if (activeImageIndex !== 0) setActiveImageIndex(0)
      return
    }
    if (activeImageIndex > length - 1) setActiveImageIndex(0)
    if (activeImageIndex < 0) setActiveImageIndex(0)
  }, [item?.images, activeImageIndex])

  if (loading) return <LoadingState />
  if (error || (!loading && !item)) return <ErrorState error={error} onBack={handleBack} />
  if (!item) return null

  return (
    <div className="container mx-auto py-2">
      {/* 页面头部 */}
      <div className="mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex w-full items-center">
          <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2 p-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="truncate text-2xl font-bold md:text-3xl">{item.name}</h1>
          <div className="ml-auto flex justify-end gap-1">
            <Button variant="ghost" onClick={handleEdit} className="flex-1 p-1 sm:flex-auto">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 p-1 sm:flex-auto"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 内容标签页 */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="details">详细信息</TabsTrigger>
          <TabsTrigger value="relations">关联物品</TabsTrigger>
        </TabsList>

        {/* 基本信息标签页 */}
        <TabsContent value="basic">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <StatusBadges item={item} />
              <TagsDisplay tags={item.tags || []} />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 图片展示 */}
              <ImageGallery
                images={item.images}
                itemName={item.name}
                activeIndex={activeImageIndex}
                onIndexChange={setActiveImageIndex}
              />

              {/* 描述 */}
              <div className="bg-muted/30 rounded-lg p-3">
                <h3 className="text-muted-foreground mb-1 text-sm font-medium">描述</h3>
                <p className="text-xs">{item.description || '无描述'}</p>
              </div>

              {/* 基本信息卡片 */}
              {(item.quantity > 1 || item.purchase_price || item.purchase_date) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {item.quantity > 1 && <InfoCard label="数量" value={item.quantity} />}
                  {item.purchase_price && (
                    <InfoCard label="价格" value={`¥${item.purchase_price}`} />
                  )}
                  {item.purchase_date && (
                    <InfoCard label="购买日期" value={formatDate(item.purchase_date)} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 详细信息标签页 */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 时间信息 */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>时间信息</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeInfo item={item} />
              </CardContent>
            </Card>

            {/* 存放位置 */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle>存放位置</CardTitle>
              </CardHeader>
              <CardContent>
                <LocationInfo item={item} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 关联物品标签页 */}
        <TabsContent value="relations">
          <Card className="overflow-hidden">
            <CardContent className="pt-6">
              <ItemRelationsDisplay itemId={itemId} canEdit={canEdit} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 删除确认对话框 */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={item.name}
      />
    </div>
  )
}
