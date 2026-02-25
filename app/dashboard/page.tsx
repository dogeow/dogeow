'use client'

import { useEffect, useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Calendar, FileText, Globe, MapPin, Monitor, Smartphone } from 'lucide-react'
import useSWR from 'swr'
import ProtectedRoute from '@/components/ProtectedRoute'
import { PageContainer, PageTitle } from '@/components/layout'
import { LoadingState } from '@/components/ui/loading-state'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isAdminSync } from '@/lib/auth'
import { apiRequest } from '@/lib/api'
import { cn } from '@/lib/helpers'
import { getBrowserInfo, getOSInfo } from '@/lib/utils/userAgent'
import useAuthStore from '@/stores/authStore'

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

interface DashboardCardProps {
  title: string
  description: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

function DashboardCard({
  title,
  description,
  icon: Icon,
  className,
  children,
}: DashboardCardProps) {
  return (
    <section className={cn('bg-background rounded-2xl border p-4 shadow-sm sm:p-5', className)}>
      <div className="mb-4 flex items-start gap-3 border-b pb-4">
        <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-lg">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export default function Dashboard() {
  const { isAuthenticated } = useAuthStore()
  const isAdmin = useMemo(() => isAdminSync(), [])

  if (!isAuthenticated) {
    return <div className="text-muted-foreground p-6">正在加载用户信息...</div>
  }

  return (
    <ProtectedRoute>
      <PageContainer maxWidth="6xl" className="mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 space-y-1 sm:mb-8">
          <PageTitle className="text-2xl sm:text-3xl">仪表盘</PageTitle>
          <p className="text-muted-foreground text-sm sm:text-base">
            集中查看当前设备网络信息和服务端运行状态。
          </p>
        </header>

        <div
          className={cn(
            'grid items-start gap-6',
            isAdmin ? 'xl:grid-cols-[minmax(320px,1fr)_minmax(0,1.8fr)]' : 'mx-auto max-w-3xl'
          )}
        >
          <DashboardCard title="我的位置" description="查看 IP、地理位置和浏览器环境" icon={MapPin}>
            <LocationPanel />
          </DashboardCard>

          {isAdmin && (
            <DashboardCard
              title="Laravel 日志"
              description="选择日期并查看服务器日志内容"
              icon={FileText}
            >
              <LogPanel />
            </DashboardCard>
          )}
        </div>
      </PageContainer>
    </ProtectedRoute>
  )
}

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

  const browserInfo = getBrowserInfo(basicInfo?.user_agent)
  const osInfo = getOSInfo(basicInfo?.user_agent)
  const BrowserIcon = browserInfo.Icon
  const OSIcon = osInfo.Icon

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Monitor className="h-3.5 w-3.5" />
          IP 地址
        </div>
        <div className="text-sm break-all">
          {basicLoading ? '加载中...' : basicInfo?.ip || '未知'}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Globe className="h-3.5 w-3.5" />
          地理位置
        </div>
        <div className="text-sm">
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

      <div className="space-y-2 rounded-xl border bg-muted/30 p-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Smartphone className="h-3.5 w-3.5" />
          浏览器信息
        </div>

        {basicLoading ? (
          <div className="text-sm">加载中...</div>
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="bg-background text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-1">
                <BrowserIcon className="h-3.5 w-3.5" />
                {browserInfo.label}
              </span>
              <span className="bg-background text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-1">
                <OSIcon className="h-3.5 w-3.5" />
                {osInfo.label}
              </span>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed break-all">
              {basicInfo?.user_agent || '未知 User-Agent'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function LogPanel() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const { data: logFiles, isLoading: logsLoading } = useSWR<LogFile[]>('/logs', apiRequest, {
    revalidateOnFocus: false,
  })

  const logKey = selectedDate ? `/logs/show?date=${selectedDate}&lines=500` : null

  const {
    data: logData,
    isLoading: logContentLoading,
    mutate: mutateLog,
  } = useSWR<{ content: string }>(logKey, apiRequest, {
    revalidateOnFocus: false,
  })

  useEffect(() => {
    if (!hasInitialized && logFiles && logFiles.length > 0 && !selectedDate) {
      const latestFile = [...logFiles].sort((a, b) => b.date.localeCompare(a.date))[0]
      setSelectedDate(latestFile.date)
      setHasInitialized(true)
    }
  }, [logFiles, hasInitialized, selectedDate])

  useEffect(() => {
    if (!selectedDate) return

    let echo: {
      channel: (name: string) => { listen: (event: string, cb: () => void) => void }
      leave: (name: string) => void
    } | null = null

    const setupEcho = async () => {
      try {
        const { getEchoInstance } = await import('@/lib/websocket/echo')
        const instance = getEchoInstance()

        if (instance && typeof instance.channel === 'function') {
          echo = instance as typeof echo
          if (!echo) return
          const channel = echo.channel('log-updates')

          channel.listen('.log.updated', () => {
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
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="flex min-h-[520px] flex-col gap-4">
      <div className="rounded-xl border bg-muted/30 p-3">
        {logsLoading ? (
          <LoadingState message="加载日志列表..." size="sm" />
        ) : logFiles && logFiles.length > 0 ? (
          <Select
            value={selectedDate || ''}
            onValueChange={value => {
              if (value) {
                setSelectedDate(value)
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="选择日志日期" />
            </SelectTrigger>
            <SelectContent>
              {logFiles.map(file => (
                <SelectItem key={file.date} value={file.date}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{file.date}</span>
                    <span className="text-muted-foreground text-xs">({formatSize(file.size)})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="text-muted-foreground text-sm">暂无可用日志文件</div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
        {selectedDate ? (
          <ScrollArea className="h-[420px] sm:h-[500px]">
            <div className="p-3 sm:p-4">
              {logContentLoading ? (
                <LoadingState message="加载日志内容..." size="sm" />
              ) : logData?.content ? (
                <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                  {logData.content}
                </pre>
              ) : (
                <div className="text-muted-foreground text-sm">暂无日志内容</div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-muted-foreground flex h-[420px] items-center justify-center text-sm">
            请选择日志日期
          </div>
        )}
      </div>
    </div>
  )
}
