'use client'

import { ProgressStats } from './components/ProgressStats'
import { CheckInCalendar } from './components/CheckInCalendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import {
  BookOpen,
  Settings,
  AlertCircle,
  CheckCircle2,
  PenLine,
  RotateCcw,
  Search,
} from 'lucide-react'
import { useWordSettings, useWordStats } from './hooks/useWord'
import { PageContainer } from '@/components/layout'

export default function WordPage() {
  const { data: settings } = useWordSettings()
  const { data: stats } = useWordStats()
  const hasSelectedBook = !!settings?.current_book_id
  const todayCheckedIn = stats?.today_checked_in ?? false

  return (
    <PageContainer maxWidth="2xl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">背单词</h1>
          {todayCheckedIn ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-900 dark:text-green-300">
              <CheckCircle2 className="h-3 w-3" />
              今日已打卡
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              <AlertCircle className="h-3 w-3" />
              今日未打卡
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/word/search">
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/word/settings">
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 未选择单词书提示 */}
      {!hasSelectedBook && settings !== undefined && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  请先选择单词书
                </p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  在设置中选择要学习的单词书后才能开始学习
                </p>
                <Link href="/word/settings">
                  <Button size="sm" variant="outline" className="mt-2">
                    去设置
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计数据 */}
      <ProgressStats />

      {/* 学习模式 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 开始学习按钮 */}
        <Link href="/word/learn">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <BookOpen className="text-primary h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{todayCheckedIn ? '继续学习' : '开始学习'}</h3>
                  <p className="text-muted-foreground text-sm">学习新单词 + 复习旧单词</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 复习模式 */}
        <Link href="/word/review">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                  <RotateCcw className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">复习模式</h3>
                  <p className="text-muted-foreground text-sm">复习已学过的单词</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* 例句填空 */}
        <Link href="/word/fill-blank">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                  <PenLine className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">例句填空</h3>
                  <p className="text-muted-foreground text-sm">根据例句拼写单词</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 打卡日历 */}
      <CheckInCalendar />
    </PageContainer>
  )
}
