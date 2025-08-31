'use client'

import { useState, useEffect } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // 监听应用安装完成事件
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('用户接受了安装提示')
      } else {
        console.log('用户拒绝了安装提示')
      }

      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    } catch (error) {
      console.error('安装过程中出现错误:', error)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
  }

  // 如果已经安装或没有安装提示，不显示组件
  if (isInstalled || !showInstallPrompt) {
    return null
  }

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 md:right-4 md:left-auto md:w-80">
      <div className="bg-background border-border space-y-3 rounded-lg border p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Smartphone className="text-primary h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-foreground font-semibold">安装 DogeOW</h3>
              <p className="text-muted-foreground text-sm">将应用安装到主屏幕，获得更好的体验</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="hover:bg-muted rounded-full p-1 transition-colors"
          >
            <X className="text-muted-foreground h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            安装应用
          </button>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground px-4 py-2 text-sm transition-colors"
          >
            稍后再说
          </button>
        </div>

        <div className="text-muted-foreground text-xs">
          <p>• 支持离线使用</p>
          <p>• 快速启动和访问</p>
          <p>• 推送通知支持</p>
        </div>
      </div>
    </div>
  )
}
