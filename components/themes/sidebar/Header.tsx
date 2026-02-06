'use client'

import { useUITheme } from '@/components/themes/UIThemeProvider'
import { AppLauncher } from '@/components/launcher'
import { Menu } from 'lucide-react'
import { useState } from 'react'

/**
 * 侧边栏主题的 Header 组件
 * 完全不同的 Header 设计：固定定位、更简洁、带菜单按钮
 */
export default function SidebarHeader() {
  const theme = useUITheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!theme) return null

  return (
    <div className="bg-background/95 flex h-full w-full items-center justify-between px-4 shadow-sm">
      {/* 左侧：Logo 和菜单按钮 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hover:bg-muted flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
          aria-label="切换侧边栏"
        >
          <Menu className="h-5 w-5" />
        </button>

        {theme.layout.header.showLogo && (
          <div className="flex items-center gap-2">
            <div className="bg-primary h-8 w-8 rounded" />
            <span className="text-lg font-semibold">DogeOW</span>
          </div>
        )}
      </div>

      {/* 中间：搜索栏（如果启用） */}
      {theme.layout.header.showSearch && (
        <div className="mx-4 max-w-md flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索..."
              className="bg-background focus:ring-primary h-9 w-full rounded-lg border px-3 text-sm focus:ring-2 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 右侧：用户菜单和设置 */}
      <div className="flex items-center gap-2">
        {theme.layout.header.showUserMenu && (
          <div className="flex items-center gap-2">
            {/* 这里可以放用户头像、通知等 */}
            <AppLauncher />
          </div>
        )}
      </div>
    </div>
  )
}
