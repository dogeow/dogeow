'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useWordStats } from '../hooks/useWord'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, BookOpen, TrendingUp } from 'lucide-react'

export function ProgressStats() {
  const { data: stats, isLoading } = useWordStats()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* 已打卡天数 */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center">
              <Calendar className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{stats.check_in_days}</div>
            <p className="text-muted-foreground text-xs">打卡天数</p>
          </div>

          {/* 已学单词 */}
          <div className="border-x text-center">
            <div className="mb-1 flex items-center justify-center">
              <BookOpen className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{stats.learned_words_count}</div>
            <p className="text-muted-foreground text-xs">
              {stats.total_words > 0 ? `/ ${stats.total_words}` : '已学单词'}
            </p>
          </div>

          {/* 学习进度 */}
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center">
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </div>
            <div className="text-2xl font-bold">{stats.progress_percentage.toFixed(0)}%</div>
            <p className="text-muted-foreground text-xs">学习进度</p>
          </div>
        </div>

        {/* 进度条 */}
        {stats.total_words > 0 && (
          <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${Math.min(stats.progress_percentage, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
