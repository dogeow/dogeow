'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { Calendar, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { zhCN } from 'date-fns/locale'
import NoteSpeedDial from './components/NoteSpeedDial'

interface Note {
  id: number
  title: string
  content: string
  content_markdown: string
  created_at: string
  updated_at: string
  is_draft: boolean
}

export default function NotePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  // 获取笔记列表
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await apiRequest<Note[]>('/notes')
        setNotes(data)
      } catch (error) {
        console.error('获取笔记列表失败:', error)
        toast.error('无法加载笔记列表')
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [])

  // 按更新时间排序笔记（最新的在前面）
  const sortedNotes = notes.sort((a, b) => {
    const valueA = new Date(a.updated_at).getTime()
    const valueB = new Date(b.updated_at).getTime()
    return valueB - valueA
  })

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
    } catch {
      return dateString
    }
  }

  // 获取Markdown摘要
  const getMarkdownPreview = (markdown: string, maxLength = 150) => {
    if (!markdown) return ''

    // 移除Markdown语法字符
    const plainText = markdown.replace(/[#*`>-]/g, '').trim()
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText
  }

  // 渲染加载状态
  const renderLoadingState = () => (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i} className="border p-0 dark:border-slate-700">
          <div className="mx-4 mt-4 mb-2 h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="mx-4 mb-4 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="mx-4 mb-1 h-3 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
          <div className="mx-4 mb-4 h-3 w-full rounded bg-gray-200 dark:bg-gray-700"></div>
        </Card>
      ))}
    </div>
  )

  // 渲染空状态
  const renderEmptyState = () => (
    <div className="py-12 text-center">
      <div className="text-muted-foreground">
        <div className="mb-4 text-4xl">📝</div>
        <p className="mb-2 text-lg font-medium">暂无笔记</p>
        <p className="text-sm">请添加您的第一个笔记</p>
      </div>
    </div>
  )

  // 渲染笔记卡片
  const renderNoteCard = (note: Note) => (
    <Link key={note.id} href={`/note/${note.id}`} passHref legacyBehavior>
      <Card className="hover:border-primary cursor-pointer transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <h3 className="flex items-center text-base font-medium hover:underline">
              {note.title || '(无标题)'}
              {!!note.is_draft && <Lock className="text-muted-foreground ml-2 h-4 w-4" />}
            </h3>
          </div>

          <div className="text-muted-foreground mt-1 flex items-center text-sm">
            <Calendar className="mr-1 h-3 w-3" />
            <span>更新于 {formatDate(note.updated_at)}</span>
          </div>
        </CardHeader>

        <CardContent className="py-2">
          <div className="text-muted-foreground prose prose-sm max-w-none text-sm">
            {note.content_markdown ? (
              <ReactMarkdown>{getMarkdownPreview(note.content_markdown)}</ReactMarkdown>
            ) : (
              <span className="italic">(无内容)</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )

  return (
    <div className="container mx-auto py-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-foreground text-xl font-semibold">笔记列表</h2>
        <div className="text-muted-foreground text-sm">共 {sortedNotes.length} 个笔记</div>
      </div>

      {loading ? (
        renderLoadingState()
      ) : sortedNotes.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">{sortedNotes.map(renderNoteCard)}</div>
      )}

      <NoteSpeedDial />
    </div>
  )
}
