import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { apiRequest } from '@/lib/api'
import { normalizeNote } from '../utils/api'

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

interface UseNoteSaveOptions {
  noteId?: number
  isEditing: boolean
  draft: boolean
}

export function useNoteSave({ noteId, isEditing, draft }: UseNoteSaveOptions) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // 保存笔记内容
  const handleSave = useCallback(
    async (title: string, content: string) => {
      if (!title.trim()) {
        toast.error('请输入笔记标题')
        return
      }
      setIsSaving(true)
      const data = {
        title,
        content,
        is_draft: draft,
      }
      try {
        let result: Note | { note: Note }
        if (isEditing && noteId) {
          result = await apiRequest<Note | { note: Note }>(`/notes/${noteId}`, 'PUT', data)
        } else {
          result = await apiRequest<Note | { note: Note }>('/notes', 'POST', data)
        }
        const normalizedNote = normalizeNote<Note>(result)
        if (!normalizedNote) {
          throw new Error('保存笔记失败')
        }
        toast.success(isEditing ? '笔记已更新' : '笔记已创建')
        if (!isEditing && normalizedNote.id) {
          router.push(`/note/edit/${normalizedNote.id}`)
          router.refresh()
        }
        return Promise.resolve()
      } catch (error) {
        console.error('保存笔记错误:', error)
        toast.error('保存失败')
        return Promise.reject(error)
      } finally {
        setIsSaving(false)
      }
    },
    [noteId, draft, isEditing, router]
  )

  // 保存为草稿
  const saveDraft = useCallback(
    async (title: string, content: string) => {
      if (!title.trim()) {
        toast.error('请输入笔记标题')
        return
      }
      setIsSaving(true)
      const data = {
        title,
        content,
        is_draft: true,
      }
      try {
        if (isEditing && noteId) {
          await apiRequest<Note | { note: Note }>(`/notes/${noteId}`, 'PUT', data)
        } else {
          await apiRequest<Note | { note: Note }>('/notes', 'POST', data)
        }
        toast.success('已保存为草稿')
      } catch (error) {
        console.error('保存草稿失败:', error)
        toast.error('保存草稿失败')
      } finally {
        setIsSaving(false)
      }
    },
    [isEditing, noteId]
  )

  return { isSaving, handleSave, saveDraft }
}
