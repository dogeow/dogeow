import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { normalizeNote } from '../utils/api'

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

export function useNoteLoader(noteId: string | string[]) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNoteContent = useCallback((normalizedNote: Note) => {
    // 将笔记内容加载到 Novel 编辑器
    if (normalizedNote.content) {
      try {
        // 尝试解析内容，如果是有效的JSON则使用，否则创建默认内容
        const parsedContent = JSON.parse(normalizedNote.content)
        window.localStorage.setItem('novel-content', JSON.stringify(parsedContent))
      } catch {
        // 如果内容不是有效的JSON，创建包含文本的默认结构
        const defaultContent = {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: normalizedNote.content || '',
                },
              ],
            },
          ],
        }
        window.localStorage.setItem('novel-content', JSON.stringify(defaultContent))
      }
    }

    // 同时设置 markdown 内容
    if (normalizedNote.content_markdown) {
      window.localStorage.setItem('markdown', normalizedNote.content_markdown)
    }
  }, [])

  useEffect(() => {
    const fetchNote = async () => {
      try {
        const id = Array.isArray(noteId) ? noteId[0] : noteId
        const data = await apiRequest<Note | { note: Note }>(`/notes/${id}`)
        const normalizedNote = normalizeNote<Note>(data)
        if (!normalizedNote) {
          setError('无法加载笔记，请重试')
          return
        }
        setNote(normalizedNote)
        loadNoteContent(normalizedNote)
      } catch (err) {
        console.error('获取笔记失败', err)
        setError('无法加载笔记，请重试')
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [noteId, loadNoteContent])

  return { note, loading, error }
}
