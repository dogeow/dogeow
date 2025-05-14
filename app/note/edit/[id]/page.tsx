"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { get, put } from "@/utils/api"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"

// 使用动态导入SlateJS编辑器
const CodeHighlightEditor = dynamic(
  () => import('@/app/note/components/CodeHighlightEditor'),
  { ssr: false }
)

// 笔记类型
type Note = {
  id: number
  title: string
  content: string
  user_id: number
  created_at: string
  updated_at: string
}

export default function NoteEditPage() {
  const params = useParams()
  const router = useRouter()
  const noteId = params.id as string
  const [isLoading, setIsLoading] = useState(true)
  const [title, setTitle] = useState("")
  
  // 获取笔记数据
  const { data: note, error, mutate } = useSWR<Note>(`/notes/${noteId}`, get)
  
  // 如果笔记不存在，跳转到笔记列表页
  useEffect(() => {
    if (error) {
      console.error("加载笔记失败:", error)
      router.push("/note")
    } else if (note) {
      setTitle(note.title)
      setIsLoading(false)
    }
  }, [note, error, router])
  
  // 保存标题
  const saveTitle = async () => {
    if (!title.trim()) {
      toast.error("标题不能为空")
      return
    }
    
    try {
      const updatedNote = await put(`/notes/${noteId}`, { title })
      toast.success("标题已保存")
      if (note) {
        mutate({ ...note, title }, false)
      }
    } catch (error) {
      console.error("保存标题失败:", error)
      toast.error("保存标题失败")
    }
  }
  
  return (
    <div className="container mx-auto py-4">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link href="/note">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回笔记列表
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <p>加载笔记中...</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold max-w-md"
              placeholder="输入笔记标题"
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            />
            <Button onClick={saveTitle} variant="outline">保存标题</Button>
          </div>
          <CodeHighlightEditor noteId={parseInt(noteId)} initialContent={note?.content} />
        </div>
      )}
    </div>
  ) 
} 