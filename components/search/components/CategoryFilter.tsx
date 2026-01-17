'use client'

/**
 * 搜索分类过滤器组件
 */
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  name: string
}

interface CategoryFilterProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  getCategoryCount: (categoryId: string) => number
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
  getCategoryCount,
}: CategoryFilterProps) {
  return (
    <div className="mb-4 flex-shrink-0">
      <div className="mb-2 text-sm font-medium">搜索范围:</div>
      <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
        {categories.map(category => (
          <Button
            key={category.id}
            size="sm"
            variant={activeCategory === category.id ? 'secondary' : 'outline'}
            onClick={() => onCategoryChange(category.id)}
            className="h-6 px-2 text-xs whitespace-nowrap"
          >
            {category.name}{' '}
            {getCategoryCount(category.id) > 0 ? `(${getCategoryCount(category.id)})` : ''}
          </Button>
        ))}
      </div>
    </div>
  )
}
