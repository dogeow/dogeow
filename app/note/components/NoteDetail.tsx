"use client"

import useSWR, { mutate } from "swr"
import { get, del } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { toast } from "react-hot-toast"
import { Edit, Trash2 } from "lucide-react"

export default function NoteDetail() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id
  const { data: note, error } = useSWR<{
    id: number
    title: string
    content: string
    updated_at: string
  }>(id ? `/notes/${id}` : null, get)

  const handleDelete = async () => {
    if (!window.confirm("确定要删除此笔记吗？")) return
    await del(`/notes/${id}`)
    toast.success("笔记已删除")
    router.push("/note")
  }

  if (error) return <div>加载失败</div>
  if (!note) return <div>加载中...</div>

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-4">
      <h1 className="text-2xl font-bold">{note.title}</h1>
      <div className="text-xs text-gray-500 mb-2">更新于 {note.updated_at}</div>
      <div className="prose">{note.content || "(无内容)"}</div>
      <div className="flex gap-2 mt-4">
        <Button onClick={() => router.push(`/note/edit/${id}`)}>
          <Edit className="h-4 w-4 mr-1" /> 编辑
        </Button>
        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4 mr-1" /> 删除
        </Button>
        <Button variant="outline" onClick={() => router.push("/note")}>返回列表</Button>
      </div>
    </div>
  )
} 