"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { FileText, Tag, FolderTree, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { post } from "@/utils/api"

export default function NoteNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')
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

  // 创建新笔记
  const createNote = async () => {
    if (!newNoteTitle.trim()) {
      toast.error('请输入笔记标题')
      return
    }
    
    setLoading(true)
    
    try {
      const newNote = await post('/api/notes', {
        title: newNoteTitle,
        content: '# ' + newNoteTitle + '\n\n开始编辑你的新笔记吧！'
      })
      
      setIsNewNoteDialogOpen(false)
      setNewNoteTitle('')
      toast.success('笔记已创建')
      
      // 刷新页面以显示新笔记
      router.refresh()
    } catch (error) {
      console.error('创建笔记失败:', error)
      toast.error('创建笔记失败')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <nav className="container flex items-center py-2 px-4 overflow-x-auto">
        <div className="flex items-center space-x-1 md:space-x-2">
          <Dialog open={isNewNoteDialogOpen} onOpenChange={setIsNewNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="mr-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">新建笔记</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建笔记</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="笔记标题"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewNoteDialogOpen(false)}
                >
                  取消
                </Button>
                <Button 
                  onClick={createNote}
                  disabled={loading || !newNoteTitle.trim()}
                >
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
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
                  <span className="ml-1">{item.label}</span>
                </Link>
              </Button>
            )
          })}
        </div>
      </nav>
    </div>
  )
} 