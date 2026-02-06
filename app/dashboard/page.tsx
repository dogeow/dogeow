'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import useAuthStore from '@/stores/authStore'
import { apiRequest } from '@/lib/api'
import useSWR from 'swr'
import { getBrowserInfo, getOSInfo } from '@/lib/utils/userAgent'
import { LoadingState } from '@/components/ui/loading-state'
import { PageContainer, PageTitle } from '@/components/layout'

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
    return <div className="text-muted-foreground p-6">正在加载用户信息...</div>
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageTitle className="mb-4">仪表盘</PageTitle>

        <div className="space-y-4">
          <div>
            <div className="text-muted-foreground mb-1 text-sm">IP 地址</div>
            <div className="bg-muted rounded border p-3 text-sm break-all">
              {basicLoading ? '加载中...' : basicInfo?.ip}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground mb-1 text-sm">地理位置</div>
            <div className="bg-muted rounded border p-3 text-sm break-all">
              {locationLoading ? (
                <LoadingState message="正在获取地理位置信息..." size="sm" />
              ) : locationError ? (
                <div className="text-destructive">地理位置信息获取失败，请稍后重试</div>
              ) : locationInfo?.location ? (
                <div className="space-y-1">
                  <div>国家/地区：{locationInfo.location.country || '未知'}</div>
                  <div>省份：{locationInfo.location.region || '未知'}</div>
                  <div>城市：{locationInfo.location.city || '未知'}</div>
                  <div>网络服务商：{locationInfo.location.isp || '未知'}</div>
                  <div>时区：{locationInfo.location.timezone || '未知'}</div>
                </div>
              ) : (
                <div className="text-muted-foreground">暂无地理位置信息</div>
              )}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground mb-1 text-sm">User-Agent</div>
            <div className="bg-muted rounded border p-3 text-sm break-all">
              {basicLoading ? (
                '加载中...'
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                    {(() => {
                      const browserInfo = getBrowserInfo(basicInfo?.user_agent)
                      const osInfo = getOSInfo(basicInfo?.user_agent)
                      const BrowserIcon = browserInfo.Icon
                      const OSIcon = osInfo.Icon

                      return (
                        <>
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            <BrowserIcon className="h-3.5 w-3.5 text-gray-700 dark:text-gray-200" />
                            {browserInfo.label}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            <OSIcon className="h-3.5 w-3.5 text-gray-700 dark:text-gray-200" />
                            {osInfo.label}
                          </span>
                        </>
                      )
                    })()}
                  </div>
                  <div>{basicInfo?.user_agent}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContainer>
    </ProtectedRoute>
  )
}
