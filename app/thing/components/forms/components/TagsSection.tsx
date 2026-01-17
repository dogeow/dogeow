import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Tag as TagIcon, X } from 'lucide-react'
import { isLightColor } from '@/lib/helpers'
import type { Tag } from '../../../types'

interface TagsSectionProps {
  tags: Tag[]
  selectedTags: string[]
  onToggleTag: (tagId: string) => void
  onCreateTag: () => void
}

export const TagsSection = memo<TagsSectionProps>(
  ({ tags, selectedTags, onToggleTag, onCreateTag }) => {
    const getTagStyle = (color: string = '#3b82f6') => ({
      backgroundColor: color,
      color: isLightColor(color) ? '#000' : '#fff',
    })

    return (
      <div className="space-y-2">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-foreground text-lg font-bold">标签</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={onCreateTag}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            <TagIcon className="mr-1 h-3.5 w-3.5" />
          </Button>
        </div>

        <div>
          <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto p-2">
            {tags.map(tag => {
              const isSelected = selectedTags.includes(tag.id.toString())
              return (
                <Badge
                  key={tag.id}
                  style={getTagStyle(tag.color)}
                  className={`my-0.5 flex cursor-pointer items-center px-2 py-0.5 transition-all ${
                    isSelected
                      ? 'ring-offset-background ring-primary shadow-md ring-2 ring-offset-1'
                      : 'ring-offset-background ring-2 ring-transparent ring-offset-1'
                  }`}
                  onClick={() => onToggleTag(tag.id.toString())}
                >
                  <span className="flex-1 whitespace-nowrap">{tag.name}</span>
                  <span className="ml-1 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    {isSelected && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={e => {
                          e.stopPropagation()
                          onToggleTag(tag.id.toString())
                        }}
                      >
                        <X size={12} />
                      </Button>
                    )}
                  </span>
                </Badge>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
)

TagsSection.displayName = 'TagsSection'
