'use client'

import { Card } from '@/components/ui/card'
import { Item } from '@/app/thing/types'
import { TagList } from './TagList'
import { LocationDisplay } from './LocationDisplay'
import ItemCardImage from './ItemCardImage'
import { Skeleton } from '@/components/ui/skeleton'

interface ItemCardProps {
  item: Item
  onEdit: () => void
  onView: () => void
  isLoading?: boolean
}

export default function ItemCard({ item, onView, isLoading = false }: ItemCardProps) {
  if (isLoading) {
    return (
      <Card className="flex min-h-[72px] flex-row items-center gap-3 px-3 py-3">
        <Skeleton className="h-14 w-14 flex-shrink-0 rounded" />
        <div className="flex min-w-0 flex-grow flex-col space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="ml-auto h-3 w-20" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="group hover:bg-accent/30 border-border/50 hover:border-border flex min-h-[72px] cursor-pointer flex-row items-center gap-3 px-3 py-3 transition-all duration-200 hover:shadow-md"
      onClick={onView}
    >
      {/* 缩略图，优化尺寸和圆角 */}
      <div className="bg-muted/50 h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border transition-shadow group-hover:shadow-sm">
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
      <div className="flex min-w-0 flex-grow flex-col space-y-1">
        {/* 标题和分类行 */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="group-hover:text-foreground max-w-[120px] truncate text-sm font-medium transition-colors sm:max-w-[200px] sm:text-base md:max-w-[300px]">
            {item.name}
          </h3>
          <span className="text-muted-foreground bg-muted/50 flex-shrink-0 rounded-full px-2 py-0.5 text-xs">
            {item.category?.name || '未分类'}
          </span>
        </div>

        {/* 描述行 */}
        {item.description && (
          <p className="text-muted-foreground max-w-full truncate text-xs leading-relaxed">
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
          <span className="text-muted-foreground ml-auto flex-shrink-0 text-xs">
            <LocationDisplay spot={item.spot} />
          </span>
        </div>
      </div>
    </Card>
  )
}
