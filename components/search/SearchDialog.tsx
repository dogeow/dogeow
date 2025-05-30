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

function useKeyboardStatus() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window === 'undefined') return;
      if (window.visualViewport) {
        const { height } = window.visualViewport;
        setKeyboardOpen(height < window.innerHeight - 100);
      } else {
        setKeyboardOpen(window.innerHeight < 500);
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
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
  const [thingPublicStatus, setThingPublicStatus] = useState<'all' | 'public' | 'private'>('all')
  const inputRef = useRef<HTMLInputElement>(null)
  const keyboardOpen = useKeyboardStatus();

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
      return
    }

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
            [key: string]: any;
          }>;
        }
        
        const queryParams = new URLSearchParams({
          q: searchTerm,
          ...(thingPublicStatus !== 'all' && { is_public: thingPublicStatus === 'public' ? 'true' : 'false' })
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
    }
  }, [searchTerm, activeCategory, thingPublicStatus])

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

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch()
      } else {
        setResults([])
      }
    }, 300)
    
    return () => clearTimeout(delaySearch)
  }, [searchTerm, activeCategory, thingPublicStatus, performSearch])
  
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
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">搜索中...</p>
        </div>
      )
    }
    
    if (searchTerm && filteredResults.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">未找到相关结果</p>
        </div>
      )
    }
    
    if (searchTerm) {
      return filteredResults.map((result) => (
        <div
          key={`${result.category}-${result.id}`}
          className="p-3 mb-2 rounded-lg bg-card hover:bg-accent/50 cursor-pointer space-y-1"
          onClick={() => handleResultClick(result.url)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="font-semibold truncate">{result.title}</h3>
            <Badge variant="outline" className="text-xs whitespace-normal sm:whitespace-nowrap w-fit">
              {categories.find(c => c.id === result.category)?.name || result.category}
              {result.category === 'thing' && 'isPublic' in result && (
                <span className="ml-1">{result.isPublic ? '(公开)' : '(私有)'}</span>
              )}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{result.content}</p>
        </div>
      ))
    }
    
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">请输入搜索关键词</p>
      </div>
    )
  }, [loading, searchTerm, filteredResults, categories, handleResultClick])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`md:max-w-[550px] max-h-[90vh] max-w-[90%] overflow-y-auto p-6 transition-all duration-300
          ${keyboardOpen ? 'fixed bottom-0 left-0 right-0 top-auto h-[45vh] max-h-[50vh] rounded-t-xl' : 'top-1/2 -translate-y-1/2 h-[60vh] rounded-xl'}
        `}
        style={keyboardOpen ? { margin: 0, borderRadius: '1.2rem 1.2rem 0 0' } : {}}
      >
        <DialogHeader>
          <DialogTitle className="text-center">{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 px-1">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-10 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
                data-clear-button="true"
                onClick={(e) => {
                  // 阻止事件冒泡，防止关闭对话框
                  e.stopPropagation();
                  e.preventDefault();
                  
                  // 保证不关闭对话框
                  const dialog = e.currentTarget.closest('div[role="dialog"]');
                  if (dialog) {
                    // 确保任何对话框事件都不会被触发
                    e.nativeEvent.stopImmediatePropagation();
                  }
                  
                  setSearchTerm("");
                  setResults([]);
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 10);
                }}
              >
                <X className="h-3.5 w-3.5 text-slate-500" />
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
        
        <div className="mt-4 px-1">
          <div className="text-sm font-medium mb-2">搜索范围:</div>
          <div className="flex gap-1 flex-wrap">
            {categories.map((category) => (
              <Button 
                key={category.id} 
                size="sm" 
                variant={activeCategory === category.id ? "secondary" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                className="h-7 px-2 text-xs"
              >
                {category.name} {getCountByCategory(category.id) > 0 ? `(${getCountByCategory(category.id)})` : ''}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 px-1">
          {renderSearchResults()}
        </div>
      </DialogContent>
    </Dialog>
  )
} 