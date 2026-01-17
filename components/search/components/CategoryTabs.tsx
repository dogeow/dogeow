'use client'

import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import type { Category } from '../hooks/useSearchCategories'

interface CategoryTabsProps {
  categories: Category[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
  getCountByCategory: (categoryId: string) => number
}

export const CategoryTabs = memo<CategoryTabsProps>(
  ({ categories, activeCategory, onCategoryChange, getCountByCategory }) => {
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
              {getCountByCategory(category.id) > 0 ? `(${getCountByCategory(category.id)})` : ''}
            </Button>
          ))}
        </div>
      </div>
    )
  }
)

CategoryTabs.displayName = 'CategoryTabs'
