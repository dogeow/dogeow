'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown } from 'lucide-react'
import { tools, searchTools } from './tools'
import { useRouter } from 'next/navigation'

export default function ToolPage() {
  const [activeTab, setActiveTab] = useState('time-converter')
  const [filteredTools, setFilteredTools] = useState(tools)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  // 根据 ID 获取当前活动工具
  const activeTool = tools.find(tool => tool.id === activeTab)
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

  // 处理工具选择
  const handleToolSelect = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId)
    if (tool?.route) {
      router.push(tool.route)
    } else {
      setActiveTab(toolId)
    }
  }

  // 添加工具搜索事件监听
  useEffect(() => {
    const handleToolSearch = (event: CustomEvent) => {
      const { searchTerm } = event.detail
      const results = searchTerm ? searchTools(searchTerm) : tools
      setFilteredTools(results)

      // 如果有搜索结果且当前选择的工具不在结果中，则切换到第一个搜索结果
      if (results.length > 0 && !results.some(tool => tool.id === activeTab)) {
        setActiveTab(results[0].id)
      }
    }

    document.addEventListener('tool-search', handleToolSearch as EventListener)

    return () => {
      document.removeEventListener('tool-search', handleToolSearch as EventListener)
    }
  }, [activeTab])

  return (
    <div className="container mx-auto p-4">
      <div className="space-y-6">
        {/* 工具内容区 */}
        <div>
          {activeTool ? (
            <div className="space-y-6">
              {/* 工具标题区域 */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/40 flex items-center rounded-md border p-1.5 text-xs"
                    onClick={() => setIsExpanded(prev => !prev)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? '收起工具选择' : '展开工具选择'}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <h1 className="text-2xl font-bold tracking-tight">{activeTool.title}</h1>
                </div>
                <p className="text-muted-foreground">{activeTool.description}</p>
                {isExpanded ? (
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
                ) : null}
              </div>

              {/* 工具内容区域 */}
              <div className="min-h-[600px]">
                <activeTool.component />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[400px] items-center justify-center">
              <p className="text-muted-foreground text-lg">请选择一个工具开始使用</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
