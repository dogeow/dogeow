"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import ItemCard from './ItemCard'
import ItemGallery from './ItemGallery'
import { Item, ViewMode } from '@/app/thing/types'

interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number
  to?: number
}

interface ThingContentProps {
  items: Item[]
  loading: boolean
  error: string | null
  meta: PaginationMeta | null
  currentPage: number
  searchTerm: string
  hasActiveFilters: boolean
  onPageChange: (page: number) => void
  onItemEdit: (id: number) => void
  onItemView: (id: number) => void
  onReload: () => void
  onClearFilters: () => void
}

export default function ThingContent({
  items,
  loading,
  error,
  meta,
  currentPage,
  searchTerm,
  hasActiveFilters,
  onPageChange,
  onItemEdit,
  onItemView,
  onReload,
  onClearFilters
}: ThingContentProps) {
  const [viewMode] = useState<ViewMode>('list')
  const totalPages = meta?.last_page || 1

  // 渲染加载状态
  const renderLoading = () => (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <ItemCard 
          key={`loading-${index}`}
          item={{} as Item} 
          onEdit={() => {}} 
          onView={() => {}} 
          isLoading={true}
        />
      ))}
    </div>
  )

  // 渲染错误状态
  const renderError = () => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold mb-2">加载失败</h3>
      <p className="text-muted-foreground mb-4">无法加载物品数据，请稍后重试</p>
      <Button onClick={onReload} variant="outline">
        重新加载
      </Button>
    </div>
  )

  // 渲染空状态
  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">暂无物品</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {searchTerm || hasActiveFilters
          ? '没有找到符合条件的物品，试试调整筛选条件' 
          : '还没有添加任何物品，点击右下角的加号开始添加吧'
        }
      </p>
      {(searchTerm || hasActiveFilters) && (
        <Button 
          onClick={onClearFilters}
          variant="outline"
          className="mb-4"
        >
          清除筛选条件
        </Button>
      )}
    </div>
  )

  // 渲染分页
  const renderPagination = () => {
    if (totalPages <= 1) return null
    
    return (
      <div className="flex justify-center mt-6 overflow-x-auto pb-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                size="icon"
              />
            </PaginationItem>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                  size="icon"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                size="icon"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    )
  }

  // 渲染物品列表
  const renderItems = () => (
    <>
      {viewMode === 'list' ? (
        <div className="grid gap-4 grid-cols-1">
          {items.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onEdit={() => onItemEdit(item.id)}
              onView={() => onItemView(item.id)}
            />
          ))}
        </div>
      ) : (
        <ItemGallery items={items} />
      )}

      {renderPagination()}
    </>
  )

  // 条件渲染内容
  if (loading) return renderLoading()
  if (error) return renderError()
  return items.length === 0 ? renderEmpty() : renderItems()
} 