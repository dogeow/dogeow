"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, PieChart, LineChart, Calendar } from "lucide-react"
import { toast } from "sonner"
import ThingNavigation from '../components/ThingNavigation'
import { API_BASE_URL } from '@/configs/api'

// 定义统计数据类型
type StatisticsData = {
  totalItems: number;
  totalValue: number;
  byCategory: {
    name: string;
    count: number;
    value: number;
  }[];
  byStatus: {
    status: string;
    count: number;
    value: number;
  }[];
  byLocation: {
    name: string;
    count: number;
    value: number;
  }[];
  recentItems: {
    id: number;
    name: string;
    created_at: string;
  }[];
  expiringItems: {
    id: number;
    name: string;
    expiry_date: string;
  }[];
};

export default function Statistics() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<StatisticsData | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchStatistics()
  }, [])

  const fetchStatistics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error('获取统计数据失败')
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发生错误，请重试")
    } finally {
      setLoading(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return '无';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  }

  // 渲染加载状态
  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <p>加载中...</p>
    </div>
  )

  // 渲染概览
  const renderOverview = () => {
    if (!stats) return null;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">物品总数</CardTitle>
            <CardDescription>您拥有的物品总数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">总价值</CardTitle>
            <CardDescription>所有物品的总价值</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">¥{Number(stats.totalValue).toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">状态分布</CardTitle>
            <CardDescription>按状态统计的物品数量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byStatus.map((item) => (
                <div key={item.status} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className={`w-3 h-3 rounded-full mr-2 ${
                        item.status === 'active' ? 'bg-green-500' : 
                        item.status === 'inactive' ? 'bg-gray-500' : 
                        'bg-red-500'
                      }`}
                    />
                    <span>
                      {item.status === 'active' ? '活跃' : 
                       item.status === 'inactive' ? '不活跃' : 
                       '已过期'}
                    </span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 渲染分类统计
  const renderCategoryStats = () => {
    if (!stats) return null;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>按分类统计</CardTitle>
            <CardDescription>各分类的物品数量和价值</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byCategory.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                暂无分类数据
              </div>
            ) : (
              <div className="space-y-4">
                {stats.byCategory.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.name || '未分类'}</span>
                      <span>{category.count} 件物品</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${(category.count / stats.totalItems) * 100}%` }}
                      />
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      总价值: ¥{category.value.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 渲染位置统计
  const renderLocationStats = () => {
    if (!stats) return null;
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>按位置统计</CardTitle>
            <CardDescription>各位置的物品数量</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.byLocation.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                暂无位置数据
              </div>
            ) : (
              <div className="space-y-4">
                {stats.byLocation.map((location) => (
                  <div key={location.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{location.name || '未指定位置'}</span>
                      <span>{location.count} 件物品</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${(location.count / stats.totalItems) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // 渲染时间相关统计
  const renderTimeStats = () => {
    if (!stats) return null;
    
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近添加的物品</CardTitle>
            <CardDescription>最近添加的5件物品</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                暂无数据
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 border-b">
                    <span>{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>即将过期的物品</CardTitle>
            <CardDescription>最近30天内将要过期的物品</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.expiringItems.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                暂无即将过期的物品
              </div>
            ) : (
              <div className="space-y-2">
                {stats.expiringItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 border-b">
                    <span>{item.name}</span>
                    <span className="text-sm text-red-500">
                      {formatDate(item.expiry_date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

        {loading ? (
          renderLoading()
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart className="mr-2 h-4 w-4" />
                概览
              </TabsTrigger>
              <TabsTrigger value="category" className="flex items-center">
                <PieChart className="mr-2 h-4 w-4" />
                分类统计
              </TabsTrigger>
              <TabsTrigger value="location" className="flex items-center">
                <LineChart className="mr-2 h-4 w-4" />
                位置统计
              </TabsTrigger>
              <TabsTrigger value="time" className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                时间统计
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              {renderOverview()}
            </TabsContent>
            
            <TabsContent value="category">
              {renderCategoryStats()}
            </TabsContent>
            
            <TabsContent value="location">
              {renderLocationStats()}
            </TabsContent>
            
            <TabsContent value="time">
              {renderTimeStats()}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  )
} 