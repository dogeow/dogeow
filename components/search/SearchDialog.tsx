"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, X, ArrowRight } from "lucide-react"
import axios from "axios"

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
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSearchTerm?: string
}

export function SearchDialog({ open, onOpenChange, initialSearchTerm = "" }: SearchDialogProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [activeCategory, setActiveCategory] = useState("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 定义分类列表
  const categories: Category[] = [
    { id: "all", name: "全部", path: "/search" },
    { id: "things", name: "物品", path: "/things" },
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
      url: "/things/1",
      category: "things"
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
      // 调用后端 API 进行搜索
      if (activeCategory === "things" || activeCategory === "all") {
        // 使用测试搜索路由
        console.log(`正在搜索: ${searchTerm}`)
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/test-search`, {
          params: { search: searchTerm }
        })
        
        console.log('搜索结果:', response.data)
        
        if (response.data.results && Array.isArray(response.data.results)) {
          const thingResults = response.data.results.map((item: any) => ({
            id: item.id,
            title: item.name,
            content: item.description || '无描述',
            url: `/things/${item.id}`,
            category: 'things'
          }))
          
          setResults(prevResults => {
            // 如果是 "all" 分类，保留其他分类的结果，只更新 things 分类
            if (activeCategory === "all") {
              const otherResults = prevResults.filter(item => item.category !== 'things')
              return [...otherResults, ...thingResults]
            }
            return thingResults
          })
        }
      }
      
      // 这里可以添加其他分类的搜索逻辑
      // 例如搜索笔记、实验室等
      
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
    
    // 根据当前选中的分类决定搜索行为
    if (activeCategory === "all") {
      // 全局搜索
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    } else {
      // 分类内搜索
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
      performSearch()
    }, 300)
    
    return () => clearTimeout(delaySearch)
  }, [searchTerm, activeCategory])

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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">搜索</DialogTitle>
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
                onClick={() => setSearchTerm("")}
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

        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory} className="mt-4">
          <TabsList className="grid grid-cols-4 sm:grid-cols-8">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                {category.name}
                {getCountByCategory(category.id) > 0 && (
                  <span className="ml-1 text-xs">({getCountByCategory(category.id)})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            {loading ? (
              <div className="text-center py-4">加载中...</div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-2">
                {filteredResults.map((result) => (
                  <div 
                    key={result.id} 
                    className="p-3 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleResultClick(result.url)}
                  >
                    <div className="font-medium">{result.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">{result.content}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      分类: {result.category === "things" ? "物品" : 
                             result.category === "lab" ? "实验室" : 
                             result.category === "note" ? "笔记" : result.category}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-4 text-muted-foreground">
                没有找到与 "{searchTerm}" 相关的结果
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                请输入搜索关键词
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 