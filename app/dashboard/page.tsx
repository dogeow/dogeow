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

interface ClientInfo {
  ip: string
  user_agent: string
  location: Location
}

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore()
  const { data: clientInfo, isLoading } = useSWR<ClientInfo>('/client-info', apiRequest)

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
              {isLoading ? '加载中...' : clientInfo?.ip}
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-gray-400">地理位置</div>
            <div className="rounded bg-gray-800 p-3 text-sm break-all text-gray-200">
              {isLoading
                ? '加载中...'
                : clientInfo?.location && (
                    <div className="space-y-1">
                      <div>国家/地区：{clientInfo.location.country}</div>
                      <div>省份：{clientInfo.location.region}</div>
                      <div>城市：{clientInfo.location.city}</div>
                      <div>网络服务商：{clientInfo.location.isp}</div>
                      <div>时区：{clientInfo.location.timezone}</div>
                    </div>
                  )}
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-gray-400">User-Agent</div>
            <div className="rounded bg-gray-800 p-3 text-sm break-all text-gray-200">
              {isLoading ? '加载中...' : clientInfo?.user_agent}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
