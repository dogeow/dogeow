'use client'

import { useUITheme } from '@/components/themes/UIThemeProvider'
import { configs } from '@/app/configs'
import { useTranslation } from '@/hooks/useTranslation'
import { getTranslatedConfigs } from '@/app/configs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/helpers'
import {
  Package,
  FlaskConical,
  FileText,
  Wrench,
  Compass,
  BookOpen,
  Gamepad2,
  MessageSquare,
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
 * 侧边栏主题的 Sidebar 组件
 * 完全不同的导航方式：左侧边栏导航，类似管理后台
 */
export default function Sidebar() {
  const theme = useUITheme()
  const { t } = useTranslation()
  const pathname = usePathname()
  const translatedConfigs = getTranslatedConfigs(t)

  if (!theme) return null

  const tiles = translatedConfigs.tiles
  const getNameKey = (tile: { name?: string; href?: string }) => (tile.name ?? '') as string

  return (
    <aside className="bg-card flex h-full flex-col border-r">
      {/* 侧边栏头部 */}
      <div className="flex h-16 items-center border-b px-4">
        <h2 className="text-lg font-semibold">导航</h2>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto p-2">
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
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tile.name}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* 侧边栏底部 */}
      <div className="border-t p-4">
        <div className="text-muted-foreground text-xs">
          <p>DogeOW v1.0</p>
        </div>
      </div>
    </aside>
  )
}
