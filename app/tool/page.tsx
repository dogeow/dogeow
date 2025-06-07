"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tools, searchTools } from "./tools"
import { useRouter } from "next/navigation"

export default function ToolPage() {
  const [activeTab, setActiveTab] = useState("time-converter")
  const [filteredTools, setFilteredTools] = useState(tools)
  const router = useRouter()
  
  // 根据 ID 获取当前活动工具
  const activeTool = tools.find(tool => tool.id === activeTab)

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
      const { searchTerm } = event.detail;
      const results = searchTerm ? searchTools(searchTerm) : tools;
      setFilteredTools(results);
      
      // 如果有搜索结果且当前选择的工具不在结果中，则切换到第一个搜索结果
      if (results.length > 0 && !results.some(tool => tool.id === activeTab)) {
        setActiveTab(results[0].id);
      }
    };
    
    document.addEventListener('tool-search', handleToolSearch as EventListener);
    
    return () => {
      document.removeEventListener('tool-search', handleToolSearch as EventListener);
    };
  }, [activeTab]);
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* 工具导航侧栏 */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardContent className="pt-6">
              <Tabs orientation="vertical" defaultValue="time-converter" onValueChange={handleToolSelect}>
                <TabsList className="flex flex-col items-stretch h-auto">
                  {filteredTools.length > 0 ? (
                    filteredTools.map((tool) => (
                      <TabsTrigger 
                        key={tool.id} 
                        value={tool.id}
                        className="justify-start text-left"
                      >
                        {tool.title}
                      </TabsTrigger>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      未找到匹配的工具
                    </p>
                  )}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* 工具内容区 */}
        <div className="flex-1">
          {activeTool ? (
            <div className="space-y-6">
              {/* 工具标题区域 */}
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">{activeTool.title}</h1>
                <p className="text-muted-foreground">{activeTool.description}</p>
              </div>
              
              {/* 工具内容区域 */}
              <div className="min-h-[600px]">
                <activeTool.component />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground text-lg">请选择一个工具开始使用</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}