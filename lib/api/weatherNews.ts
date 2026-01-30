/**
 * 天气和新闻API服务
 */

// 定义数据类型接口
export interface NewsItem {
  id: number
  title_original: string
  title_chinese: string
  summary_chinese: string
  source_url: string
  category: string
  created_at: string
  updated_at?: string
}

export interface WeatherCondition {
  temp_C: string
  FeelsLikeC: string
  weatherDesc: Array<{ value: string }>
  observation_time: string
}

export interface NearestArea {
  areaName: Array<{ value: string }>
  country: Array<{ value: string }>
}

export interface WeatherData {
  current_condition: WeatherCondition[]
  nearest_area: NearestArea[]
}

export interface WeatherNewsResponse {
  status: string
  news: NewsItem[]
  weather: WeatherData
  timestamp: string
  message?: string
}

/**
 * 获取天气信息
 */
export const getWeather = async (
  city: string = '厦门'
): Promise<{ status: string; data?: WeatherData; message?: string }> => {
  try {
    // 使用Next.js API路由代理
    const response = await fetch('/api/weather-news')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data: WeatherNewsResponse = await response.json()

    if (data.weather) {
      return { status: 'success', data: data.weather }
    } else {
      return { status: 'error', message: '天气数据不可用' }
    }
  } catch (error) {
    console.error('获取天气信息失败:', error)
    return { status: 'error', message: '获取天气信息失败' }
  }
}

/**
 * 获取新闻
 */
export const getNews = async (
  category?: 'domestic' | 'international'
): Promise<{ status: string; data?: NewsItem[]; message?: string }> => {
  try {
    // 使用Next.js API路由代理
    const response = await fetch('/api/weather-news')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data: WeatherNewsResponse = await response.json()

    let newsItems = data.news
    if (category) {
      newsItems = newsItems.filter(item => item.category === category)
    }

    if (newsItems && newsItems.length > 0) {
      return { status: 'success', data: newsItems }
    } else {
      return { status: 'success', data: [] }
    }
  } catch (error) {
    console.error(
      `获取${category ? (category === 'domestic' ? '国内' : '国际') : '最新'}新闻失败:`,
      error
    )
    return {
      status: 'error',
      message: `获取${category ? (category === 'domestic' ? '国内' : '国际') : '最新'}新闻失败`,
    }
  }
}

/**
 * 获取天气新闻综合数据
 */
export const getWeatherNews = async (): Promise<{
  status: string
  news?: NewsItem[]
  weather?: WeatherData
  message?: string
}> => {
  try {
    const response = await fetch('/api/weather-news')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data: WeatherNewsResponse = await response.json()

    if (data.status === 'success') {
      return {
        status: 'success',
        news: data.news,
        weather: data.weather,
      }
    } else {
      return { status: 'error', message: data.message || '获取数据失败' }
    }
  } catch (error) {
    console.error('获取天气新闻失败:', error)
    return { status: 'error', message: '获取天气新闻失败' }
  }
}
