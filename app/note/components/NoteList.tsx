"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { get, post, del } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"
import { Plus, Trash2, Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

// 笔记类型定义
type Note = {
  id: number
  title: string
  content: string
  user_id: number
  created_at: string
  updated_at: string
}

export default function NoteList() {
  const router = useRouter()
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [loading, setLoading] = useState(false)
  
  // 获取笔记列表
  const { data: notes, error } = useSWR<Note[]>('/notes', get)
  
  // 创建新笔记
  const createNote = async () => {
    if (!newNoteTitle.trim()) {
      toast.error("请输入笔记标题")
      return
    }
    
    setLoading(true)
    try {
      const newNote = await post<Note>('/notes', {
        title: newNoteTitle,
        content: '# ' + newNoteTitle + '\n\n开始编辑你的新笔记吧！'
      })
      
      setIsNewNoteDialogOpen(false)
      setNewNoteTitle("")
      
      // 更新笔记列表缓存
      mutate('/notes')
      
      toast.success("笔记已创建")
      
      // 跳转到编辑页面
      router.push(`/note/edit/${newNote.id}`)
    } catch (error) {
      console.error("创建笔记失败:", error)
      toast.error("创建笔记失败")
    } finally {
      setLoading(false)
    }
  }
  
  // 删除笔记
  const deleteNote = async (id: number) => {
    if (!confirm("确定要删除此笔记吗？此操作不可撤销。")) {
      return
    }
    
    setLoading(true)
    try {
      await del(`/notes/${id}`)
      mutate('/notes')
      toast.success("笔记已删除")
    } catch (error) {
      console.error("删除笔记失败:", error)
      toast.error("删除笔记失败")
    } finally {
      setLoading(false)
    }
  }
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // 截取内容摘要
  const getExcerpt = (content: string) => {
    // 移除Markdown格式
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // 移除标题
      .replace(/\*\*|\*|~~|__/g, '') // 移除粗体、斜体等
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留链接文本
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/`([^`]+)`/g, '$1') // 移除行内代码
    
    return plainText.length > 100 
      ? plainText.substring(0, 100) + '...' 
      : plainText
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">我的笔记</h1>
        
        <Dialog open={isNewNoteDialogOpen} onOpenChange={setIsNewNoteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              新建笔记
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
      </div>
      
      {error && <p className="text-red-500">加载笔记失败</p>}
      {!notes && !error && <p>加载中...</p>}
      {notes?.length === 0 && <p>暂无笔记，请添加</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes?.map((note) => (
          <Card key={note.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span className="truncate">{note.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNote(note.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                更新于 {formatDate(note.updated_at)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2 flex-grow">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {getExcerpt(note.content)}
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/note/edit/${note.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  编辑笔记
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
} 