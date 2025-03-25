"use client"

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useStatistics } from '@/hooks/useApi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, PieChart, LineChart, Calendar } from "lucide-react"
import ThingNavigation from '../components/ThingNavigation'

export default function Statistics() {
  const { data: stats, error } = useStatistics()
  const [activeTab, setActiveTab] = useState('overview')

  // 处理错误
  if (error) {
    toast.error(error instanceof Error ? error.message : "发生错误，请重试")
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '无';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  }

  // 渲染加载状态
  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <>
      <ThingNavigation />
      
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">统计分析</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">物品总数</h3>
            <p className="text-3xl font-bold">{stats.total_items}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">分类总数</h3>
            <p className="text-3xl font-bold">{stats.total_categories}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">区域总数</h3>
            <p className="text-3xl font-bold">{stats.total_areas}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">房间总数</h3>
            <p className="text-3xl font-bold">{stats.total_rooms}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart className="h-4 w-4" />
              概览
            </TabsTrigger>
            <TabsTrigger value="category" className="flex items-center">
              <PieChart className="h-4 w-4" />
              分类统计
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center">
              <LineChart className="h-4 w-4" />
              位置统计
            </TabsTrigger>
            <TabsTrigger value="time" className="flex items-center">
              <Calendar className="h-4 w-4" />
              时间统计
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            {/* Render overview content */}
          </TabsContent>
          
          <TabsContent value="category">
            {/* Render category stats content */}
          </TabsContent>
          
          <TabsContent value="location">
            {/* Render location stats content */}
          </TabsContent>
          
          <TabsContent value="time">
            {/* Render time stats content */}
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
} 