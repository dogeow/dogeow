'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Package, FolderTree, MapPin, Tag } from 'lucide-react'
import { cn } from '@/lib/helpers'
import { useTranslation } from '@/hooks/useTranslation'

// 定义导航项类型
type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

export default function ThingNavigation() {
  const pathname = usePathname()
  const { t } = useTranslation()

  // 检查当前路径是否激活
  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // 定义导航项
  const navItems: NavItem[] = [
    {
      href: '/thing',
      label: t('nav.all_things', '所有物品'),
      icon: <Package className="h-4 w-4" />,
      exact: true,
    },
    {
      href: '/thing/categories',
      label: t('nav.categories', '分类'),
      icon: <FolderTree className="h-4 w-4" />,
    },
    {
      href: '/thing/locations',
      label: t('nav.locations', '位置'),
      icon: <MapPin className="h-4 w-4" />,
    },
    {
      href: '/thing/tags',
      label: t('nav.tags', '标签'),
      icon: <Tag className="h-4 w-4" />,
    },
  ]

  return (
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 relative border-b shadow-sm backdrop-blur">
      <nav className="flex items-center overflow-x-auto px-2 py-2">
        <div className="flex items-center space-x-4">
          {navItems.map(item => (
            <Button
              key={item.href}
              variant={isActive(item.href, item.exact) ? 'default' : 'ghost'}
              size="sm"
              className={cn('whitespace-nowrap', isActive(item.href, item.exact) && 'font-medium')}
              asChild
            >
              <Link href={item.href} className="flex items-center gap-2">
                {item.icon}
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  )
}
