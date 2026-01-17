import React, { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { isLightColor } from '@/lib/helpers'
import type { Tag } from '@/app/thing/types'

interface TagsDisplayProps {
  tags: Tag[]
}

export const TagsDisplay = memo<TagsDisplayProps>(({ tags }) => {
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
})

TagsDisplay.displayName = 'TagsDisplay'
