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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, X, ArrowRight, Loader2 } from "lucide-react"
import { get } from "@/utils/api"
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
}

export function SearchDialog({ open, onOpenChange, initialSearchTerm = "" }: SearchDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [activeCategory, setActiveCategory] = useState("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [randomLoading, setRandomLoading] = useState(false)
  const [thingPublicStatus, setThingPublicStatus] = useState<'all' | 'public' | 'private'>('all')
  const [randomItems, setRandomItems] = useState<SearchResult[]>([])
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

  // 模拟搜索结果
  const mockResults: SearchResult[] = [
    {
      id: 1,
      title: "示例物品",
      content: "这是一个示例物品的描述内容",
      url: "/thing/1",
      category: "thing"
    },
    {
      id: 2,
      title: "实验室项目",
      content: "这是一个实验室项目的描述内容",
      url: "/lab/project1",
      category: "lab"
    },
    {
      id: 3,
      title: "笔记示例",
      content: "这是一个笔记的内容示例",
      url: "/note/1",
      category: "note"
    }
  ]

  // 执行搜索
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    
    try {
      // 获取当前URL路径，判断用户所在的应用
      const currentPath = pathname
      const currentApp = currentPath.split('/')[1]
      
      // 清除之前的搜索结果
      setResults([])
      
      // 根据激活的分类执行对应的搜索
      // 如果是全部分类或当前分类是thing，则搜索物品
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
        
        // 添加公开/私有筛选
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
      
      // 实验室搜索
      if (activeCategory === "all" || activeCategory === "lab") {
        // 这里实现实验室搜索
        // TODO: 添加实验室搜索API调用
      }
      
      // 笔记搜索
      if (activeCategory === "all" || activeCategory === "note") {
        // 这里实现笔记搜索
        // TODO: 添加笔记搜索API调用
      }
      
      // 文件搜索
      if (activeCategory === "all" || activeCategory === "file") {
        // 这里实现文件搜索
        // TODO: 添加文件搜索API调用
      }
      
      // 游戏搜索
      if (activeCategory === "all" || activeCategory === "game") {
        // 这里实现游戏搜索
        // TODO: 添加游戏搜索API调用
      }
      
      // 其他分类搜索...
      
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
    
    // 获取当前URL路径，判断用户所在的应用
    const currentPath = pathname
    // 提取主路径部分（例如/thing/123 -> thing）
    const currentApp = currentPath.split('/')[1]
    
    // 判断决策逻辑：
    // 1. 如果用户在首页，且选择了全部，则进行全局搜索
    // 2. 如果用户在应用内，且选择了当前应用的分类，则在应用内搜索
    // 3. 如果用户在应用内，但选择了其他应用的分类，则转到相应应用搜索
    // 4. 如果用户在应用内，但选择了全部，则进行全局搜索
    
    if (activeCategory === "all") {
      // 全局搜索
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    } else if (currentApp && currentApp === activeCategory) {
      // 当前应用内搜索
      router.push(`/${currentApp}?search=${encodeURIComponent(searchTerm)}`)
    } else {
      // 其他应用搜索
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
        performSearch()
      }
    }, 300)
    
    return () => clearTimeout(delaySearch)
  }, [searchTerm, activeCategory, thingPublicStatus])
  
  // 加载随机物品
  useEffect(() => {
    if (open) {
      loadRandomItems()
    }
  }, [open, thingPublicStatus])
  
  // 获取随机物品
  const loadRandomItems = async () => {
    try {
      setRandomLoading(true)
      
      // 构建查询参数
      let queryParams = 'random=true&limit=5';
      
      // 添加公开/私有筛选
      if (thingPublicStatus !== 'all') {
        queryParams += `&is_public=${thingPublicStatus === 'public' ? 'true' : 'false'}`;
      }
      
      interface RandomItemsResponse {
        data: Array<{
          id: number;
          name: string;
          description?: string;
          is_public?: boolean;
          [key: string]: any;
        }>;
      }
      
      const response = await get<RandomItemsResponse>(`/things?${queryParams}`)
      
      if (response.data && Array.isArray(response.data)) {
        const randomItemResults = response.data.map((item) => ({
          id: item.id,
          title: item.name,
          content: item.description || '无描述',
          url: `/thing/${item.id}`,
          category: 'thing',
          isPublic: item.is_public
        }))
        
        setRandomItems(randomItemResults)
      }
    } catch (error) {
      console.error('获取随机物品失败:', error)
    } finally {
      setRandomLoading(false)
    }
  }

  // 根据当前选中的分类过滤结果
  const filteredResults = results.filter(
    item => activeCategory === "all" || item.category === activeCategory
  )

  // 获取特定分类的结果数量
  const getCountByCategory = (category: string) => {
    return results.filter(item => category === "all" || item.category === category).length
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90%] md:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {(() => {
              // 获取当前路径
              const currentPath = pathname
              const currentApp = currentPath.split('/')[1]
              
              // 如果当前在应用内
              if (currentApp && categories.some(c => c.id === currentApp)) {
                const categoryName = categories.find(c => c.id === currentApp)?.name
                
                // 更加简洁的标题
                return `搜索${activeCategory === "all" ? "所有内容" : categories.find(c => c.id === activeCategory)?.name || ""}`
              }
              
              // 默认标题
              return activeCategory === "all" ? "搜索所有内容" : `搜索${categories.find(c => c.id === activeCategory)?.name}内容`
            })()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
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
                className="absolute right-10 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={() => {
                  setSearchTerm("")
                  loadRandomItems()
                }}
              >
                <X className="h-4 w-4" />
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
        
        <div className="flex gap-2 flex-wrap mt-4">
          <div className="flex items-center gap-2 mr-4">
            <label htmlFor="category-select" className="text-sm font-medium">
              搜索范围:
            </label>
            <select
              id="category-select"
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} {getCountByCategory(category.id) > 0 ? `(${getCountByCategory(category.id)})` : ''}
                </option>
              ))}
            </select>
          </div>
          
          {/* 物品筛选选项 - 仅当选择了"物品"分类或"全部"分类时显示，或当前在物品页面 */}
          {(activeCategory === "thing" || activeCategory === "all" || pathname.startsWith('/thing')) && (
            <div className="flex items-center flex-wrap gap-1">
              <span className="text-sm font-medium">物品筛选:</span>
              <Button 
                size="sm" 
                variant={thingPublicStatus === 'all' ? "secondary" : "outline"}
                onClick={() => {
                  setThingPublicStatus('all')
                  if (searchTerm.trim()) {
                    performSearch()
                  } else {
                    loadRandomItems()
                  }
                }}
                className="h-7 px-2 text-xs"
              >
                全部
              </Button>
              <Button 
                size="sm" 
                variant={thingPublicStatus === 'public' ? "secondary" : "outline"}
                onClick={() => {
                  setThingPublicStatus('public')
                  if (searchTerm.trim()) {
                    performSearch()
                  } else {
                    loadRandomItems()
                  }
                }}
                className="h-7 px-2 text-xs"
              >
                公开
              </Button>
              <Button 
                size="sm" 
                variant={thingPublicStatus === 'private' ? "secondary" : "outline"}
                onClick={() => {
                  setThingPublicStatus('private')
                  if (searchTerm.trim()) {
                    performSearch()
                  } else {
                    loadRandomItems()
                  }
                }}
                className="h-7 px-2 text-xs"
              >
                私密
              </Button>
            </div>
          )}
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">搜索中...</p>
            </div>
          ) : searchTerm && filteredResults.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">未找到相关结果</p>
            </div>
          ) : searchTerm ? (
            filteredResults.map((result) => (
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
          ) : randomLoading ? (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">加载推荐中...</p>
            </div>
          ) : randomItems.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">随机推荐物品：</p>
                {randomItems.map((item) => (
                  <div
                    key={`random-${item.id}`}
                    className="p-3 mb-2 rounded-lg bg-card hover:bg-accent/50 cursor-pointer space-y-1"
                    onClick={() => handleResultClick(item.url)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <Badge variant="outline" className="text-xs whitespace-normal sm:whitespace-nowrap w-fit">
                        {item.isPublic ? '公开' : '私有'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">请输入搜索关键词</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 