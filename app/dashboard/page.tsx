'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import useAuthStore from '@/stores/authStore'
import { apiRequest } from '@/lib/api'
import useSWR from 'swr'

interface Location {
  country: string
  region: string
  city: string
  isp: string
  timezone: string
}

interface BasicInfo {
  ip: string
  user_agent: string
}

interface LocationInfo {
  location: Location
  error?: string
}

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore()

  // 立即获取基本信息（IP和User-Agent）
  const { data: basicInfo, isLoading: basicLoading } = useSWR<BasicInfo>(
    '/client-basic-info',
    apiRequest
  )

  // 异步获取地理位置信息
  const {
    data: locationInfo,
    isLoading: locationLoading,
    error: locationError,
  } = useSWR<LocationInfo>('/client-location-info', apiRequest)

  // 显示加载状态，直到确认用户已加载
  if (!isAuthenticated) {
    return <div className="p-6">正在加载用户信息...</div>
  }

  return (
    <ProtectedRoute>
      <div className="p-6">
        <h1 className="mb-4 text-xl font-bold">仪表盘</h1>

        <div className="space-y-4">
          <div>
            <div className="mb-1 text-sm text-gray-400">IP 地址</div>
            <div className="rounded bg-gray-800 p-3 text-sm break-all text-gray-200">
              {basicLoading ? '加载中...' : basicInfo?.ip}
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-gray-400">地理位置</div>
            <div className="rounded bg-gray-800 p-3 text-sm break-all text-gray-200">
              {locationLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-300"></div>
                  <span>正在获取地理位置信息...</span>
                </div>
              ) : locationError ? (
                <div className="text-red-400">地理位置信息获取失败，请稍后重试</div>
              ) : locationInfo?.location ? (
                <div className="space-y-1">
                  <div>国家/地区：{locationInfo.location.country || '未知'}</div>
                  <div>省份：{locationInfo.location.region || '未知'}</div>
                  <div>城市：{locationInfo.location.city || '未知'}</div>
                  <div>网络服务商：{locationInfo.location.isp || '未知'}</div>
                  <div>时区：{locationInfo.location.timezone || '未知'}</div>
                </div>
              ) : (
                <div className="text-gray-400">暂无地理位置信息</div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-gray-400">User-Agent</div>
            <div className="rounded bg-gray-800 p-3 text-sm break-all text-gray-200">
              {basicLoading ? '加载中...' : basicInfo?.user_agent}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
