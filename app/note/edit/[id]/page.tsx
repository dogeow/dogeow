"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { get } from "@/utils/api"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

// 使用动态导入，避免SSR时的错误
const MarkdownEditorSimple = dynamic(
  () => import('@/app/note/components/MarkdownEditorSimple'), 
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
  
  // 获取笔记数据
  const { data: note, error } = useSWR<Note>(`/notes/${noteId}`, get)
  
  // 如果笔记不存在，跳转到笔记列表页
  useEffect(() => {
    if (error) {
      console.error("加载笔记失败:", error)
      router.push("/note")
    } else if (note) {
      setIsLoading(false)
    }
  }, [note, error, router])
  
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
          <h1 className="text-2xl font-bold mb-4">{note?.title}</h1>
          <MarkdownEditorSimple noteId={parseInt(noteId)} initialContent={note?.content} />
        </div>
      )}
    </div>
  )
} 