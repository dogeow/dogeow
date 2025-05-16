"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, FolderTree, MapPin, Tag, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"

export default function ThingNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  
  // 检查屏幕宽度，判断是否为移动设备
  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 640)
    }
    
    checkWidth()
    window.addEventListener('resize', checkWidth)
    
    return () => window.removeEventListener('resize', checkWidth)
  }, [])
  
  // 导航项定义
  const navItems = [
    {
      href: "/thing",
      label: "所有物品",
      icon: Package,
      exact: true
    },
    {
      href: "/thing/categories",
      label: "分类",
      icon: FolderTree
    },
    {
      href: "/thing/locations",
      label: "位置",
      icon: MapPin
    },
    {
      href: "/thing/tags",
      label: "标签",
      icon: Tag
    }
  ]
  
  // 检查当前路径是否激活
  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }
  
  // 获取当前活动项
  const getActiveItem = () => {
    return navItems.find(item => isActive(item)) || navItems[0]
  }
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative shadow-sm">
      {isMobile ? (
        // 移动端下拉菜单导航
        <div className="container flex items-center justify-between py-2 px-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1 w-full justify-between">
                <span className="flex items-center gap-1">
                  {(() => {
                    const activeItem = getActiveItem()
                    const Icon = activeItem.icon
                    return (
                      <>
                        <Icon className="h-4 w-4" />
                        <span>{activeItem.label}</span>
                      </>
                    )
                  })()}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link 
                      href={item.href}
                      className={isActive(item) ? "bg-accent text-accent-foreground" : ""}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        // 桌面端按钮导航
        <nav className="container flex items-center py-2 px-4 overflow-x-auto scrollbar-none">
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
                    <Icon className="h-4 w-4 mr-1" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
} 