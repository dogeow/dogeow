"use client"

import { Card } from "@/components/ui/card"
import { Item } from '@/app/thing/types'
import { TagList } from "./TagList"
import { LocationDisplay } from "./LocationDisplay"
import ItemCardImage from './ItemCardImage'
import { Skeleton } from "@/components/ui/skeleton"

interface ItemCardProps {
  item: Item
  onEdit: () => void
  onView: () => void
  isLoading?: boolean
}

export default function ItemCard({ item, onView, isLoading = false }: ItemCardProps) {
  if (isLoading) {
    return (
      <Card className="flex flex-row items-center gap-3 px-3 py-3 min-h-[72px]">
        <Skeleton className="flex-shrink-0 w-14 h-14 rounded" />
        <div className="flex flex-col flex-grow min-w-0 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="group hover:shadow-md hover:bg-accent/30 transition-all duration-200 cursor-pointer flex flex-row items-center gap-3 px-3 py-3 min-h-[72px] border-border/50 hover:border-border"
      onClick={onView}
    >
      {/* 缩略图，优化尺寸和圆角 */}
      <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border bg-muted/50 group-hover:shadow-sm transition-shadow">
        <ItemCardImage
          initialPrimaryImage={item.primary_image}
          images={item.images}
          itemName={item.name}
          status={item.status}
          isPublic={item.is_public}
          size={56}
        />
      </div>
      
      {/* 右侧信息区，优化布局和响应式 */}
      <div className="flex flex-col flex-grow min-w-0 space-y-1">
        {/* 标题和分类行 */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium truncate text-sm sm:text-base max-w-[120px] sm:max-w-[200px] md:max-w-[300px] group-hover:text-foreground transition-colors">
            {item.name}
          </h3>
          <span className="text-xs text-muted-foreground flex-shrink-0 px-2 py-0.5 bg-muted/50 rounded-full">
            {item.category?.name || '未分类'}
          </span>
        </div>
        
        {/* 描述行 */}
        {item.description && (
          <p className="text-xs text-muted-foreground truncate max-w-full leading-relaxed">
            {item.description}
          </p>
        )}
        
        {/* 标签和位置行 */}
        <div className="flex items-center gap-2 pt-0.5">
          {item.tags && item.tags.length > 0 && (
            <div className="flex-shrink-0">
              <TagList tags={item.tags} />
            </div>
          )}
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
            <LocationDisplay spot={item.spot} />
          </span>
        </div>
      </div>
    </Card>
  )
}