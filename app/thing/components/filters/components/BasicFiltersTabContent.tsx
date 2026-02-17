import { memo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TagSelector, Tag } from '@/components/ui/tag-selector'
import CategoryTreeSelect, { CategorySelection } from '../../CategoryTreeSelect'
import type { FilterState } from '../types'

interface BasicFiltersTabContentProps {
  filters: FilterState
  selectedCategory: CategorySelection | undefined
  tags: Tag[]
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onStatusChange: (value: string) => void
  onIsPublicChange: (value: boolean | null) => void
  onTagsChange: (selectedTags: string[]) => void
  onCategorySelect: (type: 'parent' | 'child', id: number | null) => void
}

export const BasicFiltersTabContent = memo<BasicFiltersTabContentProps>(
  ({
    filters,
    selectedCategory,
    tags,
    onNameChange,
    onDescriptionChange,
    onStatusChange,
    onIsPublicChange,
    onTagsChange,
    onCategorySelect,
  }) => {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base font-medium">名称</Label>
          <Input
            value={filters.name}
            onChange={e => onNameChange(e.target.value)}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
          />
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">描述</Label>
          <Input
            value={filters.description}
            onChange={e => onDescriptionChange(e.target.value)}
            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary h-11 border"
          />
        </div>

        {/* 分类筛选：父子级联，可清空 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">分类</Label>
          <CategoryTreeSelect onSelect={onCategorySelect} selectedCategory={selectedCategory} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground mt-2 text-xs"
            onClick={() => onCategorySelect('parent', null)}
            disabled={!selectedCategory}
          >
            清空分类筛选
          </Button>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">状态</Label>
          <div className="bg-muted border-border rounded-lg border px-2 py-1">
            <Select value={filters.status} onValueChange={onStatusChange}>
              <SelectTrigger className="bg-background text-foreground h-11 border-none">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground border">
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">使用中</SelectItem>
                <SelectItem value="archived">已归档</SelectItem>
                <SelectItem value="expired">已过期</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">公开状态</Label>
          <Select
            value={
              filters.is_public === null ? 'null' : filters.is_public === true ? 'true' : 'false'
            }
            onValueChange={value => onIsPublicChange(value === 'null' ? null : value === 'true')}
          >
            <SelectTrigger className="bg-background border-input text-foreground h-11 border">
              <SelectValue placeholder="所有物品" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground border">
              <SelectItem value="null">所有物品</SelectItem>
              <SelectItem value="true">公开</SelectItem>
              <SelectItem value="false">私有</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">标签</Label>
          <div className="bg-muted border-border rounded-lg border px-2 py-1">
            <TagSelector
              tags={tags}
              selectedTags={
                typeof filters.tags === 'string'
                  ? filters.tags.split(',').filter(Boolean)
                  : Array.isArray(filters.tags)
                    ? filters.tags.map(t => t.toString())
                    : []
              }
              onChange={onTagsChange}
              placeholder="选择标签"
            />
          </div>
        </div>
      </div>
    )
  }
)

BasicFiltersTabContent.displayName = 'BasicFiltersTabContent'
