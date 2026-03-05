'use client'

import './note-styles.css'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { List, Network, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout'
import NoteSpeedDial from './components/NoteSpeedDial'
import GraphView from './components/GraphView'
import { normalizeNotes } from './utils/api'
import { getWikiGraph } from '@/lib/api/wiki'
import { hasNoteContent } from './utils/noteUtils'
import type { Note } from './types/note'
import NoteLoadingSkeleton from './components/NoteLoadingSkeleton'
import NoteEmptyState from './components/NoteEmptyState'
import NoteCard from './components/NoteCard'
import NotePageGraphToolbar from './components/NotePageGraphToolbar'

type ViewMode = 'list' | 'graph'

function ViewModeSwitch({
  viewMode,
  onChangeMode,
  listCount,
  graphCount,
}: {
  viewMode: ViewMode
  onChangeMode: (mode: ViewMode) => void
  listCount: number
  graphCount: number
}) {
  return (
    <div
      className="border-border bg-card flex items-center gap-2 rounded-lg border p-1"
      role="tablist"
      aria-label="视图切换"
    >
      <button
        role="tab"
        aria-selected={viewMode === 'list'}
        onClick={() => onChangeMode('list')}
        className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
          viewMode === 'list'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <List className="h-4 w-4 flex-shrink-0" />
        <span>列表({listCount})</span>
      </button>
      <button
        role="tab"
        aria-selected={viewMode === 'graph'}
        onClick={() => onChangeMode('graph')}
        className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
          viewMode === 'graph'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Network className="h-4 w-4 flex-shrink-0" />
        <span>图谱({graphCount})</span>
      </button>
    </div>
  )
}

export default function NotePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [graphQuery, setGraphQuery] = useState<string>('')
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false)
  const [graphNodeCount, setGraphNodeCount] = useState<number>(0)
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
        setNotes([])
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [])

  // 获取图谱节点数量
  const fetchGraphNodeCount = useCallback(async () => {
    try {
      const graphData = await getWikiGraph()
      setGraphNodeCount(graphData.nodes.length)
    } catch (error) {
      console.error('获取图谱数据失败:', error)
      setGraphNodeCount(0)
    }
  }, [])

  // 初始化时获取图谱节点数量
  useEffect(() => {
    fetchGraphNodeCount()
  }, [fetchGraphNodeCount])

  // 切换到图谱视图时刷新节点数量
  useEffect(() => {
    if (viewMode === 'graph') {
      fetchGraphNodeCount()
    }
  }, [viewMode, fetchGraphNodeCount])

  // 使用 useMemo 优化排序性能
  const sortedNotes = useMemo(() => {
    if (!Array.isArray(notes)) {
      return []
    }
    return [...notes].sort((a, b) => {
      const timeA = new Date(a.updated_at).getTime()
      const timeB = new Date(b.updated_at).getTime()
      return timeB - timeA
    })
  }, [notes])

  // 计算有内容的笔记数量
  const notesWithContent = useMemo(() => {
    return sortedNotes.filter(hasNoteContent)
  }, [sortedNotes])

  const notesWithContentCount = notesWithContent.length

  // 渲染图谱视图
  if (viewMode === 'graph') {
    return (
      <PageContainer>
        <header className="mb-6 flex min-w-0 items-center gap-4 overflow-hidden">
          <ViewModeSwitch
            viewMode={viewMode}
            onChangeMode={setViewMode}
            listCount={notesWithContentCount}
            graphCount={graphNodeCount}
          />

          <div className="flex min-w-0 flex-1 items-center gap-2">
            {!isSearchExpanded && (
              <NotePageGraphToolbar
                onNewNode={() => {
                  graphNewNodeRef.current?.()
                }}
                onCreateLink={() => {
                  graphCreateLinkRef.current?.()
                }}
              />
            )}

            <div className="flex max-w-full min-w-0 flex-1 items-center justify-end">
              {isSearchExpanded ? (
                <div className="flex w-full max-w-full min-w-0 items-center gap-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={graphQuery}
                    onChange={e => setGraphQuery(e.target.value)}
                    placeholder="搜索"
                    aria-label="搜索图谱节点"
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
                      aria-label="清空搜索内容"
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
                    aria-label="关闭搜索"
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
                  aria-label="搜索图谱"
                >
                  <Search className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        <main>
          <GraphView
            query={graphQuery}
            onNewNodeRef={graphNewNodeRef}
            onCreateLinkRef={graphCreateLinkRef}
          />
        </main>
      </PageContainer>
    )
  }

  // 渲染列表视图
  return (
    <PageContainer>
      <header className="mb-6 flex min-w-0 items-center gap-4 overflow-hidden">
        <ViewModeSwitch
          viewMode={viewMode}
          onChangeMode={setViewMode}
          listCount={notesWithContentCount}
          graphCount={graphNodeCount}
        />
      </header>

      <main>
        {loading ? (
          <NoteLoadingSkeleton />
        ) : notesWithContentCount === 0 ? (
          <NoteEmptyState />
        ) : (
          <div className="space-y-4" role="list" aria-label="笔记列表">
            {notesWithContent.map(note => (
              <div key={note.id} role="listitem">
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        )}
      </main>

      <NoteSpeedDial />
    </PageContainer>
  )
}
