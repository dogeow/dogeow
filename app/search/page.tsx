"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { apiRequest } from '@/utils/api'

// 定义搜索结果类型
interface SearchResult {
  id: number
  title: string
  content: string
  url: string
  category: string
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [searchTerm, setSearchTerm] = useState(query)
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // 执行搜索
  const performSearch = async () => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    
    try {
      // 使用直接数据库查询路由
      console.log(`正在搜索: ${searchTerm}`)
      const data = await apiRequest<{results: any[]}>(`/db-search?q=${encodeURIComponent(searchTerm)}`)
      
      console.log('搜索结果:', data)
      
      if (data.results && Array.isArray(data.results)) {
        const thingResults = data.results.map((item: any) => ({
          id: item.id,
          title: item.name,
          content: item.description || '无描述',
          url: `/thing/${item.id}`,
          category: 'thing'
        }))
        
        setResults(thingResults)
      }
      
      // 这里可以添加其他分类的搜索逻辑
      
    } catch (error) {
      console.error('搜索出错:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理搜索表单提交
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // 更新URL参数但不刷新页面
    const url = new URL(window.location.href)
    url.searchParams.set("q", searchTerm)
    window.history.pushState({}, "", url.toString())
    performSearch()
  }

  // 初始加载和查询参数变化时执行搜索
  useEffect(() => {
    setSearchTerm(query)
    if (query) {
      performSearch()
    }
  }, [query])

  // 获取特定分类的结果数量
  const getCountByCategory = (category: string) => {
    return results.filter(item => category === "all" || item.category === category).length
  }

  // 根据当前选中的分类过滤结果
  const filteredResults = results.filter(
    item => activeTab === "all" || item.category === activeTab
  )

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">搜索结果</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">搜索</Button>
        </form>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">
            全部 ({getCountByCategory("all")})
          </TabsTrigger>
          <TabsTrigger value="thing">
            物品 ({getCountByCategory("thing")})
          </TabsTrigger>
          <TabsTrigger value="lab">
            实验室 ({getCountByCategory("lab")})
          </TabsTrigger>
          <TabsTrigger value="note">
            笔记 ({getCountByCategory("note")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredResults.length > 0 ? (
            <div className="grid gap-4">
              {filteredResults.map((result) => (
                <Card key={result.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>
                      <a href={result.url} className="hover:underline">
                        {result.title}
                      </a>
                    </CardTitle>
                    <CardDescription>
                      分类: {result.category === "things" ? "物品" : 
                             result.category === "lab" ? "实验室" : 
                             result.category === "note" ? "笔记" : result.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{result.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              {query ? `没有找到与 "${query}" 相关的结果` : "请输入搜索关键词"}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 