'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { useNoteLoader } from '../../hooks/useNoteLoader'
import { useNoteContent } from '../../hooks/useNoteContent'
import { useNoteShortcuts } from '../../hooks/useNoteShortcuts'
import { NoteEditorToolbar } from '../../components/NoteEditorToolbar'
import { NoteLoadingState } from '../../components/NoteLoadingState'
import { NoteErrorState } from '../../components/NoteErrorState'

// 使用dynamic import避免服务端渲染问题
const TailwindAdvancedEditor = dynamic(() => import('@/components/novel-editor'), { ssr: false })

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  is_draft: boolean
}

// 笔记编辑页面
export default function EditNotePage() {
  const { id } = useParams()
  const { note, loading, error } = useNoteLoader(id)
  const { getCurrentContent } = useNoteContent()
  const [clientReady, setClientReady] = useState(false)
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false) // 隐私状态

  useEffect(() => {
    // 标记客户端组件已加载
    setClientReady(true)

    if (note) {
      setTitle(note.title)
      setIsPrivate(note.is_draft) // 设置初始隐私状态
    }
  }, [note])

  // 切换隐私状态
  const handleTogglePrivacy = useCallback(async () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    const { content, markdown } = getCurrentContent()
    const newPrivacyStatus = !isPrivate

    try {
      setIsSaving(true)

      const data = {
        title: title.trim(),
        content,
        content_markdown: markdown,
        is_draft: newPrivacyStatus, // 私密状态对应 is_draft
      }

      const noteId = Array.isArray(id) ? id[0] : id
      await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)

      setIsPrivate(newPrivacyStatus)
      toast.success(newPrivacyStatus ? '已私密' : '已公开')
    } catch (error) {
      console.error('切换隐私状态错误:', error)
      toast.error('操作失败')
    } finally {
      setIsSaving(false)
    }
  }, [title, id, isPrivate, getCurrentContent])

  // 保存笔记
  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('请输入笔记标题')
      return
    }

    const { content, markdown } = getCurrentContent()

    try {
      setIsSaving(true)

      const data = {
        title: title.trim(),
        content,
        content_markdown: markdown,
        is_draft: isPrivate, // 保持当前隐私状态
      }

      const noteId = Array.isArray(id) ? id[0] : id
      await apiRequest<Note>(`/notes/${noteId}`, 'PUT', data)

      toast.success('笔记已更新')
    } catch (error) {
      console.error('保存笔记错误:', error)
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [title, id, isPrivate, getCurrentContent])

  // 添加快捷键支持
  useNoteShortcuts({
    title,
    isSaving,
    onSave: handleSave,
    onTogglePrivacy: handleTogglePrivacy,
  })

  if (loading) {
    return <NoteLoadingState />
  }

  if (error) {
    return <NoteErrorState message={error} variant="error" />
  }

  if (!note) {
    return <NoteErrorState message="找不到笔记" variant="warning" />
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-center">
        <div className="w-full max-w-screen-lg">
          <NoteEditorToolbar
            title={title}
            isPrivate={isPrivate}
            isSaving={isSaving}
            onTitleChange={setTitle}
            onSave={handleSave}
            onTogglePrivacy={handleTogglePrivacy}
          />

          {/* Novel 编辑器 */}
          {clientReady && <TailwindAdvancedEditor />}
        </div>
      </div>
    </div>
  )
}
