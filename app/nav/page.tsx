'use client'

import { useState, useEffect, Suspense, useMemo, useRef } from 'react'
import { Plus, Settings, Lock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNavStore } from '@/app/nav/stores/navStore'
import { useThemeStore, getCurrentThemeColor } from '@/stores/themeStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'
import { useTranslation } from '@/hooks/useTranslation'
import { NavCard } from './components/NavCard'
import { NavCategory } from '@/app/nav/types'
import { PageContainer } from '@/components/layout'

// 搜索组件
function SearchBar({ onSearch }: { onSearch: (term: string) => void }) {
  const { searchTerm, setSearchTerm } = useNavStore()
  const [localSearch, setLocalSearch] = useState(searchTerm)

  // 防抖搜索
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
      />
    </div>
  )
}

// 分类侧边栏
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
  return (
    <aside className="flex w-20 shrink-0 flex-col gap-1 px-2 py-2">
      <button
        className={`rounded px-2 py-1 text-left text-sm font-bold transition-colors ${
          selectedCategory === 'all' ? '' : 'hover:bg-gray-100'
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
            selectedCategory === cat.id ? 'font-bold' : 'hover:bg-gray-100'
          }`}
          style={selectedCategory === cat.id ? { background: themeColor.color, color: '#fff' } : {}}
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}
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
  const [displayItems, setDisplayItems] = useState(items)

  const { currentTheme, customThemes } = useThemeStore()
  const themeColor = getCurrentThemeColor(currentTheme, customThemes)
  const { requireLogin, isAuthenticated } = useLoginTrigger()
  const { t } = useTranslation()

  // 根据搜索词和分类筛选项目
  const filteredItems = useMemo(() => {
    let result = items

    // 按分类筛选
    if (selectedCategory !== 'all') {
      result = result.filter(item => item.nav_category_id === selectedCategory)
    }

    // 按搜索词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        item =>
          item.name.toLowerCase().includes(term) || item.description?.toLowerCase().includes(term)
      )
    }

    return result
  }, [items, selectedCategory, searchTerm])

  // 更新显示的项目
  useEffect(() => {
    setDisplayItems(filteredItems)
  }, [filteredItems])

  // 初始数据加载 - 使用 ref 确保只运行一次
  const initialLoadRef = useRef(false)

  useEffect(() => {
    if (initialLoadRef.current) return
    initialLoadRef.current = true

    const fetchData = async () => {
      try {
        await fetchCategories(initialFilter)
        await fetchItems()
        const hasData = categories.length > 0 || items.length > 0
        if (!initialFilter && !hasData) {
          applySampleData()
        }
      } catch (error) {
        console.error('获取导航数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Effect 仅在挂载时运行一次，不需要依赖项
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 分类点击处理
  const handleCategoryClick = async (catId: number | 'all') => {
    setSelectedCategory(catId)
    await fetchItems(catId === 'all' ? undefined : catId)
  }

  // 处理搜索
  const onSearch = (term: string) => {
    handleSearch(term)
    const newUrl = term ? `?filter[name]=${encodeURIComponent(term)}` : '/nav'
    router.push(newUrl, { scroll: false })
  }

  const handleAddNav = () => {
    requireLogin(() => {
      router.push('/nav/add')
    })
  }

  const handleManageCategories = () => {
    requireLogin(() => {
      router.push('/nav/categories')
    })
  }

  return (
    <PageContainer className="py-2">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">网址导航</h1>
        <div className="flex items-center gap-2">
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
      </div>
      <div className="flex">
        <CategorySidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleCategoryClick}
          themeColor={themeColor}
        />
        <div className="border-border flex flex-1 flex-col gap-2 border-l border-dashed px-2">
          {loading || storeLoading ? null : displayItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {displayItems.map(item => (
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

// 主页面组件
export default function NavPage() {
  return (
    <Suspense fallback={null}>
      <NavContent />
    </Suspense>
  )
}
