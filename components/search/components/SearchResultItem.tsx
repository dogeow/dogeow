'use client'

import React, { memo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock } from 'lucide-react'
import { ResultThumbnail } from './ResultThumbnail'
import { HighlightText } from './HighlightText'
import type { SearchResult } from '../types'
import type { Category } from '../hooks/useSearchCategories'

/**
 * SearchResultItem 组件 Props
 */
interface SearchResultItemProps {
  result: SearchResult
  categories: Category[]
  imageErrors: Record<string, boolean>
  onImageError: (resultKey: string) => void
  onClick: (url: string) => void
  /** 搜索关键词，用于高亮 */
  searchTerm?: string
}

/**
 * 搜索结果项组件
 *
 * @example
 * ```tsx
 * <SearchResultItem
 *   result={result}
 *   categories={categories}
 *   imageErrors={imageErrors}
 *   onImageError={handleImageError}
 *   onClick={handleClick}
 *   searchTerm={searchTerm}
 * />
 * ```
 */
export const SearchResultItem = memo<SearchResultItemProps>(
  ({ result, categories, imageErrors, onImageError, onClick, searchTerm }) => {
    const resultKey = `${result.category}-${result.id}`
    const imageError = imageErrors[resultKey]
    const categoryName = categories.find(c => c.id === result.category)?.name || result.category

    return (
      <div
        className="bg-card hover:bg-accent/50 border-border/50 cursor-pointer rounded-lg border p-3 transition-colors"
        onClick={() => onClick(result.url)}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(result.url)
          }
        }}
      >
        <div className="flex gap-3">
          {/* 图片区域 */}
          {result.thumbnail_url && (
            <ResultThumbnail
              src={imageError ? undefined : result.thumbnail_url}
              alt={result.title}
              onError={() => onImageError(resultKey)}
            />
          )}

          {/* 内容区域 */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="flex-1 truncate text-sm leading-tight font-medium">
                {searchTerm ? (
                  <HighlightText text={result.title} highlight={searchTerm} />
                ) : (
                  result.title
                )}
              </h3>
              <div className="flex flex-shrink-0 items-center gap-1">
                <Badge variant="outline" className="text-xs whitespace-nowrap">
                  {categoryName}
                </Badge>
                {result.category === 'thing' && 'isPublic' in result && (
                  <Badge
                    variant={result.isPublic ? 'secondary' : 'default'}
                    className="flex items-center gap-1 text-xs"
                  >
                    {result.isPublic ? (
                      <Unlock className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {result.isPublic ? '公开' : '私有'}
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {searchTerm ? (
                <HighlightText text={result.content} highlight={searchTerm} />
              ) : (
                result.content
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }
)

SearchResultItem.displayName = 'SearchResultItem'
