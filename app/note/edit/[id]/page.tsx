"use client"

import { useState, useEffect } from 'react'
import { apiRequest } from '@/utils/api'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

// 使用dynamic import避免服务端渲染问题
const NoteEditor = dynamic(
  () => import('../../components/NoteEditor'),
  { ssr: false }
)

interface Note {
  id: number
  title: string
  content: string
}

// 笔记编辑页面
export default function EditNotePage() {
  const { id } = useParams()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clientReady, setClientReady] = useState(false)

  useEffect(() => {
    // 标记客户端组件已加载
    setClientReady(true)

    const fetchNote = async () => {
      try {
        const noteId = Array.isArray(id) ? id[0] : id
        const data = await apiRequest<Note>(`/notes/${noteId}`)
        setNote(data)
      } catch (err) {
        console.error('获取笔记失败', err)
        setError('无法加载笔记，请重试')
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [id])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse">
          <div className="h-8 w-1/3 mb-4 bg-gray-200 rounded"></div>
          <div className="h-64 w-full bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="container py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          找不到笔记
        </div>
      </div>
    )
  }

  return (
    <div className="container py-4">
      {clientReady && (
        <NoteEditor
          noteId={Number(id)}
          title={note.title}
          content={note.content}
          isEditing={true}
        />
      )}
    </div>
  )
} 