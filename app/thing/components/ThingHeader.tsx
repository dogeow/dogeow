'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SlidersHorizontal, LayoutList, Grid, X, ChevronDownIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import ItemFilters from './ItemFilters'
import { Category, Tag, Area, Room, Spot, ViewMode, FilterParams } from '@/app/thing/types'
import { isLightColor } from '@/lib/helpers'
import { useUncategorizedCount } from '@/app/thing/hooks/useUncategorizedCount'

interface ThingHeaderProps {
  categories: Category[]
  tags: Tag[]
  areas: Area[]
  rooms: Room[]
  spots: Spot[]
  filters: FilterParams
  hasActiveFilters: boolean
  onApplyFilters: (filters: Record<string, unknown>) => void
}

export default function ThingHeader({
  categories,
  tags,
  areas,
  rooms,
  spots,
  filters,
  hasActiveFilters,
  onApplyFilters,
}: ThingHeaderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('none')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const { count: uncategorizedCount } = useUncategorizedCount()

  // 同步filters到本地状态
  useEffect(() => {
    if (filters.category_id) {
      setSelectedCategory(String(filters.category_id))
    }
    if (filters.tags) {
      const tagsArray = Array.isArray(filters.tags)
        ? filters.tags.map(t => String(t))
        : String(filters.tags).split(',')
      setSelectedTags(tagsArray)
    }
  }, [filters])

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement

      if (tagMenuOpen && !target.closest('.tag-dropdown-container')) {
        setTagMenuOpen(false)
      }

      if (categoryMenuOpen && !target.closest('.category-dropdown-container')) {
        setCategoryMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [tagMenuOpen, categoryMenuOpen])

  // 处理分类变化
  const handleCategoryChange = useCallback(
    (value: string) => {
      setSelectedCategory(value)
      onApplyFilters({
        ...filters,
        category_id: value === 'none' ? undefined : value === 'uncategorized' ? undefined : value,
        page: 1,
      })
    },
    [filters, onApplyFilters]
  )

  // 处理标签点击
  const handleTagClick = useCallback(
    (tagId: string) => {
      const updatedTags = selectedTags.includes(tagId)
        ? selectedTags.filter(id => id !== tagId)
        : [...selectedTags, tagId]

      setSelectedTags(updatedTags)
      onApplyFilters({
        ...filters,
        tags: updatedTags.length > 0 ? updatedTags.join(',') : undefined,
        page: 1,
      })
      setTagMenuOpen(false)
    },
    [selectedTags, filters, onApplyFilters]
  )

  // 获取标签样式
  const getTagStyle = useCallback((color: string = '#3b82f6', isSelected: boolean = false) => {
    return {
      backgroundColor: isSelected ? color : 'transparent',
      color: isSelected ? (isLightColor(color) ? '#000' : '#fff') : color,
      borderColor: color,
    }
  }, [])

  // 渲染分类下拉菜单
  const renderCategoryDropdown = () => (
    <div className="category-dropdown-container relative">
      <Button
        variant="outline"
        onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
        className="border-primary/20 flex w-[110px] items-center justify-between rounded-lg bg-white/90 shadow"
      >
        {selectedCategory === 'none'
          ? '所有分类'
          : selectedCategory === 'uncategorized'
            ? '未分类'
            : categories.find(c => c.id.toString() === selectedCategory)?.name || '所有分类'}
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      </Button>

      {categoryMenuOpen && (
        <div className="border-border bg-popover absolute top-full left-0 z-50 mt-1 w-56 rounded-md border shadow-lg">
          <div className="p-2">
            <div
              className={`hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-md p-2 text-sm ${selectedCategory === 'none' ? 'bg-accent/50 text-accent-foreground' : 'text-popover-foreground'}`}
              onClick={() => {
                handleCategoryChange('none')
                setCategoryMenuOpen(false)
              }}
            >
              所有分类
            </div>
            <div
              className={`hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-md p-2 text-sm ${selectedCategory === 'uncategorized' ? 'bg-accent/50 text-accent-foreground' : 'text-popover-foreground'}`}
              onClick={() => {
                handleCategoryChange('uncategorized')
                setCategoryMenuOpen(false)
              }}
            >
              <span className="flex-1">未分类</span>
              <span className="text-muted-foreground ml-2 text-xs">{uncategorizedCount}</span>
            </div>
            {categories.map(category => (
              <div
                key={category.id}
                className={`hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-md p-2 text-sm ${selectedCategory === category.id.toString() ? 'bg-accent/50 text-accent-foreground' : 'text-popover-foreground'}`}
                onClick={() => {
                  handleCategoryChange(category.id.toString())
                  setCategoryMenuOpen(false)
                }}
              >
                <span className="flex-1">{category.name}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {category.items_count ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // 渲染标签下拉菜单
  const renderTagDropdown = () => (
    <div className="tag-dropdown-container relative">
      <Button
        variant="outline"
        onClick={() => setTagMenuOpen(!tagMenuOpen)}
        className="border-primary/20 flex w-[110px] items-center justify-between rounded-lg bg-white/90 shadow"
      >
        {selectedTags.length > 0 ? `${selectedTags.length}个标签` : '选择标签'}
        <ChevronDownIcon className="ml-2 h-4 w-4" />
      </Button>

      {tagMenuOpen && (
        <div className="border-border bg-popover absolute top-full left-0 z-50 mt-1 w-56 rounded-md border shadow-lg">
          <div className="p-2">
            {selectedTags.length > 0 && (
              <div
                className="text-popover-foreground hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center rounded-md p-2 text-sm"
                onClick={() => {
                  setSelectedTags([])
                  onApplyFilters({ ...filters, tags: undefined, page: 1 })
                  setTagMenuOpen(false)
                }}
              >
                <X className="mr-2 h-3 w-3" />
                清除所有标签
              </div>
            )}

            <div className="py-2">
              <div className="flex max-h-[300px] flex-wrap gap-1 overflow-y-auto p-1">
                {tags.length === 0 ? (
                  <div className="flex w-full justify-center py-2">
                    <span className="text-muted-foreground text-sm">暂无标签</span>
                  </div>
                ) : (
                  tags.map(tag => (
                    <div
                      key={tag.id}
                      className={`relative cursor-pointer rounded-md p-0.5 ${selectedTags.includes(tag.id.toString()) ? 'bg-accent/50' : ''}`}
                      onClick={() => handleTagClick(tag.id.toString())}
                    >
                      <Badge
                        style={getTagStyle(tag.color, selectedTags.includes(tag.id.toString()))}
                        variant={selectedTags.includes(tag.id.toString()) ? 'default' : 'outline'}
                        className="h-6 px-2 text-xs"
                      >
                        {tag.name}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // 渲染视图切换
  const renderViewControls = () => (
    <div className="flex items-center gap-2">
      <Tabs value={viewMode} onValueChange={value => setViewMode(value as ViewMode)}>
        <TabsList className="bg-primary/10 dark:bg-primary/20 grid grid-cols-2">
          <TabsTrigger
            value="list"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
          >
            <LayoutList className="h-4 w-4" />
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
          >
            <Grid className="h-4 w-4" />
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )

  // 渲染筛选侧边栏
  const renderFilterSidebar = () => (
    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mr-1"
          data-state={filtersOpen ? 'open' : 'closed'}
        >
          <SlidersHorizontal className={`mr-2 h-4 w-4 ${hasActiveFilters ? 'text-primary' : ''}`} />
        </Button>
      </SheetTrigger>
      <SheetContent
        className="bg-background text-foreground border-border h-full max-w-[200px] overflow-y-auto border-l p-4 shadow-xl sm:max-w-md"
        side="right"
        onEscapeKeyDown={() => setFiltersOpen(false)}
        onPointerDownOutside={() => setFiltersOpen(false)}
      >
        <SheetTitle className="mb-3 flex justify-between">筛选</SheetTitle>
        <ItemFilters
          onApply={onApplyFilters}
          categories={categories}
          tags={tags}
          areas={areas}
          rooms={rooms}
          spots={spots}
        />
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="mb-4 flex w-full flex-wrap items-center gap-2">
      {renderCategoryDropdown()}
      {renderTagDropdown()}
      {renderViewControls()}
      {renderFilterSidebar()}
    </div>
  )
}
