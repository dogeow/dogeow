import WeatherNewsDashboard from '@/components/weather-news/WeatherNewsDashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '天气与新闻 - DogeOW',
  description: '实时天气信息与国内外新闻资讯',
}

export default function WeatherNewsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
      <WeatherNewsDashboard />
    </div>
  )
}
