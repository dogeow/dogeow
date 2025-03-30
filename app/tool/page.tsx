"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { tools, getCategories, searchTools } from "./tools"

export default function ToolPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("time-converter")
  
  // 过滤工具
  const filteredTools = searchTerm ? searchTools(searchTerm) : tools

  // 根据 ID 获取当前活动工具
  const activeTool = tools.find(tool => tool.id === activeTab)
  
  return (
    <div className="container mx-auto py-6">
     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* 工具导航侧栏 */}
        <div className="col-span-1">
          <Card>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索工具..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <CardContent>
              {filteredTools.length > 0 ? (
                <Tabs orientation="vertical" defaultValue="time-converter" onValueChange={setActiveTab}>
                  <TabsList className="flex flex-col items-stretch h-auto">
                    {filteredTools.map((tool) => (
                      <TabsTrigger 
                        key={tool.id} 
                        value={tool.id}
                        className="justify-start text-left"
                      >
                        {tool.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  未找到匹配的工具
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* 工具内容区 */}
        <div className="col-span-1 md:col-span-3">
          <Card>
            {activeTool ? (
              <>
                <CardHeader>
                  <CardTitle>{activeTool.title}</CardTitle>
                  <CardDescription>{activeTool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeTool && <activeTool.component />}
                </CardContent>
              </>
            ) : (
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">请选择一个工具开始使用</p>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}