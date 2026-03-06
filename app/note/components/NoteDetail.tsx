'use client'

import useSWR from 'swr'
import { get } from '@/lib/api'
import { useParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { normalizeNote } from '../utils/api'
import { renderNoteContent } from '../utils/noteContentRenderer'
import { formatNoteDate } from '../utils/noteDateFormat'
import { useNoteDelete } from '../hooks/useNoteDelete'
import { NoteDetailHeader } from './NoteDetailHeader'

interface Note {
  id: number
  title: string
  content: string
  content_markdown?: string
  updated_at: string
  is_draft: boolean
}

export default function NoteDetail() {
  const params = useParams()
  const id = params?.id
  const { data: noteResponse, error } = useSWR<Note | { note: Note }>(
    id ? `/notes/${id}` : null,
    get
  )

  const note = normalizeNote<Note>(noteResponse)
  const { handleDelete } = useNoteDelete(id)

  if (error) {
    return (
      <PageContainer maxWidth="4xl">
        <EmptyState
          icon={<AlertCircle className="h-10 w-10 text-red-500" />}
          title="加载失败"
          description="无法加载笔记内容，请稍后重试。"
          action={{ label: '返回列表', onClick: () => window.history.back() }}
        />
      </PageContainer>
    )
  }

  if (!note) {
    return (
      <PageContainer maxWidth="4xl">
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </PageContainer>
    )
  }

  // 临时修复：移除标题末尾的"0"（如果存在的话）
  const cleanTitle = note.title?.replace(/0$/, '') || '(无标题)'

  return (
    <PageContainer maxWidth="4xl">
      <NoteDetailHeader
        title={cleanTitle}
        isDraft={note.is_draft}
        noteId={id}
        onDelete={handleDelete}
      />
      <div className="text-muted-foreground mb-4 text-center text-xs">
        更新于 {formatNoteDate(note.updated_at)}
      </div>
      <div className="max-w-none">
        {note.content ? (
          renderNoteContent(note.content)
        ) : (
          <div className="prose max-w-none py-8">
            <span className="italic">(无内容)</span>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
