"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, FolderTree, MapPin, Tag } from "lucide-react"
import { cn } from "@/lib/helpers"

// 定义导航项类型
type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

export default function ThingNavigation() {
  const pathname = usePathname()
  
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
      href: "/thing",
      label: "所有物品",
      icon: <Package className="h-4 w-4" />,
      exact: true
    },
    {
      href: "/thing/categories",
      label: "分类",
      icon: <FolderTree className="h-4 w-4" />
    },
    {
      href: "/thing/locations", 
      label: "位置",
      icon: <MapPin className="h-4 w-4" />
    },
    {
      href: "/thing/tags",
      label: "标签", 
      icon: <Tag className="h-4 w-4" />
    }
  ]
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative shadow-sm">
      <nav className="flex items-center py-2 px-2 overflow-x-auto">
        <div className="flex items-center space-x-4">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={isActive(item.href, item.exact) ? "default" : "ghost"}
              size="sm"
              className={cn(
                "whitespace-nowrap",
                isActive(item.href, item.exact) && "font-medium"
              )}
              asChild
            >
              <Link href={item.href}>
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