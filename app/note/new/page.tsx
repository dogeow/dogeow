"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { post } from "@/utils/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"

// 使用动态导入，避免SSR时的错误
const MarkdownEditor = dynamic(
  () => import('@/app/note/components/MarkdownEditor'), 
  { ssr: false, loading: () => <p>加载编辑器中...</p> }
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

// 空笔记的初始内容
const INITIAL_CONTENT = ""

export default function NewNotePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [tempNoteId, setTempNoteId] = useState<number | null>(null)
  
  // 创建新笔记
  const createNote = async () => {
    if (!title.trim()) {
      toast.error("标题不能为空")
      return
    }
    
    setIsLoading(true)
    try {
      const newNote = await post<Note>('/notes', { 
        title,
        content: INITIAL_CONTENT
      })
      setTempNoteId(newNote.id)
      toast.success("笔记已创建，可以开始编辑内容")
    } catch (error) {
      console.error("创建笔记失败:", error)
      toast.error("创建笔记失败")
    } finally {
      setIsLoading(false)
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
      
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold"
            placeholder="输入笔记标题"
            disabled={isLoading || tempNoteId !== null}
          />
          {!tempNoteId && (
            <Button 
              onClick={createNote} 
              disabled={isLoading || !title.trim()}
            >
              {isLoading ? "创建中..." : "创建笔记"}
            </Button>
          )}
        </div>
        
        {tempNoteId ? (
          <MarkdownEditor 
            noteId={tempNoteId} 
            initialContent={INITIAL_CONTENT} 
          />
        ) : (
          <div className="border rounded-md p-4 min-h-[400px] flex items-center justify-center text-muted-foreground">
            <p>请先创建笔记，然后就可以编辑内容</p>
          </div>
        )}
      </div>
    </div>
  )
} 