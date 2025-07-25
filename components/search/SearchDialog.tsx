'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Loader2, Lock, Unlock } from 'lucide-react'
import { get } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { configs } from '@/app/configs'
import useAuthStore from '@/stores/authStore'

interface Category {
  id: string
  name: string
  path: string
  icon?: React.ReactNode
  requireAuth?: boolean // 是否需要认证
}

interface SearchResult {
  id: number | string
  title: string
  content: string
  url: string
  category: string
  isPublic?: boolean
  requireAuth?: boolean // 是否需要认证才能访问
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSearchTerm?: string
  currentRoute?: string
}

// 简化的键盘检测
function useKeyboardStatus() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 只在移动设备上检测键盘
    const isMobile =
      window.innerWidth <= 768 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (!isMobile) {
      setKeyboardOpen(false)
      return
    }

    const handleResize = () => {
      const visualViewport = window.visualViewport
      if (visualViewport) {
        const heightDiff = window.innerHeight - visualViewport.height
        setKeyboardOpen(heightDiff > 150)
      } else {
        // 备用检测方法
        setKeyboardOpen(window.innerHeight < 500)
      }
    }

    handleResize()

    const visualViewport = window.visualViewport
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize)
      return () => {
        visualViewport.removeEventListener('resize', handleResize)
      }
    } else {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return keyboardOpen
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
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardOpen = useKeyboardStatus()

  // 添加上次搜索参数的引用，用于避免重复搜索
  const lastSearchRef = useRef<{
    searchTerm: string
    activeCategory: string
  }>({
    searchTerm: '',
    activeCategory: 'all',
  })

  // 根据认证状态过滤搜索类别
  const categories: Category[] = useMemo(() => {
    const allCategories: Category[] = [
      { id: 'all', name: '全部', path: '/search' },
      { id: 'thing', name: '物品', path: '/thing', requireAuth: false }, // 物品有公开的，不需要认证
      { id: 'lab', name: '实验室', path: '/lab', requireAuth: false },
      { id: 'note', name: '笔记', path: '/note', requireAuth: true }, // 笔记需要认证
      { id: 'file', name: '文件', path: '/file', requireAuth: true }, // 文件需要认证
      { id: 'game', name: '游戏', path: '/game', requireAuth: false }, // 游戏不需要认证
      { id: 'tool', name: '工具', path: '/tool', requireAuth: false },
      { id: 'nav', name: '导航', path: '/nav', requireAuth: true }, // 导航需要认证
    ]

    // 如果用户未认证，过滤掉需要认证的类别
    if (!isAuthenticated) {
      return allCategories.filter(category => !category.requireAuth)
    }

    return allCategories
  }, [isAuthenticated])

  useEffect(() => {
    if (currentRoute) {
      const routeCategory = currentRoute.split('/')[1]
      const matchedCategory = categories.find(c => c.path.startsWith(`/${routeCategory}`))
      setActiveCategory(matchedCategory?.id || 'all')
    } else {
      setActiveCategory('all')
    }
  }, [currentRoute, categories])

  // 本地搜索函数
  const searchLocalData = useCallback(
    (searchTerm: string, category: string) => {
      const results: SearchResult[] = []
      const lowerSearchTerm = searchTerm.toLowerCase()

      // 搜索游戏（游戏对所有用户开放）
      if (category === 'all' || category === 'game') {
        const gameResults = configs.games
          .filter(
            game =>
              game.name.toLowerCase().includes(lowerSearchTerm) ||
              game.description.toLowerCase().includes(lowerSearchTerm) ||
              game.id.toLowerCase().includes(lowerSearchTerm)
          )
          .map(game => ({
            id: game.id,
            title: game.name,
            content: game.description,
            url: `/game/${game.id}`,
            category: 'game',
            requireAuth: false,
          }))
        results.push(...gameResults)
      }

      // 只有认证用户才能搜索以下内容
      if (isAuthenticated) {
        // 搜索导航
        if (category === 'all' || category === 'nav') {
          const navResults = configs.navigation
            .filter(
              nav =>
                nav.name.toLowerCase().includes(lowerSearchTerm) ||
                nav.description.toLowerCase().includes(lowerSearchTerm)
            )
            .map(nav => ({
              id: nav.id,
              title: nav.name,
              content: nav.description,
              url: nav.url,
              category: 'nav',
              requireAuth: true,
            }))
          results.push(...navResults)
        }

        // 搜索笔记
        if (category === 'all' || category === 'note') {
          const noteResults = configs.notes
            .filter(
              note =>
                note.name.toLowerCase().includes(lowerSearchTerm) ||
                note.description.toLowerCase().includes(lowerSearchTerm)
            )
            .map(note => ({
              id: note.id,
              title: note.name,
              content: note.description,
              url: note.url,
              category: 'note',
              requireAuth: true,
            }))
          results.push(...noteResults)
        }

        // 搜索文件
        if (category === 'all' || category === 'file') {
          const fileResults = configs.files
            .filter(
              file =>
                file.name.toLowerCase().includes(lowerSearchTerm) ||
                file.description.toLowerCase().includes(lowerSearchTerm)
            )
            .map(file => ({
              id: file.id,
              title: file.name,
              content: file.description,
              url: file.url,
              category: 'file',
              requireAuth: true,
            }))
          results.push(...fileResults)
        }

        // 搜索实验室
        if (category === 'all' || category === 'lab') {
          const labResults = configs.lab
            .filter(
              lab =>
                lab.name.toLowerCase().includes(lowerSearchTerm) ||
                lab.description.toLowerCase().includes(lowerSearchTerm)
            )
            .map(lab => ({
              id: lab.id,
              title: lab.name,
              content: lab.description,
              url: lab.url,
              category: 'lab',
              requireAuth: false,
            }))
          results.push(...labResults)
        }
      }

      return results
    },
    [isAuthenticated]
  )

  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setResults([])
      setHasSearched(false)
      lastSearchRef.current = {
        searchTerm: '',
        activeCategory,
      }
      return
    }

    // 检查是否与上次搜索参数相同，避免重复搜索
    const currentSearchParams = {
      searchTerm: searchTerm.trim(),
      activeCategory,
    }

    if (
      lastSearchRef.current.searchTerm === currentSearchParams.searchTerm &&
      lastSearchRef.current.activeCategory === currentSearchParams.activeCategory
    ) {
      console.log('搜索参数未变化，跳过重复搜索')
      return
    }

    // 更新上次搜索参数
    lastSearchRef.current = currentSearchParams

    setLoading(true)

    try {
      const allResults: SearchResult[] = []

      // 搜索本地数据（游戏、导航等）
      const localResults = searchLocalData(searchTerm, activeCategory)
      allResults.push(...localResults)

      // 搜索数据库中的物品（后端已经处理了权限控制）
      if (activeCategory === 'all' || activeCategory === 'thing') {
        interface SearchApiResponse {
          results: Array<{
            id: number
            name: string
            description?: string
            is_public?: boolean
            user_id?: number
            [key: string]: unknown
          }>
          user_authenticated: boolean
        }

        const queryParams = new URLSearchParams({
          q: searchTerm,
        })

        try {
          const response = await get<SearchApiResponse>(`/things/search?${queryParams}`)

          if (response.results?.length) {
            const thingResults = response.results.map(item => ({
              id: item.id,
              title: item.name,
              content: item.description || '无描述',
              url: `/thing/${item.id}`,
              category: 'thing',
              isPublic: item.is_public,
              requireAuth: false, // 物品搜索不需要认证（后端已处理权限）
            }))

            allResults.push(...thingResults)
          }
        } catch (error) {
          console.error('物品搜索失败:', error)
          // 如果是认证错误，不显示错误信息，只是不返回结果
        }
      }

      setResults(allResults)
    } catch (error) {
      console.error('搜索出错:', error)
    } finally {
      setLoading(false)
      setHasSearched(true) // 标记已完成搜索
    }
  }, [searchTerm, activeCategory, searchLocalData])

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

  const handleResultClick = useCallback(
    (url: string) => {
      router.push(url)
      onOpenChange(false)
    },
    [router, onOpenChange]
  )

  // 简化的focus逻辑
  useEffect(() => {
    if (open) {
      // 延迟focus，确保DOM已渲染
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch()
      } else {
        setResults([])
        setHasSearched(false)
        lastSearchRef.current = {
          searchTerm: '',
          activeCategory,
        }
      }
    }, 500)

    return () => clearTimeout(delaySearch)
  }, [searchTerm, activeCategory, performSearch])

  const filteredResults = useMemo(
    () => results.filter(item => activeCategory === 'all' || item.category === activeCategory),
    [results, activeCategory]
  )

  const getCountByCategory = useCallback(
    (category: string) => {
      if (!searchTerm.trim()) return 0
      return results.filter(item => category === 'all' || item.category === category).length
    },
    [searchTerm, results]
  )

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

  const renderSearchResults = useCallback(() => {
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
            <div
              key={`${result.category}-${result.id}`}
              className="bg-card hover:bg-accent/50 border-border/50 cursor-pointer space-y-2 rounded-lg border p-3"
              onClick={() => handleResultClick(result.url)}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="flex-1 text-sm leading-tight font-medium">{result.title}</h3>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="flex-shrink-0 text-xs whitespace-nowrap">
                      {categories.find(c => c.id === result.category)?.name || result.category}
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
                  {result.content}
                </p>
              </div>
            </div>
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
  }, [
    loading,
    searchTerm,
    filteredResults,
    categories,
    handleResultClick,
    hasSearched,
    isAuthenticated,
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-[95vw] sm:max-w-[550px] ${
          keyboardOpen
            ? 'fixed top-auto right-2 bottom-2 left-2 h-[50vh] max-h-[50vh] translate-x-0 translate-y-0'
            : 'h-[70vh] max-h-[80vh]'
        } gap-0 p-0`}
      >
        <div className="flex h-full flex-col p-4 sm:p-6">
          {/* 标题栏 */}
          <DialogHeader className="mb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex-1 text-center text-lg font-semibold">
                {getDialogTitle()}
              </DialogTitle>
            </div>
          </DialogHeader>

          {/* 搜索输入框 */}
          <div className="mb-4 flex-shrink-0">
            <form onSubmit={handleSearch} className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="搜索..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`h-10 pl-10 ${searchTerm ? 'pr-10' : 'pr-3'}`}
                autoFocus
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 transform"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>
          </div>

          {/* 搜索范围 */}
          <div className="mb-4 flex-shrink-0">
            <div className="mb-2 text-sm font-medium">搜索范围:</div>
            <div className="flex max-h-16 flex-wrap gap-1 overflow-y-auto">
              {categories.map(category => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={activeCategory === category.id ? 'secondary' : 'outline'}
                  onClick={() => setActiveCategory(category.id)}
                  className="h-6 px-2 text-xs whitespace-nowrap"
                >
                  {category.name}{' '}
                  {getCountByCategory(category.id) > 0
                    ? `(${getCountByCategory(category.id)})`
                    : ''}
                </Button>
              ))}
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">{renderSearchResults()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
