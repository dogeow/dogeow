import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn, isLightColor } from '@/lib/helpers'
import { Tag } from '../types'

interface TagCardProps {
  tag: Partial<Tag> & {
    id: string | number
    name: string
  }
  count?: number
  onDelete?: () => void
  className?: string
}

export default function TagCard({ tag, count, onDelete, className }: TagCardProps) {
  // 防止渲染错误
  if (!tag?.name) return null

  // 设置标签样式
  const tagStyle = {
    backgroundColor: tag.color || '#3b82f6',
    color: isLightColor(tag.color || '#3b82f6') ? '#000' : '#fff',
    borderColor: 'transparent',
  }

  return (
    <Card className={cn('p-0 shadow-sm transition-shadow hover:shadow-md', className)}>
      <CardContent className="p-0">
        <div className="flex items-center">
          <Badge
            style={tagStyle}
            className="h-full flex-grow rounded-r-none px-2 py-0.5 text-xs font-medium"
          >
            {tag.name}
            {count !== undefined && <span className="ml-1 opacity-80">{count}</span>}
          </Badge>

          {onDelete && (
            <button
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                onDelete()
              }}
              className="group bg-background hover:bg-accent flex h-full items-center justify-center rounded-r-md border border-l-0 p-0.5"
            >
              <X className="text-muted-foreground group-hover:text-foreground h-3 w-3" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
