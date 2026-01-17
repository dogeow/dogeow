import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { del } from '@/lib/api'

export function useNoteDelete(noteId: string | string[] | undefined) {
  const router = useRouter()

  const handleDelete = useCallback(async () => {
    if (!noteId || !window.confirm('确定要删除此笔记吗？')) return

    const id = Array.isArray(noteId) ? noteId[0] : noteId
    await del(`/notes/${id}`)
    toast.success('笔记已删除')
    router.push('/note')
  }, [noteId, router])

  return { handleDelete }
}
