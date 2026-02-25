'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useUITheme } from '@/components/themes/UIThemeProvider'
import { AppLauncher } from '@/components/launcher'
import { Search, Menu } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { NotificationDropdown } from '@/components/app/NotificationDropdown'
import useAuthStore from '@/stores/authStore'

const AiDialog = dynamic(
  () => import('@/components/app/AiDialog').then(m => ({ default: m.AiDialog })),
  { ssr: false }
)

/**
 * Dashboard 主题的 Header 组件
 * 星星按钮 → 通用 AI（含视觉理解）
 */
export default function DashboardHeader() {
  const theme = useUITheme()
  const { currentUITheme, setCurrentUITheme } = useThemeStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [isAiOpen, setIsAiOpen] = useState(false)

  if (!theme) return null

  return (
    <>
      <AiDialog variant="panel" open={isAiOpen} onOpenChange={setIsAiOpen} />
      <div className="flex h-full w-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            aria-label="切换侧边栏"
          >
            <Menu className="h-5 w-5" />
          </button>

          {theme.layout.header.showLogo && (
            <div className="flex items-center gap-2">
              <div className="from-primary to-primary/60 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br">
                <span className="text-sm font-bold text-white">DO</span>
              </div>
              <span className="hidden text-lg font-semibold sm:inline">DogeOW</span>
            </div>
          )}
        </div>

        {theme.layout.header.showSearch && (
          <div className="mx-8 hidden max-w-2xl flex-1 md:block">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索应用、功能..."
                className="bg-background/50 focus:ring-primary/50 focus:border-primary h-10 w-full rounded-lg border pr-4 pl-10 text-sm backdrop-blur-sm transition-all focus:ring-2 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <NotificationDropdown />

          {theme.layout.header.showUserMenu && (
            <div className="flex items-center gap-2">
              <AppLauncher onOpenAi={() => setIsAiOpen(true)} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
