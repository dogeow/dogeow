'use client'

import React, { memo } from 'react'
import { Loader2, Search } from 'lucide-react'
import { SearchResultItem } from './SearchResultItem'
import type { SearchResult } from '../types'
import type { Category } from '../hooks/useSearchCategories'

interface SearchResultsListProps {
  loading: boolean
  searchTerm: string
  filteredResults: SearchResult[]
  categories: Category[]
  hasSearched: boolean
  isAuthenticated: boolean
  imageErrors: Record<string, boolean>
  onImageError: (resultKey: string) => void
  onResultClick: (url: string) => void
}

export const SearchResultsList = memo<SearchResultsListProps>(
  ({
    loading,
    searchTerm,
    filteredResults,
    categories,
    hasSearched,
    isAuthenticated,
    imageErrors,
    onImageError,
    onResultClick,
  }) => {
    if (loading) {
      return (
        <div className="flex min-h-[120px] flex-col items-center justify-center py-8">
          <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
          <p className="text-muted-foreground mt-2 text-sm">搜索中...</p>
        </div>
      )
    }

    if (searchTerm && filteredResults.length === 0 && hasSearched) {
      return (
        <div className="flex min-h-[120px] flex-col items-center justify-center py-8">
          <p className="text-muted-foreground text-sm">未找到相关结果</p>
          {!isAuthenticated && (
            <p className="text-muted-foreground mt-2 text-xs">登录后可搜索更多内容</p>
          )}
        </div>
      )
    }

    if (searchTerm) {
      return (
        <div className="space-y-2">
          {filteredResults.map(result => (
            <SearchResultItem
              key={`${result.category}-${result.id}`}
              result={result}
              categories={categories}
              imageErrors={imageErrors}
              onImageError={onImageError}
              onClick={onResultClick}
            />
          ))}
        </div>
      )
    }

    return (
      <div className="flex min-h-[120px] flex-col items-center justify-center py-8">
        <Search className="text-muted-foreground/50 mb-2 h-8 w-8" />
        <p className="text-muted-foreground text-sm">请输入搜索关键词</p>
        {!isAuthenticated && (
          <p className="text-muted-foreground mt-2 text-xs">登录后可搜索更多内容</p>
        )}
      </div>
    )
  }
)

SearchResultsList.displayName = 'SearchResultsList'
