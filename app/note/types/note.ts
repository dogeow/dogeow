/**
 * Note 模块的类型定义
 */

export interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  created_at: string
  updated_at: string
  is_draft: boolean
}

export interface NoteListResponse {
  notes: Note[]
}

export type NoteFormData = Pick<Note, 'title' | 'content' | 'is_draft'>
