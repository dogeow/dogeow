"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Tag, FolderTree, Plus } from "lucide-react"
import { useState } from "react"
import { useEditorStore } from '../store/editorStore'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function NoteNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const { isDirty, setDirty, saveDraft } = useEditorStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  
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
  
  // 统一跳转处理
  const handleNavigate = (href: string) => {
    if (isDirty && (pathname.startsWith('/note/new') || pathname.startsWith('/note/edit'))) {
      setPendingHref(href)
      setShowConfirm(true)
    } else {
      router.push(href)
    }
  }

  const handleConfirm = async () => {
    if (saveDraft) {
      await saveDraft()
    }
    setDirty(false)
    setShowConfirm(false)
    if (pendingHref) {
      router.push(pendingHref)
      setPendingHref(null)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
    setPendingHref(null)
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative shadow-sm">
      <nav className="flex items-center py-2 px-2 overflow-x-auto">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => handleNavigate('/note/new')}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleNavigate('/note')}>
            <FileText className="h-4 w-4 mr-2" />
            我的笔记
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleNavigate('/note/categories')}>
            <FolderTree className="h-4 w-4 mr-2" />
            分类
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleNavigate('/note/tags')}>
            <Tag className="h-4 w-4 mr-2" />
            标签
          </Button>
        </div>
      </nav>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="确认离开"
        description="您有未保存的内容，是否保存为草稿或继续跳转？"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="保存并跳转"
        cancelText="取消"
      />
    </div>
  )
} 