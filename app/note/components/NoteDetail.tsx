'use client'

import useSWR from 'swr'
import { get, del } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Edit, Trash2, ArrowLeft, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import ReadonlyEditor from '@/components/novel-editor/readonly'

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
    if (!window.confirm('确定要删除此笔记吗？')) return
    await del(`/notes/${id}`)
    toast.success('笔记已删除')
    router.push('/note')
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
    <div className="mx-auto mt-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex flex-1 items-center justify-center truncate text-center text-xl font-bold">
          {note.title}
          {!!note.is_draft && <Lock className="text-muted-foreground ml-2 h-4 w-4" />}
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/note/edit/${id}`)}>
            <Edit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="text-destructive h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="mb-4 text-center text-xs text-gray-500">
        更新于 {formatDate(note.updated_at)}
      </div>
      <div className="max-w-none">
        {note.content ? (
          (() => {
            try {
              const parsedContent = JSON.parse(note.content)
              return <ReadonlyEditor content={parsedContent} />
            } catch (error) {
              console.error('Failed to parse note content:', error)
              return (
                <div className="prose max-w-none">
                  <span className="text-red-500 italic">(内容格式错误)</span>
                </div>
              )
            }
          })()
        ) : (
          <div className="prose max-w-none">
            <span className="italic">(无内容)</span>
          </div>
        )}
      </div>
    </div>
  )
}
