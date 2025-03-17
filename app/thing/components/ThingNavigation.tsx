"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, FolderTree, MapPin, BarChart2 } from "lucide-react"

export default function ThingNavigation() {
  const pathname = usePathname()
  
  // 导航项定义
  const navItems = [
    {
      href: "/thing",
      label: "所有物品",
      icon: Package,
      exact: true // 精确匹配路径
    },
    {
      href: "/thing/categories",
      label: "分类管理",
      icon: FolderTree
    },
    {
      href: "/thing/locations",
      label: "位置管理",
      icon: MapPin
    },
    {
      href: "/thing/statistics",
      label: "统计分析",
      icon: BarChart2
    }
  ]
  
  // 检查当前路径是否激活
  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <nav className="container flex items-center py-2 overflow-x-auto">
        <div className="flex items-center space-x-1 md:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.href}
                variant={isActive(item) ? "default" : "ghost"}
                size="sm"
                className="whitespace-nowrap"
                asChild
              >
                <Link href={item.href}>
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            )
          })}
        </div>
      </nav>
    </div>
  )
} 