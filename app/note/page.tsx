'use client'

import './note-styles.css'
import { useState, useEffect, useMemo, memo } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { Calendar, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState as UIEmptyState } from '@/components/ui/empty-state'
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

// 常量定义
const CONTENT_PREVIEW_MAX_LENGTH = 150
const SKELETON_ITEMS_COUNT = 3

// 工具函数
const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })
  } catch {
    return dateString
  }
}

const getContentPreview = (content: string, maxLength = CONTENT_PREVIEW_MAX_LENGTH): string => {
  if (!content) return ''

  const plainText = content
    .replace(/<[^>]*>/g, '')
    .replace(/[#*`>-]/g, '')
    .trim()

  return plainText.length > maxLength ? `${plainText.substring(0, maxLength)}...` : plainText
}

// 提取加载骨架屏组件
const LoadingSkeleton = memo(() => (
  <div className="animate-pulse space-y-4">
    {Array.from({ length: SKELETON_ITEMS_COUNT }, (_, i) => (
      <Card key={i} className="border p-0 dark:border-slate-700">
        <div className="mx-4 mt-4 mb-2 h-5 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mx-4 mb-4 h-4 w-1/4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mx-4 mb-1 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mx-4 mb-4 h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
      </Card>
    ))}
  </div>
))

LoadingSkeleton.displayName = 'LoadingSkeleton'

// 提取空状态组件
const EmptyState = memo(() => (
  <div className="py-12 text-center">
    <div className="text-muted-foreground">
      <div className="mb-4 text-4xl" role="img" aria-label="笔记图标">
        📝
      </div>
      <p className="mb-2 text-lg font-medium">暂无笔记</p>
      <p className="text-sm">请添加您的第一个笔记</p>
    </div>
  </div>
))

EmptyState.displayName = 'EmptyState'

// 提取笔记卡片组件
const NoteCard = memo(({ note }: { note: Note }) => (
  <Link href={`/note/${note.id}`} passHref legacyBehavior>
    <Card className="hover:border-primary cursor-pointer transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="flex items-center text-base font-medium hover:underline">
            {note.title || '(无标题)'}
            {note.is_draft && <Lock className="text-muted-foreground ml-2 h-4 w-4" />}
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
            <span>{getContentPreview(note.content_markdown)}</span>
          ) : (
            <span className="italic">(无内容)</span>
          )}
        </div>
      </CardContent>
    </Card>
  </Link>
))

NoteCard.displayName = 'NoteCard'

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

  // 使用 useMemo 优化排序性能
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime()
      const timeB = new Date(b.updated_at).getTime()
      return timeB - timeA
    })
  }, [notes])

  return (
    <div className="container mx-auto py-4">
      {/* 页面头部 */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-foreground text-xl font-semibold">笔记列表</h1>
        <div className="text-muted-foreground text-sm" aria-live="polite">
          共 {sortedNotes.length} 个笔记
        </div>
      </header>

      {/* 主要内容区域 */}
      <main>
        {loading ? (
          <LoadingSkeleton />
        ) : sortedNotes.length === 0 ? (
          <UIEmptyState icon="📝" title="暂无笔记" description="请添加您的第一个笔记" />
        ) : (
          <div className="space-y-4" role="list" aria-label="笔记列表">
            {sortedNotes.map(note => (
              <div key={note.id} role="listitem">
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        )}
      </main>

      <NoteSpeedDial />
    </div>
  )
}
