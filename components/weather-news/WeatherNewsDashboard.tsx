'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, Sun, CloudRain, Newspaper, Globe } from 'lucide-react'
import WeatherDisplay from './WeatherDisplay'
import NewsDisplay from './NewsDisplay'
import { getWeatherNews } from '@/lib/api/weatherNews'

interface NewsItem {
  id: number
  title_original: string
  title_chinese: string
  summary_chinese: string
  source_url: string
  category: string
  created_at: string
  updated_at?: string
}

interface WeatherCondition {
  temp_C: string
  FeelsLikeC: string
  weatherDesc: Array<{ value: string }>
  observation_time: string
}

interface NearestArea {
  areaName: Array<{ value: string }>
  country: Array<{ value: string }>
}

interface WeatherData {
  current_condition: WeatherCondition[]
  nearest_area: NearestArea[]
}

const WeatherNewsDashboard = () => {
  const [weatherNewsData, setWeatherNewsData] = useState<{
    news: NewsItem[]
    weather: WeatherData
    timestamp: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getWeatherNews()

      if (response.status === 'success' && response.news && response.weather) {
        setWeatherNewsData({
          news: response.news,
          weather: response.weather,
          timestamp: new Date().toISOString(),
        })
      } else {
        throw new Error(response.message || '获取数据失败')
      }
    } catch (err) {
      console.error('获取天气新闻数据失败:', err)
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const refreshData = () => {
    fetchData()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">天气新闻看板</h2>
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                天气信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                最新新闻
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">天气新闻看板</h2>
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="py-8 text-center">
              <p className="text-destructive mb-4">错误: {error}</p>
              <Button onClick={refreshData}>重试</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!weatherNewsData) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">暂无数据</p>
        <Button onClick={refreshData} className="mt-4">
          刷新数据
        </Button>
      </div>
    )
  }

  const { news, weather } = weatherNewsData
  const domesticNews = news.filter(item => item.category === 'domestic')
  const internationalNews = news.filter(item => item.category === 'international')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">天气新闻看板</h2>
        <Button variant="outline" onClick={refreshData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <WeatherDisplay weather={weather} />

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">全部新闻</TabsTrigger>
            <TabsTrigger value="domestic">国内新闻</TabsTrigger>
            <TabsTrigger value="international">国际新闻</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <NewsDisplay news={news} />
          </TabsContent>

          <TabsContent value="domestic" className="mt-4">
            <NewsDisplay news={domesticNews} category="domestic" />
          </TabsContent>

          <TabsContent value="international" className="mt-4">
            <NewsDisplay news={internationalNews} category="international" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default WeatherNewsDashboard
