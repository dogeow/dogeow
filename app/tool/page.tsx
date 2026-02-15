'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
import { tools } from './tools'
import { useRouter, usePathname } from 'next/navigation'
import { PageContainer } from '@/components/layout'

// 搜索结果缓存
const searchCache = new Map<string, typeof tools>()

// 提取搜索逻辑到独立 hook
const useToolSearch = () => {
  const [filteredTools, setFilteredTools] = useState(tools)

  const searchTools = useCallback((searchTerm: string) => {
    // 检查缓存
    if (searchCache.has(searchTerm)) {
      return searchCache.get(searchTerm)!
    }

    const results = searchTerm
      ? tools.filter(
          tool =>
            tool.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tool.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : tools

    // 缓存结果
    if (searchCache.size > 100) {
      searchCache.clear()
    }
    searchCache.set(searchTerm, results)

    return results
  }, [])

  // 监听搜索事件
  useEffect(() => {
    const handleToolSearch = (event: CustomEvent) => {
      const { searchTerm } = event.detail
      const results = searchTools(searchTerm)
      setFilteredTools(results)
    }

    document.addEventListener('tool-search', handleToolSearch as EventListener)
    return () => {
      document.removeEventListener('tool-search', handleToolSearch as EventListener)
    }
  }, [searchTools])

  return { filteredTools, searchTools }
}

// 工具选择状态管理 hook
const useToolSelection = (initialToolId: string = 'time-converter') => {
  const [activeTab, setActiveTab] = useState(initialToolId)
  const router = useRouter()
  const pathname = usePathname()
  const isInternalChange = useRef(false)

  const handleToolSelect = useCallback(
    (toolId: string) => {
      const tool = tools.find(t => t.id === toolId)
      if (tool?.route) {
        isInternalChange.current = true
        router.push(tool.route)
      } else {
        setActiveTab(toolId)
      }
    },
    [router]
  )

  // 使用 usePathname 检测路由变化
  useEffect(() => {
    // 当路由变化时，检查是否是内部变化
    if (isInternalChange.current) {
      isInternalChange.current = false
    }
  }, [pathname])

  return { activeTab, setActiveTab, handleToolSelect }
}

// 分类管理 hook
const useToolCategories = (
  filteredTools: typeof tools,
  activeTool: (typeof tools)[0] | undefined
) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)

  const groupedTools = useMemo(() => {
    return filteredTools.reduce<Record<string, typeof filteredTools>>((acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = []
      acc[tool.category].push(tool)
      return acc
    }, {})
  }, [filteredTools])

  const categories = useMemo(() => Object.keys(groupedTools), [groupedTools])

  const resolvedCategory = useMemo(() => {
    if (categories.length === 0) return ''
    const activeCategory = activeTool?.category
    if (activeCategory && categories.includes(activeCategory)) {
      return activeCategory
    }
    if (selectedCategory && categories.includes(selectedCategory)) {
      return selectedCategory
    }
    return categories[0]
  }, [activeTool, categories, selectedCategory])

  return {
    groupedTools,
    categories,
    resolvedCategory,
    selectedCategory,
    setSelectedCategory,
    isExpanded,
    setIsExpanded,
  }
}

export default function ToolPage() {
  const { filteredTools } = useToolSearch()
  const { activeTab, setActiveTab, handleToolSelect } = useToolSelection()

  // 根据 ID 获取当前活动工具
  const activeTool = useMemo(() => tools.find(tool => tool.id === activeTab), [activeTab])

  const {
    groupedTools,
    categories,
    resolvedCategory,
    selectedCategory,
    setSelectedCategory,
    isExpanded,
    setIsExpanded,
  } = useToolCategories(filteredTools, activeTool)

  // 当搜索结果变化时自动切换到第一个结果
  useEffect(() => {
    if (filteredTools.length > 0 && !filteredTools.some(tool => tool.id === activeTab)) {
      setActiveTab(filteredTools[0].id)
    }
  }, [filteredTools, activeTab, setActiveTab])

  // 动态渲染组件
  const ActiveComponent = activeTool?.component

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 工具内容区 */}
        <div>
          {activeTool && ActiveComponent ? (
            <div className="space-y-6">
              {/* 工具标题区域 */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/40 flex items-center rounded-md border p-1.5 text-xs transition-colors"
                    onClick={() => setIsExpanded(prev => !prev)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? '收起工具选择' : '展开工具选择'}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <h1 className="text-2xl font-bold tracking-tight">{activeTool.title}</h1>
                </div>
                <p className="text-muted-foreground">{activeTool.description}</p>
                {isExpanded && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="space-y-3">
                        {categories.length > 0 ? (
                          categories.map(category => {
                            const toolsInCategory = groupedTools[category] ?? []
                            return (
                              <div key={category} className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  className={`rounded-sm px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                                    resolvedCategory === category
                                      ? 'bg-foreground/15 text-foreground'
                                      : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                  }`}
                                  onClick={() => setSelectedCategory(category)}
                                >
                                  {category}
                                </button>
                                {toolsInCategory.map(tool => (
                                  <button
                                    key={tool.id}
                                    type="button"
                                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                                      activeTab === tool.id
                                        ? 'border-foreground/40 bg-muted text-foreground'
                                        : 'border-border/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                                    }`}
                                    onClick={() => handleToolSelect(tool.id)}
                                  >
                                    {tool.title}
                                  </button>
                                ))}
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-muted-foreground py-2 text-center text-sm">
                            未找到匹配的工具
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* 工具内容区域 */}
              <div className="min-h-[600px]">
                <ActiveComponent />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-muted-foreground text-lg">请选择一个工具开始使用</p>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
