"use client"

import useSWR from "swr"
import { get, del } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Edit, Trash2, ArrowLeft, Lock } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function NoteDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const { data: note, error } = useSWR<{
    id: number
    title: string
    content: string
    content_markdown?: string
    updated_at: string
    is_draft: boolean
  }>(id ? `/notes/${id}` : null, get)

  const handleDelete = async () => {
    if (!window.confirm("确定要删除此笔记吗？")) return
    await del(`/notes/${id}`)
    toast.success("笔记已删除")
    router.push("/note")
  }

  // 格式化时间
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  if (error) return <div>加载失败</div>
  if (!note) return <div>加载中...</div>

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1 text-center truncate flex items-center justify-center">
          {note.title}
          {!!note.is_draft && (
            <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
          )}
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/note/edit/${id}`)}>
            <Edit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500 mb-4 text-center">更新于 {formatDate(note.updated_at)}</div>
      <div className="prose max-w-none">
        {note.content_markdown ? (
          <ReactMarkdown>{note.content_markdown}</ReactMarkdown>
        ) : (
          <span className="italic">(无内容)</span>
        )}
      </div>
    </div>
  )
} 