'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface ForecastDay {
  date: string
  avg_temp_c: number
  max_temp_c: string
  min_temp_c: string
  weather_desc: string
  chance_of_rain: string
  precipitation: Array<{
    time: string
    amount: string
  }>
}

interface WeatherDisplayProps {
  weather: WeatherData | null
  forecast?: ForecastDay[]
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weather, forecast = [] }) => {
  if (!weather) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">天气信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">暂无天气数据</div>
        </CardContent>
      </Card>
    )
  }

  const current = weather.current_condition[0]
  const location = weather.nearest_area[0]

  const cityName = location?.areaName?.[0]?.value || '未知城市'
  const countryName = location?.country?.[0]?.value || ''
  const temperature = current?.temp_C || '--'
  const feelsLike = current?.FeelsLikeC || '--'
  const description = current?.weatherDesc?.[0]?.value || '未知'
  const observationTime = current?.observation_time || ''

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold">
          {cityName}, {countryName}
        </CardTitle>
        <div className="text-muted-foreground text-sm">更新时间: {observationTime}</div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg bg-blue-50 p-4 text-center dark:bg-blue-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-300">城市</p>
            <p className="font-semibold text-gray-800 dark:text-white">{cityName}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-4 text-center dark:bg-green-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-300">温度</p>
            <p className="font-semibold text-gray-800 dark:text-white">{temperature}°C</p>
          </div>
          <div className="rounded-lg bg-yellow-50 p-4 text-center dark:bg-yellow-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-300">体感温度</p>
            <p className="font-semibold text-gray-800 dark:text-white">{feelsLike}°C</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-4 text-center dark:bg-purple-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-300">天气状况</p>
            <p className="font-semibold text-gray-800 dark:text-white">{description}</p>
          </div>
          <div className="rounded-lg bg-indigo-50 p-4 text-center dark:bg-indigo-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-300">国家</p>
            <p className="font-semibold text-gray-800 dark:text-white">{countryName}</p>
          </div>
          <div className="rounded-lg bg-pink-50 p-4 text-center dark:bg-pink-900/30">
            <p className="text-sm text-gray-600 dark:text-gray-300">观测时间</p>
            <p className="font-semibold text-gray-800 dark:text-white">{observationTime}</p>
          </div>
        </div>

        {forecast.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">
              未来天气预报
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {forecast.slice(0, 3).map((day, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <h4 className="font-medium text-gray-800 dark:text-white">{day.date}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{day.weather_desc}</p>
                  <div className="mt-2 flex justify-between">
                    <span className="text-red-500">最高: {day.max_temp_c}°C</span>
                    <span className="text-blue-500">最低: {day.min_temp_c}°C</span>
                  </div>
                  {day.precipitation && day.precipitation.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">降雨预测:</p>
                      {day.precipitation.slice(0, 3).map((precip, idx) => (
                        <p key={idx} className="text-xs text-blue-500">
                          {precip.time}: {precip.amount}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default WeatherDisplay
