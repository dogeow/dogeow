"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Tag, FolderTree, Plus } from "lucide-react"
import { useState } from "react"

export default function NoteNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  
  // 导航项定义
  const navItems = [
    {
      href: "/note",
      label: "我的笔记",
      icon: FileText,
      exact: true
    },
    {
      href: "/note/categories",
      label: "分类",
      icon: FolderTree
    },
    {
      href: "/note/tags",
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
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative shadow-sm">
      <nav className="flex items-center py-4 px-4 overflow-x-auto">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/note/new">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link href="/note">
              <FileText className="h-4 w-4 mr-2" />
              我的笔记
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link href="/note/categories">
              <FolderTree className="h-4 w-4 mr-2" />
              分类
            </Link>
          </Button>
          
          <Button variant="ghost" size="sm" asChild>
            <Link href="/note/tags">
              <Tag className="h-4 w-4 mr-2" />
              标签
            </Link>
          </Button>
        </div>
      </nav>
    </div>
  )
} 