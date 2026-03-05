'use client'

import { useState, useEffect, Suspense, useMemo, useRef, useCallback } from 'react'
import { Plus, Settings, Lock, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNavStore } from '@/app/nav/stores/navStore'
import { useThemeStore, getCurrentThemeColor } from '@/stores/themeStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'
import { useTranslation } from '@/hooks/useTranslation'
import { NavCard } from './components/NavCard'
import { NavCategory } from '@/app/nav/types'
import { PageContainer, PageHeader } from '@/components/layout'
import { cn } from '@/lib/helpers'

function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  const { searchTerm } = useNavStore()
  const [localSearch, setLocalSearch] = useState(searchTerm)

  useEffect(() => {
    setLocalSearch(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchTerm) {
        onSearch(localSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearch, searchTerm])

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        placeholder="搜索导航..."
        value={localSearch}
        onChange={e => setLocalSearch(e.target.value)}
        className="pl-9"
        aria-label="搜索导航"
      />
    </div>
  )
}

function CategorySidebar({
  categories,
  selectedCategory,
  onSelect,
  themeColor,
}: {
  categories: NavCategory[]
  selectedCategory: number | 'all'
  onSelect: (id: number | 'all') => void
  themeColor: { color: string }
}) {
  const getButtonClassName = (isActive: boolean) =>
    cn(
      'rounded-md px-2 py-1 text-left text-sm transition-colors',
      isActive
        ? 'font-semibold text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
    )

  return (
    <aside className="flex w-20 shrink-0 flex-col gap-1 px-2 py-2" aria-label="导航分类">
      <button
        className={`rounded px-2 py-1 text-left text-sm font-bold transition-colors ${
          selectedCategory === 'all' ? '' : 'hover:bg-muted'
        }`}
        style={selectedCategory === 'all' ? { background: themeColor.color, color: '#fff' } : {}}
        onClick={() => onSelect('all')}
      >
        全部
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`rounded px-2 py-1 text-left text-sm transition-colors ${
            selectedCategory === cat.id ? 'font-bold' : 'hover:bg-muted'
          }`}
          style={selectedCategory === cat.id ? { background: themeColor.color, color: '#fff' } : {}}
          onClick={() => onSelect(cat.id)}
          title={cat.name}
        >
          <span className="block truncate">{cat.name}</span>
        </button>
      ))}
    </aside>
  )
}

function NavContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter[name]') || ''

  const {
    categories,
    items,
    loading: storeLoading,
    fetchCategories,
    fetchItems,
    applySampleData,
    searchTerm,
    handleSearch,
  } = useNavStore()

  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all')

  const { currentTheme, customThemes } = useThemeStore()
  const themeColor = getCurrentThemeColor(currentTheme, customThemes)
  const { requireLogin, isAuthenticated } = useLoginTrigger()
  const { t } = useTranslation()

  const filteredItems = useMemo(() => {
    let result = items

    if (selectedCategory !== 'all') {
      result = result.filter(item => item.nav_category_id === selectedCategory)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term)
      )
    }

    return result
  }, [items, selectedCategory, searchTerm])

  const initialLoadRef = useRef(false)
  const initialFilterRef = useRef(initialFilter)

  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true

    if (initialFilterRef.current) {
      handleSearch(initialFilterRef.current)
    }

    const fetchData = async () => {
      try {
        await fetchCategories(initialFilterRef.current)
        await fetchItems()
        const hasData = categories.length > 0 || items.length > 0
        if (!initialFilterRef.current && !hasData) {
          applySampleData()
        }
      } catch (error) {
        console.error('获取导航数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchCategories, fetchItems, applySampleData, categories.length, items.length, handleSearch])

  const handleCategoryClick = useCallback(
    async (catId: number | 'all') => {
      setSelectedCategory(catId)
      await fetchItems(catId === 'all' ? undefined : catId)
    },
    [fetchItems]
  )

  const onSearch = useCallback(
    (term: string) => {
      handleSearch(term)
      const newUrl = term ? `?filter[name]=${encodeURIComponent(term)}` : '/nav'
      router.push(newUrl, { scroll: false })
    },
    [handleSearch, router]
  )

  const handleAddNav = useCallback(() => {
    requireLogin(() => {
      router.push('/nav/add')
    })
  }, [requireLogin, router])

  const handleManageCategories = useCallback(() => {
    requireLogin(() => {
      router.push('/nav/categories')
    })
  }, [requireLogin, router])

  const isLoading = loading || storeLoading

  return (
    <PageContainer className="py-2">
      <PageHeader
        title="网址导航"
        description="按分类快速浏览常用站点，支持搜索与登录后管理。"
        className="mb-3"
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="w-full sm:w-64">
              <SearchBar onSearch={onSearch} />
            </div>
            <Button
              onClick={handleAddNav}
              size="icon"
              variant="default"
              className="relative h-9 w-9"
              disabled={!isAuthenticated}
              style={{
                backgroundColor: themeColor.color,
                color: '#fff',
                opacity: !isAuthenticated ? 0.6 : 1,
              }}
              aria-label={t('nav.add_nav', '添加导航')}
            >
              <Plus className="h-4 w-4" />
              {!isAuthenticated && <Lock className="h-3 w-3 text-white" />}
            </Button>
            <Button
              onClick={handleManageCategories}
              size="icon"
              variant="outline"
              className="relative h-9 w-9"
              disabled={!isAuthenticated}
              style={{ opacity: !isAuthenticated ? 0.6 : 1 }}
              aria-label={t('nav.manage_categories', '管理分类')}
            >
              <Settings className="h-4 w-4" />
              {!isAuthenticated && <Lock className="text-muted-foreground ml-1 h-3 w-3" />}
            </Button>
          </div>
        }
      />
      <div className="flex gap-2">
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleCategoryClick}
          themeColor={themeColor}
        />
        <div className="border-border flex flex-1 flex-col gap-2 border-l border-dashed px-2">
          {isLoading ? (
            <div
              className="flex items-center justify-center py-12"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              <span className="text-muted-foreground ml-2 text-sm">加载中...</span>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredItems.map(item => (
                <NavCard key={item.id} item={item} highlight={searchTerm} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-xl font-semibold">
                {searchTerm ? '没有找到匹配的导航' : '没有找到任何导航'}
              </p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

export default function NavPage() {
  return (
    <Suspense fallback={null}>
      <NavContent />
    </Suspense>
  )
}
