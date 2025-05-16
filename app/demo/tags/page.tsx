"use client"

import { useState } from "react"
import { TagSelector, Tag } from "@/components/ui/tag-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TagSelectorDemo() {
  // 模拟标签数据
  const demoTags: Tag[] = [
    { id: "测试", name: "测试" },
    { id: "测试2", name: "测试2" },
    { id: "测试3", name: "测试3" },
    { id: "及格", name: "及格" },
  ]

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedTagsWithTabs, setSelectedTagsWithTabs] = useState<string[]>([])

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">标签选择器演示</h1>
      
      <div className="grid gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">基本标签选择器</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>标签选择器</CardTitle>
                <CardDescription>
                  可以通过下拉选择或点击已有标签来管理标签
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TagSelector
                  tags={demoTags}
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="选择标签"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>已选择的标签</CardTitle>
                <CardDescription>
                  当前选择的标签IDs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(selectedTags, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">带标签页的选择器</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>标签选择器（带标签页）</CardTitle>
                <CardDescription>
                  带有"基础"和"详细"标签页的选择器
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TagSelector
                  tags={demoTags}
                  selectedTags={selectedTagsWithTabs}
                  onChange={setSelectedTagsWithTabs}
                  placeholder="选择标签"
                  showTabs={true}
                  tabNames={{ basic: "基础", detail: "详细" }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>已选择的标签</CardTitle>
                <CardDescription>
                  当前选择的标签IDs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(selectedTagsWithTabs, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 