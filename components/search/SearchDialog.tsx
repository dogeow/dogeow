'use client'

import { useState, useEffect, useRef, useCallback, useMemo, startTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import useAuthStore from '@/stores/authStore'
import { useKeyboardStatus } from './hooks/useKeyboardStatus'
import { useSearchCategories } from './hooks/useSearchCategories'
import { useSearchData } from './hooks/useSearchData'
import { SearchInput } from './components/SearchInput'
import { CategoryTabs } from './components/CategoryTabs'
import { SearchResultsList } from './components/SearchResultsList'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSearchTerm?: string
  currentRoute?: string
}

export function SearchDialog({
  open,
  onOpenChange,
  initialSearchTerm = '',
  currentRoute,
}: SearchDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [activeCategory, setActiveCategory] = useState('all')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardOpen = useKeyboardStatus()

  // 使用自定义 hooks
  const categories = useSearchCategories(isAuthenticated)
  const { results, loading, hasSearched } = useSearchData({
    isAuthenticated,
    searchTerm,
    activeCategory,
  })

  // 设置活动类别
  useEffect(() => {
    startTransition(() => {
      if (currentRoute) {
        const routeCategory = currentRoute.split('/')[1]
        const matchedCategory = categories.find(c => c.path.startsWith(`/${routeCategory}`))
        setActiveCategory(matchedCategory?.id || 'all')
      } else {
        setActiveCategory('all')
      }
    })
  }, [currentRoute, categories])

  // 自动聚焦输入框
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  // 处理搜索提交
  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault()

      if (!searchTerm.trim()) return

      if (currentRoute && activeCategory !== 'all') {
        const routeCategory = currentRoute.split('/')[1]
        const matchedCategory = categories.find(c => c.id === activeCategory)

        if (matchedCategory?.path.startsWith(`/${routeCategory}`)) {
          router.push(`${currentRoute}?search=${encodeURIComponent(searchTerm)}`)
          onOpenChange(false)
          return
        }
      }

      const currentApp = pathname.split('/')[1]
      const searchUrl =
        activeCategory === 'all'
          ? `/search?q=${encodeURIComponent(searchTerm)}`
          : currentApp === activeCategory
            ? `/${currentApp}?search=${encodeURIComponent(searchTerm)}`
            : categories.find(c => c.id === activeCategory)?.path +
              `?search=${encodeURIComponent(searchTerm)}`

      if (searchUrl) {
        router.push(searchUrl)
        onOpenChange(false)
      }
    },
    [searchTerm, activeCategory, currentRoute, pathname, categories, router, onOpenChange]
  )

  // 处理结果点击
  const handleResultClick = useCallback(
    (url: string) => {
      router.push(url)
      onOpenChange(false)
    },
    [router, onOpenChange]
  )

  // 获取每个类别的结果数量
  const getCountByCategory = useCallback(
    (category: string) => {
      if (!searchTerm.trim()) return 0
      return results.filter(item => category === 'all' || item.category === category).length
    },
    [searchTerm, results]
  )

  // 获取对话框标题
  const getDialogTitle = useCallback(() => {
    if (currentRoute) {
      const routeCategory = currentRoute.split('/')[1]
      const matchedCategory = categories.find(c => c.path.startsWith(`/${routeCategory}`))
      if (matchedCategory) return `搜索${matchedCategory.name}`
    }

    const currentApp = pathname.split('/')[1]
    if (!currentApp) return '全站搜索'

    const category = categories.find(c => c.id === currentApp)
    return category ? `搜索${category.name}` : '搜索'
  }, [currentRoute, pathname, categories])

  // 处理图片错误
  const handleImageError = useCallback((resultKey: string) => {
    setImageErrors(prev => ({ ...prev, [resultKey]: true }))
  }, [])

  // 过滤结果
  const filteredResults = useMemo(
    () => results.filter(item => activeCategory === 'all' || item.category === activeCategory),
    [results, activeCategory]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-[95vw] sm:max-w-[550px] ${
          keyboardOpen
            ? 'fixed top-2 right-2 left-2 h-[60svh] max-h-[60svh] translate-x-0 translate-y-0'
            : 'max-h-[85svh] sm:max-h-[85vh]'
        } gap-0 overflow-hidden p-0`}
      >
        <div className="flex max-h-[85svh] flex-col p-4 sm:max-h-[85vh] sm:p-6">
          {/* 标题栏 */}
          <DialogHeader className="mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex-1 text-center text-lg font-semibold">
                {getDialogTitle()}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* 搜索输入框 */}
          <SearchInput
            ref={inputRef}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSubmit={handleSearch}
            keyboardOpen={keyboardOpen}
          />

          {/* 搜索范围 */}
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            getCountByCategory={getCountByCategory}
          />

          {/* 搜索结果 */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="pb-2">
              <SearchResultsList
                loading={loading}
                searchTerm={searchTerm}
                filteredResults={filteredResults}
                categories={categories}
                hasSearched={hasSearched}
                isAuthenticated={isAuthenticated}
                imageErrors={imageErrors}
                onImageError={handleImageError}
                onResultClick={handleResultClick}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
