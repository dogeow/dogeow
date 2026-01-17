'use client'

import './note-styles.css'
import { useState, useEffect, useMemo, memo, useRef } from 'react'
import Link from 'next/link'
import { apiRequest } from '@/lib/api'
import { Calendar, Lock, List, Network, Plus, Link as LinkIcon, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState as UIEmptyState } from '@/components/ui/empty-state'
import { zhCN } from 'date-fns/locale'
import NoteSpeedDial from './components/NoteSpeedDial'
import GraphView from './components/GraphView'
import { normalizeNotes } from './utils/api'

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

// 图谱工具栏组件
const GraphViewToolbar = memo(
  ({ onNewNode, onCreateLink }: { onNewNode: () => void; onCreateLink: () => void }) => {
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
      const checkAdmin = () => {
        const { isAdminSync } = require('@/lib/auth')
        setIsAdmin(isAdminSync())
      }
      checkAdmin()
    }, [])

    if (!isAdmin) return null

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onNewNode}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500 text-white transition-colors hover:bg-green-600"
          title="新建节点"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={onCreateLink}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-white transition-colors hover:bg-purple-600"
          title="创建链接"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      </div>
    )
  }
)

GraphViewToolbar.displayName = 'GraphViewToolbar'

type ViewMode = 'list' | 'graph'

export default function NotePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [graphQuery, setGraphQuery] = useState<string>('')
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false)
  const graphNewNodeRef = useRef<(() => void) | null>(null)
  const graphCreateLinkRef = useRef<(() => void) | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // 获取笔记列表
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await apiRequest<Note[] | { notes: Note[] }>('/notes')
        setNotes(normalizeNotes<Note>(data))
      } catch (error) {
        console.error('获取笔记列表失败:', error)
        toast.error('无法加载笔记列表')
        // 发生错误时设置为空数组
        setNotes([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [])

  // 使用 useMemo 优化排序性能
  const sortedNotes = useMemo(() => {
    // 确保 notes 是数组，如果不是则返回空数组
    if (!Array.isArray(notes)) {
      return []
    }
    return [...notes].sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime()
      const timeB = new Date(b.updated_at).getTime()
      return timeB - timeA
    })
  }, [notes])

  return (
    <div className="container mx-auto py-4">
      {/* 页面头部 */}
      <header className="mb-6 flex min-w-0 items-center gap-4 overflow-hidden">
        {/* 视图切换按钮 - 最左侧 */}
        <div className="border-border bg-card flex items-center gap-2 rounded-lg border p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="h-4 w-4 flex-shrink-0" />
            <span>列表</span>
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
              viewMode === 'graph'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Network className="h-4 w-4 flex-shrink-0" />
            <span>图谱</span>
          </button>
        </div>

        {/* 图谱模式下的工具栏 */}
        {viewMode === 'graph' && (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* 新建节点和创建链接按钮 - 中间（搜索展开时隐藏） */}
            {!isSearchExpanded && (
              <GraphViewToolbar
                onNewNode={() => {
                  graphNewNodeRef.current?.()
                }}
                onCreateLink={() => {
                  graphCreateLinkRef.current?.()
                }}
              />
            )}

            {/* 搜索框 - 展开时占用按钮空间 */}
            <div className="flex max-w-full min-w-0 flex-1 items-center justify-end">
              {isSearchExpanded ? (
                <div className="flex w-full max-w-full min-w-0 items-center gap-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={graphQuery}
                    onChange={e => setGraphQuery(e.target.value)}
                    placeholder="搜索"
                    className="border-border bg-card text-foreground focus:ring-primary max-w-full min-w-0 flex-1 rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:outline-none"
                    autoFocus
                  />
                  {graphQuery && (
                    <button
                      onClick={() => {
                        setGraphQuery('')
                        searchInputRef.current?.focus()
                      }}
                      className="border-border bg-card text-foreground hover:bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors"
                      title="清空"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsSearchExpanded(false)
                      setGraphQuery('')
                    }}
                    className="border-border bg-card text-foreground hover:bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors"
                    title="关闭搜索"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsSearchExpanded(true)
                    setTimeout(() => searchInputRef.current?.focus(), 100)
                  }}
                  className="border-border bg-card text-foreground hover:bg-muted flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border transition-colors"
                  title="搜索"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 列表模式下的笔记数量 */}
        {viewMode === 'list' && (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-muted-foreground text-sm" aria-live="polite">
              共 {sortedNotes.length} 个笔记
            </div>
          </div>
        )}
      </header>

      {/* 主要内容区域 */}
      <main>
        {viewMode === 'graph' ? (
          <GraphView
            query={graphQuery}
            onNewNodeRef={graphNewNodeRef}
            onCreateLinkRef={graphCreateLinkRef}
          />
        ) : loading ? (
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

      {viewMode === 'list' && <NoteSpeedDial />}
    </div>
  )
}
