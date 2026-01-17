'use client'

import useSWR from 'swr'
import { get } from '@/lib/api'
import { useParams } from 'next/navigation'
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

  if (error) return <div>加载失败</div>
  if (!note) return <div>加载中...</div>

  return (
    <div className="mx-auto mt-4 max-w-4xl">
      <NoteDetailHeader
        title={note.title}
        isDraft={note.is_draft}
        noteId={id}
        onDelete={handleDelete}
      />
      <div className="mb-4 text-center text-xs text-gray-500">
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
    </div>
  )
}
