'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  useBook,
  useBookWordsInfinite,
  useWordSettings,
  updateWordSettings,
  type WordFilter,
} from '../../hooks/useWord'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ArrowLeft, Check } from 'lucide-react'
import { toast } from 'sonner'
import { mutate } from 'swr'
import { PageContainer } from '@/components/layout'

const WORD_FILTERS: { value: WordFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'mastered', label: '已学会' },
  { value: 'difficult', label: '困难词' },
  { value: 'simple', label: '简单词' },
]

export default function BookDetailPage() {
  const params = useParams()
  const bookId = params.id ? Number(params.id) : null

  const [filter, setFilter] = useState<WordFilter>('all')
  const [isSelecting, setIsSelecting] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { data: book, isLoading: bookLoading } = useBook(bookId ?? 0)
  const { data: settings } = useWordSettings()
  const isCurrentBook = settings?.current_book_id === bookId

  const handleSelectBook = async () => {
    if (!bookId || isCurrentBook) return
    setIsSelecting(true)
    try {
      await updateWordSettings({ current_book_id: bookId })
      toast.success('已选择此单词书')
      mutate('/word/settings')
      mutate('/word/stats')
    } catch (error) {
      toast.error('选择失败')
      console.error('选择单词书失败:', error)
    } finally {
      setIsSelecting(false)
    }
  }
  const {
    words,
    isLoading: wordsLoading,
    isLoadingMore,
    isReachingEnd,
    total,
    loadMore,
  } = useBookWordsInfinite(bookId, 30, filter)

  // 无限滚动 - Intersection Observer
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries
      if (target.isIntersecting && !isLoadingMore && !isReachingEnd) {
        loadMore()
      }
    },
    [isLoadingMore, isReachingEnd, loadMore]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    const container = scrollContainerRef.current
    if (!element || !container) return

    const observer = new IntersectionObserver(handleObserver, {
      root: container,
      rootMargin: '100px',
      threshold: 0,
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [handleObserver])

  if (bookLoading) {
    return (
      <PageContainer maxWidth="2xl" className="py-6">
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </PageContainer>
    )
  }

  if (!book) {
    return (
      <PageContainer maxWidth="2xl" className="py-6">
        <div className="py-12 text-center">
          <p className="text-muted-foreground">单词书不存在</p>
          <Link href="/word/settings">
            <Button variant="link">返回设置</Button>
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col overflow-hidden px-3 py-4 sm:px-4"
      style={{ height: 'calc(100dvh - var(--app-header-height))' }}
    >
      {/* 标题栏 */}
      <div className="flex shrink-0 items-center gap-4">
        <Link href="/word/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="flex-1 text-2xl font-bold tracking-tight">{book.name}</h1>
        {isCurrentBook ? (
          <span className="text-primary flex items-center gap-1 text-sm">
            <Check className="h-4 w-4" />
            当前
          </span>
        ) : (
          <Button variant="outline" size="sm" onClick={handleSelectBook} disabled={isSelecting}>
            {isSelecting ? <LoadingSpinner className="h-4 w-4" /> : '选择此书'}
          </Button>
        )}
      </div>

      {/* 筛选按钮 */}
      <div className="flex shrink-0 flex-wrap gap-2 py-3">
        {WORD_FILTERS.map(f => (
          <Button
            key={f.value}
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
        {total > 0 && (
          <span className="text-muted-foreground ml-auto self-center text-sm">{total} 个</span>
        )}
      </div>

      {/* 单词列表 - 可滚动区域 */}
      <Card className="flex min-h-0 flex-1 flex-col">
        <CardContent ref={scrollContainerRef} className="min-h-0 flex-1 overflow-y-auto py-4">
          {wordsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner className="h-6 w-6" />
            </div>
          ) : words.length > 0 ? (
            <div className="space-y-1">
              {words.map(word => (
                <div
                  key={word.id}
                  className="hover:bg-accent/50 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                >
                  <span className="min-w-[80px] shrink-0 font-medium">{word.content}</span>
                  {word.phonetic_us && (
                    <span className="text-muted-foreground shrink-0 text-sm">
                      {word.phonetic_us}
                    </span>
                  )}
                  {word.education_levels && word.education_levels.length > 0 && (
                    <div className="flex shrink-0 gap-1">
                      {word.education_levels.map(level => (
                        <span
                          key={level.id}
                          className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-xs font-medium"
                        >
                          {level.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {word.explanation?.zh && (
                    <span className="text-muted-foreground truncate text-sm whitespace-pre-line">
                      {word.explanation.zh.split('\n')[0]}
                    </span>
                  )}
                </div>
              ))}

              {/* 加载更多触发器 */}
              <div ref={loadMoreRef} className="flex justify-center py-4">
                {isLoadingMore ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : isReachingEnd ? (
                  <span className="text-muted-foreground text-sm">已加载全部</span>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center">
              {filter === 'all'
                ? '暂无单词'
                : filter === 'mastered'
                  ? '暂无已学会的单词'
                  : '暂无困难词'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
