import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 通过后端API获取天气新闻数据
    const backendResponse = await fetch('http://localhost:8000/api/news/weather-news', {
      headers: {
        'Content-Type': 'application/json',
        Host: 'next-api.dogeow.com',
      },
      cache: 'no-store', // 禁用缓存
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    } else {
      // 如果后端API不可用，返回模拟数据
      console.warn('Backend API not available, returning mock data')
      return NextResponse.json({
        status: 'success',
        news: [
          {
            id: 1,
            title_original: 'Local News Headline 1',
            title_chinese: '本地新闻标题1',
            summary_chinese: '这是第一条新闻的摘要内容',
            source_url: 'https://example.com/news1',
            category: 'domestic',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 2,
            title_original: 'International News Headline 2',
            title_chinese: '国际新闻标题2',
            summary_chinese: '这是第二条新闻的摘要内容',
            source_url: 'https://example.com/news2',
            category: 'international',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        weather: {
          current_condition: [
            {
              temp_C: '25',
              FeelsLikeC: '26',
              weatherDesc: [{ value: 'Sunny' }],
              observation_time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
          ],
          nearest_area: [
            {
              areaName: [{ value: 'Xiamen' }],
              country: [{ value: 'China' }],
            },
          ],
        },
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Error in weather-news API route:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch data',
        error: (error as Error).message,
      },
      { status: 500 }
    )
  }
}
