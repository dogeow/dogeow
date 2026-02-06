import WeatherNewsDashboard from '@/components/weather-news/WeatherNewsDashboard'
import { Metadata } from 'next'
import { PageContainer } from '@/components/layout'

export const metadata: Metadata = {
  title: '天气与新闻 - DogeOW',
  description: '实时天气信息与国内外新闻资讯',
}

export default function WeatherNewsPage() {
  return (
    <PageContainer>
      <WeatherNewsDashboard />
    </PageContainer>
  )
}
