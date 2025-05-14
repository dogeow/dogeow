"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { get, del } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { toast } from "react-hot-toast"
import { Trash2, Edit } from "lucide-react"
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
  const [loading, setLoading] = useState(false)
  
  // 获取笔记列表
  const { data: notes, error } = useSWR<Note[]>('/notes', get)
  
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
    if(content === null) {
      return '暂无内容'
    }

    // 移除Markdown格式
    const plainText =  content
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