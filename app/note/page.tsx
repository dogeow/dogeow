"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { Calendar, Lock } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { 
  Card, 
  CardContent, 
  CardHeader
} from '@/components/ui/card'
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
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText
  }

  // 渲染加载状态
  const renderLoadingState = () => (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i} className="border p-0 dark:border-slate-700">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2 mx-4 mt-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4 mx-4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1 mx-4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mx-4 mb-4"></div>
        </Card>
      ))}
    </div>
  )

  // 渲染空状态
  const renderEmptyState = () => (
    <div className="text-center py-12 border rounded-md">
      <p className="text-muted-foreground mb-4">
        还没有创建任何笔记
      </p>
    </div>
  )

  // 渲染笔记卡片
  const renderNoteCard = (note: Note) => (
    <Link key={note.id} href={`/note/${note.id}`} passHref legacyBehavior>
      <Card 
        className="hover:shadow-md transition-all duration-200 hover:border-primary cursor-pointer"
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-lg hover:underline flex items-center">
              {note.title || '(无标题)'}
              {!!note.is_draft && (
                <Lock className="ml-2 h-4 w-4 text-muted-foreground" />
              )}
            </h3>
          </div>
          
          <div className="text-sm text-muted-foreground mt-1 flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            <span>更新于 {formatDate(note.updated_at)}</span>
          </div>
        </CardHeader>
        
        <CardContent className="py-2">
          <div className="text-sm text-muted-foreground prose prose-sm max-w-none">
            {note.content_markdown ? (
              <ReactMarkdown>
                {getMarkdownPreview(note.content_markdown)}
              </ReactMarkdown>
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
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">笔记列表</h1>
      </div>
      
      {loading ? (
        renderLoadingState()
      ) : sortedNotes.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          {sortedNotes.map(renderNoteCard)}
        </div>
      )}
      
      <NoteSpeedDial />
    </div>
  )
}