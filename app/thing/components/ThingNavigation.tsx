"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Package, FolderTree, MapPin, Tag } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ThingNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  
  // 检查当前路径是否激活
  const isActive = (href: string, exact = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative shadow-sm">
      <nav className="flex items-center py-2 px-4 overflow-x-auto">
        <div className="flex items-center space-x-2">
          <Button
            variant={isActive("/thing", true) ? "default" : "ghost"}
            size="sm"
            className="whitespace-nowrap"
            asChild
          >
            <Link href="/thing">
              <Package className="h-4 w-4 mr-2" />
              所有物品
            </Link>
          </Button>
          
          <Button
            variant={isActive("/thing/categories") ? "default" : "ghost"}
            size="sm"
            className="whitespace-nowrap"
            asChild
          >
            <Link href="/thing/categories">
              <FolderTree className="h-4 w-4 mr-2" />
              分类
            </Link>
          </Button>
          
          <Button
            variant={isActive("/thing/locations") ? "default" : "ghost"}
            size="sm"
            className="whitespace-nowrap"
            asChild
          >
            <Link href="/thing/locations">
              <MapPin className="h-4 w-4 mr-2" />
              位置
            </Link>
          </Button>
          
          <Button
            variant={isActive("/thing/tags") ? "default" : "ghost"}
            size="sm"
            className="whitespace-nowrap"
            asChild
          >
            <Link href="/thing/tags">
              <Tag className="h-4 w-4 mr-2" />
              标签
            </Link>
          </Button>
        </div>
      </nav>
    </div>
  )
} 