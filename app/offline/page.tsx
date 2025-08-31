'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 检查初始状态
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  if (isOnline) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Wifi className="mx-auto h-16 w-16 text-green-500" />
          <h1 className="text-foreground text-2xl font-bold">网络已恢复</h1>
          <p className="text-muted-foreground">正在重新加载页面...</p>
          <button
            onClick={handleRefresh}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-md px-4 py-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            立即刷新
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 px-4 text-center">
        <WifiOff className="text-muted-foreground mx-auto h-20 w-20" />

        <div className="space-y-2">
          <h1 className="text-foreground text-3xl font-bold">网络连接断开</h1>
          <p className="text-muted-foreground">
            看起来你的网络连接出现了问题。请检查你的网络设置并重试。
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-muted-foreground space-y-1 text-sm">
            <p>• 检查WiFi或移动数据是否开启</p>
            <p>• 尝试重新连接网络</p>
            <p>• 如果问题持续，请联系网络服务提供商</p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          重试连接
        </button>

        <div className="border-border border-t pt-4">
          <p className="text-muted-foreground text-xs">DogeOW 支持离线浏览，部分功能可能受限</p>
        </div>
      </div>
    </div>
  )
}
