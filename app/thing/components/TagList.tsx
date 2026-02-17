import * as React from 'react'
import { Tag } from '@/app/thing/types'
import { isLightColor } from '@/lib/helpers/colorUtils'
import { Badge } from '@/components/ui/badge'

interface TagListProps {
  tags: Tag[]
}

export const TagList = React.memo(function TagList({ tags }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(tag => {
        const tagStyle = {
          backgroundColor: tag.color || '#ccc',
          color: isLightColor(tag.color || '#ccc') ? '#000' : '#fff',
        }
        return (
          <Badge key={tag.id} style={tagStyle} variant="outline">
            {tag.name}
          </Badge>
        )
      })}
    </div>
  )
})
