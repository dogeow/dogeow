'use client'

import { useState, useEffect, Suspense } from 'react'
import { Plus, Settings, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNavStore } from '@/app/nav/stores/navStore'
import { useThemeStore, getCurrentThemeColor } from '@/stores/themeStore'
import { useLoginTrigger } from '@/hooks/useLoginTrigger'
import { useTranslation } from '@/hooks/useTranslation'
import { NavCard } from './components/NavCard'
import { NavCategory } from '@/app/nav/types'

// 创建一个新的组件来处理搜索参数
function NavContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterName = searchParams.get('filter[name]') || ''
  const {
    categories,
    items,
    loading: storeLoading,
    fetchCategories,
    fetchItems,
    searchTerm,
    setSearchTerm,
    // filteredItems, // 暂时未使用
    handleSearch,
  } = useNavStore()
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<'all' | number>('all')
  const [initialLoaded, setInitialLoaded] = useState(false)
  const { currentTheme, customThemes } = useThemeStore()
  const themeColor = getCurrentThemeColor(currentTheme, customThemes)
  const { requireLogin, isAuthenticated } = useLoginTrigger()
  const { t } = useTranslation()

  // 监听URL中filter[name]参数的变化
  useEffect(() => {
    if (initialLoaded) {
      const handleUrlChange = () => {
        const searchParams = new URLSearchParams(window.location.search)
        const search = searchParams.get('filter[name]')

        if (search && search !== searchTerm) {
          setSearchTerm(search)
          handleSearch(search)
        }
      }

      // 初始检查
      handleUrlChange()

      // 监听popstate事件（历史记录导航，比如前进后退按钮）
      window.addEventListener('popstate', handleUrlChange)

      // 监听自定义搜索事件
      const handleCustomSearch = (event: CustomEvent) => {
        const { searchTerm: newSearchTerm } = event.detail

        // 标准化两个字符串再进行比较
        const normalizedCurrent = String(searchTerm || '').trim()
        const normalizedNew = String(newSearchTerm || '').trim()

        // 确保即使是单个字符也能触发搜索
        const hasChanged = normalizedCurrent !== normalizedNew

        if (hasChanged) {
          setSearchTerm(newSearchTerm)
          handleSearch(newSearchTerm)

          // 更新URL
          const newUrl = newSearchTerm
            ? `?filter[name]=${encodeURIComponent(newSearchTerm)}`
            : window.location.pathname
          router.push(newUrl, { scroll: false })
        }
      }

      // 添加自定义事件监听器
      document.addEventListener('nav-search', handleCustomSearch as EventListener)

      return () => {
        window.removeEventListener('popstate', handleUrlChange)
        document.removeEventListener('nav-search', handleCustomSearch as EventListener)
      }
    }
  }, [initialLoaded, handleSearch, searchTerm, router, setSearchTerm])

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchCategories(filterName)
        await fetchItems()
        setInitialLoaded(true)
      } catch (error) {
        console.error('获取导航分类失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchCategories, fetchItems, filterName])

  // 分类侧边栏
  const handleCategoryClick = async (catId: number | 'all') => {
    setSelectedCategory(catId)
    if (catId === 'all') {
      await fetchItems() // 获取全部
    } else {
      await fetchItems(catId) // 获取该分类
    }
  }

  const renderCategorySidebar = () => (
    <aside className="flex w-20 shrink-0 flex-col gap-0 py-2">
      <button
        className={`rounded px-2 py-1 text-left text-sm font-bold ${selectedCategory === 'all' ? '' : 'hover:bg-gray-100'}`}
        style={selectedCategory === 'all' ? { background: themeColor.color, color: '#fff' } : {}}
        onClick={() => handleCategoryClick('all')}
      >
        全部
      </button>
      {categories.map((cat: NavCategory) => (
        <button
          key={cat.id}
          className={`rounded px-2 py-1 text-left text-sm ${selectedCategory === cat.id ? 'font-bold' : 'hover:bg-gray-100'}`}
          style={selectedCategory === cat.id ? { background: themeColor.color, color: '#fff' } : {}}
          onClick={() => handleCategoryClick(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </aside>
  )

  // 分类筛选 - 注释掉未使用的变量
  // const filteredCategories = categories
  //   .filter(category => selectedCategory === 'all' || category.id === selectedCategory)
  //   .filter(category => category.items && category.items.length > 0)
  //   .map(category => ({
  //     ...category,
  //     items: searchTerm ? (category.items || []).filter(item =>
  //       filteredItems.some(filteredItem => filteredItem.id === item.id)
  //     ) : (category.items || [])
  //   }))
  //   .filter(category => (category.items || []).length > 0);

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
    <div className="flex p-4">
      {renderCategorySidebar()}
      <div className="mx-2 flex flex-1 flex-col gap-2">
        <div className="flex items-center">
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={handleManageCategories}
              size="sm"
              variant="outline"
              className="relative flex items-center gap-1"
              disabled={!isAuthenticated}
              style={{ opacity: !isAuthenticated ? 0.6 : 1 }}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.manage_categories', '管理分类')}</span>
              {!isAuthenticated && <Lock className="text-muted-foreground ml-1 h-3 w-3" />}
            </Button>
            <Button
              onClick={handleAddNav}
              size="sm"
              variant="default"
              className="relative flex items-center gap-1"
              disabled={!isAuthenticated}
              style={{
                backgroundColor: themeColor.color,
                color: '#fff',
                opacity: !isAuthenticated ? 0.6 : 1,
              }}
            >
              <Plus className="h-4 w-4" />
              {!isAuthenticated && <Lock className="h-3 w-3 text-white" />}
            </Button>
          </div>
        </div>

        {loading || storeLoading ? (
          <LoadingSkeleton />
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map(item => (
              <NavCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-xl font-semibold text-gray-700">没有找到任何导航</p>
          </div>
        )}
      </div>
    </div>
  )
}

// 加载骨架屏组件
const LoadingSkeleton = () => (
  <div className="flex p-4">
    <aside className="w-20 shrink-0">
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted h-8 animate-pulse rounded" />
        ))}
      </div>
    </aside>
    <div className="mx-2 flex-1">
      <div className="mb-4 flex items-center justify-between">
        <div className="bg-muted h-8 w-32 animate-pulse rounded" />
        <div className="flex gap-2">
          <div className="bg-muted h-8 w-20 animate-pulse rounded" />
          <div className="bg-muted h-8 w-20 animate-pulse rounded" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted h-24 animate-pulse rounded" />
        ))}
      </div>
    </div>
  </div>
)

// 主页面组件
export default function NavPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <NavContent />
    </Suspense>
  )
}
