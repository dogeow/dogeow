'use client'

import { useUITheme } from '@/components/themes/UIThemeProvider'
import { configs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'
import { getTranslatedConfigs } from '@/app/configs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/helpers'
import { useState } from 'react'
import {
  Package,
  FlaskConical,
  FileText,
  Wrench,
  Compass,
  BookOpen,
  Gamepad2,
  MessageSquare,
  ChevronLeft,
  Settings,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  thing: Package,
  lab: FlaskConical,
  file: FileText,
  tool: Wrench,
  nav: Compass,
  note: BookOpen,
  game: Gamepad2,
  chat: MessageSquare,
  word: MessageSquare,
}

/**
 * Dashboard 主题的 Sidebar 组件
 * 可折叠侧边栏，带分组和图标
 */
export default function DashboardSidebar() {
  const theme = useUITheme()
  const { t } = useTranslation()
  const pathname = usePathname()
  const translatedConfigs = getTranslatedConfigs(t)
  const [collapsed, setCollapsed] = useState(false)

  if (!theme) return null

  const tiles = translatedConfigs.tiles

  // 安全的 name key（翻译可能会导致 name undefined）
  const getNameKey = (tile: { name?: string; href?: string }) => (tile.name ?? '') as string

  // 分组：常用和工具
  const commonTiles = tiles.filter(tile =>
    ['thing', 'file', 'note', 'chat'].includes(getNameKey(tile))
  )
  const toolTiles = tiles.filter(
    tile => !['thing', 'file', 'note', 'chat'].includes(getNameKey(tile))
  )

  return (
    <aside
      className={cn(
        'bg-background flex h-full flex-col border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-[280px]'
      )}
    >
      {/* 折叠按钮：与顶部 header 颜色一致 */}
      <div className="border-border/50 flex h-16 items-center justify-between border-b px-4">
        {!collapsed && <h2 className="text-sm font-semibold tracking-wider uppercase">导航</h2>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-muted flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto p-3">
        {/* 常用功能 */}
        {!collapsed && (
          <div className="mb-4">
            <p className="text-muted-foreground mb-2 px-3 text-xs font-medium tracking-wider uppercase">
              常用
            </p>
            <ul className="space-y-1">
              {commonTiles.map(tile => {
                const key = getNameKey(tile)
                const Icon = iconMap[key] || Package
                const isActive = pathname === tile.href

                return (
                  <li key={tile.name ?? tile.href}>
                    <Link
                      href={tile.href || '#'}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      )}
                      title={collapsed ? (tile.name ?? undefined) : undefined}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{tile.name}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* 工具 */}
        {!collapsed && (
          <div>
            <p className="text-muted-foreground mb-2 px-3 text-xs font-medium tracking-wider uppercase">
              工具
            </p>
            <ul className="space-y-1">
              {toolTiles.map(tile => {
                const key = getNameKey(tile)
                const Icon = iconMap[key] || Package
                const isActive = pathname === tile.href

                return (
                  <li key={tile.name ?? tile.href}>
                    <Link
                      href={tile.href || '#'}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{tile.name}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {/* 折叠状态下的图标 */}
        {collapsed && (
          <ul className="space-y-1">
            {tiles.map((tile, idx) => {
              const key = getNameKey(tile)
              const Icon = iconMap[key] || Package
              const isActive = pathname === tile.href

              return (
                <li key={tile.name ?? tile.href ?? idx}>
                  <Link
                    href={tile.href || '#'}
                    className={cn(
                      'flex items-center justify-center rounded-lg p-2.5 transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    )}
                    title={tile.name}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      {/* 设置按钮 */}
      <div className="border-t p-3">
        <Link
          href="/settings"
          className="text-muted-foreground hover:bg-muted/50 hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all"
        >
          <Settings className="h-5 w-5 shrink-0" />
          {!collapsed && <span>设置</span>}
        </Link>
      </div>
    </aside>
  )
}
