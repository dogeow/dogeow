"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, ArrowRight, Loader2 } from "lucide-react"
import { get } from "@/lib/api"
import { Badge } from "@/components/ui/badge"

interface Category {
  id: string
  name: string
  path: string
  icon?: React.ReactNode
}

interface SearchResult {
  id: number
  title: string
  content: string
  url: string
  category: string
  isPublic?: boolean
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSearchTerm?: string
  currentRoute?: string
}

// 简化的键盘检测
function useKeyboardStatus() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 只在移动设备上检测键盘
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      setKeyboardOpen(false);
      return;
    }

    const handleResize = () => {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const heightDiff = window.innerHeight - visualViewport.height;
        setKeyboardOpen(heightDiff > 150);
      } else {
        // 备用检测方法
        setKeyboardOpen(window.innerHeight < 500);
      }
    };
    
    handleResize();
    
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
      return () => {
        visualViewport.removeEventListener('resize', handleResize);
      };
    } else {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  return keyboardOpen;
}

export function SearchDialog({ open, onOpenChange, initialSearchTerm = "", currentRoute }: SearchDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [activeCategory, setActiveCategory] = useState("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardOpen = useKeyboardStatus();
  
  // 添加上次搜索参数的引用，用于避免重复搜索
  const lastSearchRef = useRef<{
    searchTerm: string;
    activeCategory: string;
  }>({
    searchTerm: '',
    activeCategory: 'all'
  })

  const categories: Category[] = useMemo(() => [
    { id: "all", name: "全部", path: "/search" },
    { id: "thing", name: "物品", path: "/thing" },
    { id: "lab", name: "实验室", path: "/lab" },
    { id: "note", name: "笔记", path: "/note" },
    { id: "file", name: "文件", path: "/file" },
    { id: "game", name: "游戏", path: "/game" },
    { id: "mc", name: "MC", path: "/mc" },
    { id: "nav", name: "导航", path: "/nav" },
  ], [])

  useEffect(() => {
    if (currentRoute) {
      const routeCategory = currentRoute.split('/')[1]
      const matchedCategory = categories.find(c => c.path.startsWith(`/${routeCategory}`))
      setActiveCategory(matchedCategory?.id || "all")
    } else {
      setActiveCategory("all")
    }
  }, [currentRoute, categories])

  const performSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setResults([])
      setHasSearched(false)
      lastSearchRef.current = {
        searchTerm: '',
        activeCategory
      }
      return
    }

    // 检查是否与上次搜索参数相同，避免重复搜索
    const currentSearchParams = {
      searchTerm: searchTerm.trim(),
      activeCategory
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
      setResults([])
      
      if (activeCategory === "all" || activeCategory === "thing") {
        interface SearchApiResponse {
          results: Array<{
            id: number;
            name: string;
            description?: string;
            is_public?: boolean;
            [key: string]: unknown;
          }>;
        }
        
        const queryParams = new URLSearchParams({
          q: searchTerm,
        })
        
        const response = await get<SearchApiResponse>(`/db-search?${queryParams}`)
        
        if (response.results?.length) {
          const thingResults = response.results.map((item) => ({
            id: item.id,
            title: item.name,
            content: item.description || '无描述',
            url: `/thing/${item.id}`,
            category: 'thing',
            isPublic: item.is_public
          }))
          
          setResults(prev => [...prev, ...thingResults])
        }
      }
      
      // TODO: Implement other category searches
      
    } catch (error) {
      console.error('搜索出错:', error)
    } finally {
      setLoading(false)
      setHasSearched(true) // 标记已完成搜索
    }
  }, [searchTerm, activeCategory])

  const handleSearch = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!searchTerm.trim()) return
    
    if (currentRoute && activeCategory !== "all") {
      const routeCategory = currentRoute.split('/')[1]
      const matchedCategory = categories.find(c => c.id === activeCategory)
      
      if (matchedCategory?.path.startsWith(`/${routeCategory}`)) {
        router.push(`${currentRoute}?search=${encodeURIComponent(searchTerm)}`)
        onOpenChange(false)
        return
      }
    }
    
    const currentApp = pathname.split('/')[1]
    const searchUrl = activeCategory === "all" 
      ? `/search?q=${encodeURIComponent(searchTerm)}`
      : currentApp === activeCategory
        ? `/${currentApp}?search=${encodeURIComponent(searchTerm)}`
        : categories.find(c => c.id === activeCategory)?.path + `?search=${encodeURIComponent(searchTerm)}`
    
    if (searchUrl) {
      router.push(searchUrl)
      onOpenChange(false)
    }
  }, [searchTerm, activeCategory, currentRoute, pathname, categories, router, onOpenChange])

  const handleResultClick = useCallback((url: string) => {
    router.push(url)
    onOpenChange(false)
  }, [router, onOpenChange])

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
          activeCategory
        }
      }
    }, 500)
    
    return () => clearTimeout(delaySearch)
  }, [searchTerm, activeCategory, performSearch])
  
  const filteredResults = useMemo(() => 
    results.filter(item => activeCategory === "all" || item.category === activeCategory),
    [results, activeCategory]
  )

  const getCountByCategory = useCallback((category: string) => {
    if (!searchTerm.trim()) return 0
    return results.filter(item => category === "all" || item.category === category).length
  }, [searchTerm, results])

  const getDialogTitle = useCallback(() => {
    if (currentRoute) {
      const routeCategory = currentRoute.split('/')[1]
      const matchedCategory = categories.find(c => c.path.startsWith(`/${routeCategory}`))
      if (matchedCategory) return `搜索${matchedCategory.name}`
    }
    
    const currentApp = pathname.split('/')[1]
    if (!currentApp) return "全站搜索"
    
    const category = categories.find(c => c.id === currentApp)
    return category ? `搜索${category.name}` : "搜索"
  }, [currentRoute, pathname, categories])

  const renderSearchResults = useCallback(() => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-8 min-h-[120px]">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">搜索中...</p>
        </div>
      )
    }
    
    if (searchTerm && filteredResults.length === 0 && hasSearched) {
      return (
        <div className="flex flex-col items-center justify-center py-8 min-h-[120px]">
          <p className="text-muted-foreground text-sm">未找到相关结果</p>
        </div>
      )
    }
    
    if (searchTerm) {
      return (
        <div className="space-y-2">
          {filteredResults.map((result) => (
            <div
              key={`${result.category}-${result.id}`}
              className="p-3 rounded-lg bg-card hover:bg-accent/50 cursor-pointer space-y-2 border border-border/50"
              onClick={() => handleResultClick(result.url)}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-sm leading-tight flex-1">{result.title}</h3>
                  <Badge variant="outline" className="text-xs whitespace-nowrap flex-shrink-0">
                    {categories.find(c => c.id === result.category)?.name || result.category}
                    {result.category === 'thing' && 'isPublic' in result && (
                      <span className="ml-1">{result.isPublic ? '(公开)' : '(私有)'}</span>
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{result.content}</p>
              </div>
            </div>
          ))}
        </div>
      )
    }
    
    return (
      <div className="flex flex-col items-center justify-center py-8 min-h-[120px]">
        <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-muted-foreground text-sm">请输入搜索关键词</p>
      </div>
    )
  }, [loading, searchTerm, filteredResults, categories, handleResultClick, hasSearched])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          max-w-[95vw] w-full sm:max-w-[550px] 
          ${keyboardOpen 
            ? 'fixed bottom-2 left-2 right-2 top-auto translate-x-0 translate-y-0 h-[50vh] max-h-[50vh]' 
            : 'max-h-[80vh] h-[70vh]'
          }
          p-0 gap-0
        `}
      >
        <div className="flex flex-col h-full p-4 sm:p-6">
          {/* 标题栏 */}
          <DialogHeader className="flex-shrink-0 mb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold flex-1 text-center">
                {getDialogTitle()}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-accent flex-shrink-0 ml-2"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          {/* 搜索输入框 */}
          <div className="flex-shrink-0 mb-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-20 h-10"
                autoFocus
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full hover:bg-accent"
                  onClick={() => {
                    setSearchTerm("");
                    setResults([]);
                    setHasSearched(false);
                    // 立即重新focus
                    requestAnimationFrame(() => {
                      inputRef.current?.focus();
                    });
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
          
          {/* 搜索范围 */}
          <div className="flex-shrink-0 mb-4">
            <div className="text-sm font-medium mb-2">搜索范围:</div>
            <div className="flex gap-1 flex-wrap max-h-16 overflow-y-auto">
              {categories.map((category) => (
                <Button 
                  key={category.id} 
                  size="sm" 
                  variant={activeCategory === category.id ? "secondary" : "outline"}
                  onClick={() => setActiveCategory(category.id)}
                  className="h-6 px-2 text-xs whitespace-nowrap"
                >
                  {category.name} {getCountByCategory(category.id) > 0 ? `(${getCountByCategory(category.id)})` : ''}
                </Button>
              ))}
            </div>
          </div>

          {/* 搜索结果 */}
          <div className="flex-1 overflow-hidden min-h-0">
            <div className="h-full overflow-y-auto">
              {renderSearchResults()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 