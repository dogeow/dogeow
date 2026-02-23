'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import useAuthStore from '@/stores/authStore'
import { apiRequest } from '@/lib/api'
import useSWR, { mutate } from 'swr'
import { getBrowserInfo, getOSInfo } from '@/lib/utils/userAgent'
import { LoadingState } from '@/components/ui/loading-state'
import { PageContainer, PageTitle } from '@/components/layout'
import { useState, useEffect } from 'react'
import { isAdminSync } from '@/lib/auth'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  MapPin,
  FileText,
  Monitor,
  Globe,
  Smartphone,
  HardDrive,
  Calendar,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/helpers'

// Types
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

interface LogFile {
  name: string
  date: string
  size: number
  modified: number
}

type MenuType = 'location' | 'logs' | null

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [openMenu, setOpenMenu] = useState<MenuType>(null)

  useEffect(() => {
    setIsAdmin(isAdminSync())
  }, [])

  // 显示加载状态
  if (!isAuthenticated) {
    return <div className="text-muted-foreground p-6">正在加载用户信息...</div>
  }

  return (
    <ProtectedRoute>
      <PageContainer maxWidth="2xl" className="mx-auto">
        <PageTitle className="mb-4">仪表盘</PageTitle>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 我的位置 */}
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-3 p-4"
            onClick={() => setOpenMenu('location')}
          >
            <div className="flex w-full items-center justify-between">
              <MapPin className="h-5 w-5 text-primary" />
              <Globe className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-left">
              <div className="font-medium">我的位置</div>
              <div className="text-sm text-muted-foreground">
                查看 IP 地址和地理位置
              </div>
            </div>
          </Button>

          {/* Laravel 日志 - 仅管理员 */}
          {isAdmin && (
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-3 p-4"
              onClick={() => setOpenMenu('logs')}
            >
              <div className="flex w-full items-center justify-between">
                <FileText className="h-5 w-5 text-primary" />
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <div className="font-medium">Laravel 日志</div>
                <div className="text-sm text-muted-foreground">
                  查看服务器日志文件
                </div>
              </div>
            </Button>
          )}
        </div>

        {/* 我的位置侧边栏 */}
        <Sheet open={openMenu === 'location'} onOpenChange={(open) => !open && setOpenMenu(null)}>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                我的位置
              </SheetTitle>
              <SheetDescription>
                您的 IP 地址和地理位置信息
              </SheetDescription>
            </SheetHeader>
            <LocationPanel />
          </SheetContent>
        </Sheet>

        {/* Laravel 日志侧边栏 */}
        <Sheet open={openMenu === 'logs'} onOpenChange={(open) => !open && setOpenMenu(null)}>
          <SheetContent side="right" className="w-full sm:max-w-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Laravel 日志
              </SheetTitle>
            </SheetHeader>
            <LogPanel />
          </SheetContent>
        </Sheet>
      </PageContainer>
    </ProtectedRoute>
  )
}

// 位置信息面板组件
function LocationPanel() {
  const { data: basicInfo, isLoading: basicLoading } = useSWR<BasicInfo>(
    '/client-basic-info',
    apiRequest
  )

  const {
    data: locationInfo,
    isLoading: locationLoading,
    error: locationError,
  } = useSWR<LocationInfo>('/client-location-info', apiRequest)

  return (
    <ScrollArea className="h-[calc(100vh-8rem)]">
      <div className="space-y-4 pr-4">
        {/* IP 地址 */}
        <div>
          <div className="text-muted-foreground mb-1 text-sm flex items-center gap-1">
            <Monitor className="h-3 w-3" />
            IP 地址
          </div>
          <div className="bg-muted rounded border p-3 text-sm break-all">
            {basicLoading ? '加载中...' : basicInfo?.ip}
          </div>
        </div>

        {/* 地理位置 */}
        <div>
          <div className="text-muted-foreground mb-1 text-sm flex items-center gap-1">
            <Globe className="h-3 w-3" />
            地理位置
          </div>
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

        {/* User-Agent */}
        <div>
          <div className="text-muted-foreground mb-1 text-sm flex items-center gap-1">
            <Smartphone className="h-3 w-3" />
            浏览器信息
          </div>
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
    </ScrollArea>
  )
}

// 日志面板组件
function LogPanel() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const { data: logFiles, isLoading: logsLoading } = useSWR<LogFile[]>(
    '/logs',
    apiRequest,
    { revalidateOnFocus: false }
  )

  const logKey = selectedDate ? `/logs/show?date=${selectedDate}&lines=500` : null

  const { data: logData, isLoading: logContentLoading, mutate: mutateLog } = useSWR<{
    content: string
  }>(logKey, apiRequest, {
    revalidateOnFocus: false,
  })

  // 默认选择最新的日志文件
  useEffect(() => {
    if (!hasInitialized && logFiles && logFiles.length > 0 && !selectedDate) {
      const latestFile = logFiles.sort((a, b) => b.date.localeCompare(a.date))[0]
      setSelectedDate(latestFile.date)
      setHasInitialized(true)
    }
  }, [logFiles, hasInitialized, selectedDate])

  // WebSocket 监听日志更新
  useEffect(() => {
    if (!selectedDate) return

    let echo: { channel: (name: string) => { listen: (event: string, cb: () => void) => void }; leave: (name: string) => void } | null = null

    const setupEcho = async () => {
      try {
        const { getEchoInstance } = await import('@/lib/websocket/echo')
        const instance = getEchoInstance()

        if (instance && typeof instance.channel === 'function') {
          echo = instance as typeof echo
          if (!echo) return
          const channel = echo.channel('log-updates')

          channel.listen('.log.updated', () => {
            console.log('收到日志更新推送，刷新内容...')
            mutateLog()
          })
        }
      } catch (error) {
        console.warn('WebSocket 连接失败:', error)
      }
    }

    setupEcho()

    return () => {
      if (echo) {
        echo.leave('log-updates')
      }
    }
  }, [selectedDate, mutateLog])

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* 日期选择 */}
      <div className="flex-shrink-0 pb-3 border-b">
        {logsLoading ? (
          <LoadingState message="加载日志列表..." size="sm" />
        ) : logFiles && logFiles.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select
              value={selectedDate || ''}
              onValueChange={(value) => {
                if (value) {
                  setSelectedDate(value)
                }
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="选择日期" />
              </SelectTrigger>
              <SelectContent>
                {logFiles.map((file) => (
                  <SelectItem key={file.date} value={file.date}>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>{file.date}</span>
                      <span className="text-muted-foreground text-xs">
                        ({formatSize(file.size)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">暂无可用日志文件</div>
        )}
      </div>

      {/* 日志内容 - 自适应高度 */}
      {selectedDate && (
        <div className="flex-1 min-h-0 pt-3">
          <div className="bg-muted rounded border p-3 h-full overflow-auto">
            {logContentLoading ? (
              <LoadingState message="加载日志内容..." size="sm" />
            ) : logData?.content ? (
              <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                {logData.content}
              </pre>
            ) : (
              <div className="text-muted-foreground text-sm">
                暂无日志内容
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
