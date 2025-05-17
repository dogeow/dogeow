"use client"

import { useState, useEffect, useRef } from "react"
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

// 定义分类类型
interface Category {
  id: string
  name: string
  path: string
  icon?: React.ReactNode
}

// 定义搜索结果类型
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

export function SearchDialog({ open, onOpenChange, initialSearchTerm = "", currentRoute }: SearchDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [activeCategory, setActiveCategory] = useState("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [thingPublicStatus, setThingPublicStatus] = useState<'all' | 'public' | 'private'>('all')
  const inputRef = useRef<HTMLInputElement>(null)

  // 定义分类列表
  const categories: Category[] = [
    { id: "all", name: "全部", path: "/search" },
    { id: "thing", name: "物品", path: "/thing" },
    { id: "lab", name: "实验室", path: "/lab" },
    { id: "note", name: "笔记", path: "/note" },
    { id: "file", name: "文件", path: "/file" },
    { id: "game", name: "游戏", path: "/game" },
    { id: "mc", name: "MC", path: "/mc" },
    { id: "nav", name: "导航", path: "/nav" },
  ]

  // 设置初始活动分类基于当前路由
  useEffect(() => {
    if (currentRoute) {
      // 从路由中获取分类
      const routeCategory = currentRoute.split('/')[1]
      const matchedCategory = categories.find(c => c.path.startsWith(`/${routeCategory}`))
      
      if (matchedCategory) {
        setActiveCategory(matchedCategory.id)
      } else {
        // 如果没有匹配的分类，默认选择"全部"
        setActiveCategory("all")
      }
    } else {
      // 如果没有当前路由，默认选择"全部"
      setActiveCategory("all")
    }
  }, [currentRoute])

  // 执行搜索
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    
    try {
      // 清除之前的搜索结果
      setResults([])
      
      // 根据激活的分类执行对应的搜索
      if (activeCategory === "all" || activeCategory === "thing") {
        // 搜索物品
        interface SearchApiResponse {
          results: Array<{
            id: number;
            name: string;
            description?: string;
            is_public?: boolean;
            [key: string]: any;
          }>;
        }
        
        // 构建查询参数
        let queryParams = `q=${encodeURIComponent(searchTerm)}`;
        
        if (thingPublicStatus !== 'all') {
          queryParams += `&is_public=${thingPublicStatus === 'public' ? 'true' : 'false'}`;
        }
        
        const response = await get<SearchApiResponse>(`/db-search?${queryParams}`)
        
        if (response.results && Array.isArray(response.results)) {
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
      
      // 其他分类搜索逻辑
      if (activeCategory === "all" || activeCategory === "lab") {
        // TODO: 添加实验室搜索API调用
      }
      
      if (activeCategory === "all" || activeCategory === "note") {
        // TODO: 添加笔记搜索API调用
      }
      
      if (activeCategory === "all" || activeCategory === "file") {
        // TODO: 添加文件搜索API调用
      }
      
      if (activeCategory === "all" || activeCategory === "game") {
        // TODO: 添加游戏搜索API调用
      }
      
    } catch (error) {
      console.error('搜索出错:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索表单提交
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!searchTerm.trim()) return
    
    // 如果提供了当前路由，且与活动分类匹配，则使用该路由搜索
    if (currentRoute && activeCategory !== "all") {
      const routeCategory = currentRoute.split('/')[1]
      const matchedCategory = categories.find(c => c.id === activeCategory)
      
      if (matchedCategory && matchedCategory.path.startsWith(`/${routeCategory}`)) {
        router.push(`${currentRoute}?search=${encodeURIComponent(searchTerm)}`)
        onOpenChange(false)
        return
      }
    }
    
    // 默认搜索行为
    const currentApp = pathname.split('/')[1]
    
    if (activeCategory === "all") {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    } else if (currentApp && currentApp === activeCategory) {
      router.push(`/${currentApp}?search=${encodeURIComponent(searchTerm)}`)
    } else {
      const category = categories.find(c => c.id === activeCategory)
      if (category) {
        router.push(`${category.path}?search=${encodeURIComponent(searchTerm)}`)
      }
    }
    
    onOpenChange(false)
  }

  // 处理结果项点击
  const handleResultClick = (url: string) => {
    router.push(url)
    onOpenChange(false)
  }

  // 当弹窗打开时聚焦到搜索框
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // 当搜索词变化时执行搜索
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm, activeCategory, thingPublicStatus]);
  
  // 根据当前选中的分类过滤结果
  const filteredResults = results.filter(
    item => activeCategory === "all" || item.category === activeCategory
  )

  // 获取特定分类的结果数量
  const getCountByCategory = (category: string) => {
    if (!searchTerm.trim()) return 0;
    return results.filter(item => category === "all" || item.category === category).length;
  }

  // 获取对话框标题
  const getDialogTitle = () => {
    // 如果提供了当前路由，则使用该路由的分类作为标题
    if (currentRoute) {
      const routeCategory = currentRoute.split('/')[1]
      const matchedCategory = categories.find(c => c.path.startsWith(`/${routeCategory}`))
      
      if (matchedCategory) {
        return `搜索${matchedCategory.name}`
      }
    }
    
    // 默认标题逻辑
    const currentApp = pathname.split('/')[1]
    
    if (!currentApp) {
      return "全站搜索"
    }
    
    const category = categories.find(c => c.id === currentApp)
    return category ? `搜索${category.name}` : "搜索"
  }

  // 渲染搜索结果
  const renderSearchResults = () => {
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[90%] md:max-w-[550px] max-h-[90vh] overflow-y-auto p-6"
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