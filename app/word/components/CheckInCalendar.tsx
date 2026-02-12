'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  useCheckInCalendar,
  useYearCheckInCalendar,
  useLast365CheckInCalendar,
} from '../hooks/useWord'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { format, startOfMonth, addMonths, subMonths, addDays, subDays, startOfWeek } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function CheckInCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const [viewMode, setViewMode] = useState<'month' | 'year' | 'last365'>('month')
  const [fitOneScreen, setFitOneScreen] = useState(true)

  const { data: calendarData, isLoading: loadingMonth } = useCheckInCalendar(year, month)
  const { data: yearCalendarData, isLoading: loadingYear } = useYearCheckInCalendar(year)
  const { data: last365CalendarData, isLoading: loadingLast365 } = useLast365CheckInCalendar()

  const isLoading =
    viewMode === 'month' ? loadingMonth : viewMode === 'year' ? loadingYear : loadingLast365

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  // 渲染贡献图（类似 GitHub）——按周列展示近 365 天
  function renderContributionGraph(
    days: {
      date: string
      checked: boolean
      new_words_count?: number
      review_words_count?: number
    }[],
    fillHeight = false,
    range?: { start_date: string; end_date: string }
  ) {
    const m = new Map<string, (typeof days)[0]>()
    days.forEach(d => m.set(d.date, d))

    function colorFor(dayObj?: (typeof days)[0]) {
      if (!dayObj) return '#ebedf0'
      const activity =
        (dayObj.new_words_count || 0) + (dayObj.review_words_count || 0) + (dayObj.checked ? 1 : 0)
      if (activity === 0) return '#ebedf0'
      if (activity === 1) return '#c6e48b'
      if (activity <= 3) return '#7bc96f'
      return '#239a3b'
    }

    const cellStyle = (bg: string) => ({ background: bg, borderRadius: 3 })

    if (fillHeight) {
      // 全屏模式：整体填满屏幕（矩形），今天第一行第一个，按行延伸至 365 天前，无横向滚动
      const today = new Date()
      const dateList: Date[] = []
      for (let i = 0; i < 365; i++) {
        dateList.push(subDays(today, i))
      }
      const cols = 20
      const rows = Math.ceil(365 / cols)

      return (
        <div className="h-full min-h-0 p-4">
          <div
            className="grid h-full min-h-[120px] w-full gap-px"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {dateList.map(d => {
              const dateStr = format(d, 'yyyy-MM-dd')
              const dayObj = m.get(dateStr)
              const bg = colorFor(dayObj)
              return (
                <div
                  key={dateStr}
                  title={`${dateStr}${dayObj ? ` — ${(dayObj.new_words_count || 0) + (dayObj.review_words_count || 0)}` : ''}`}
                  style={cellStyle(bg)}
                  className="h-full min-h-0 w-full min-w-0"
                />
              )
            })}
            {Array.from({ length: cols * rows - 365 }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={cellStyle('#ebedf0')}
                className="h-full min-h-0 w-full min-w-0"
              />
            ))}
          </div>
        </div>
      )
    }

    // 非全屏模式：按周列展示（原逻辑）
    const start = range ? new Date(range.start_date) : new Date(days[0]?.date ?? '')
    const end = range ? new Date(range.end_date) : new Date(days[days.length - 1]?.date ?? '')
    if (days.length === 0 && !range) return null
    const startSunday = startOfWeek(start, { weekStartsOn: 0 })

    const weeks: Date[][] = []
    let cursor = new Date(startSunday)
    while (cursor <= end) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cursor))
        cursor = addDays(cursor, 1)
      }
      weeks.push(week)
    }

    return (
      <div className="overflow-auto">
        <div className="flex items-start gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map(d => {
                const dateStr = format(d, 'yyyy-MM-dd')
                const dayObj = m.get(dateStr)
                const bg = colorFor(dayObj)
                return (
                  <div
                    key={dateStr}
                    title={`${dateStr}${dayObj ? ` — ${(dayObj.new_words_count || 0) + (dayObj.review_words_count || 0)}` : ''}`}
                    style={{ width: 12, height: 12, ...cellStyle(bg) }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  // 打开年/近365视图时禁止背景滚动，关闭时恢复
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (viewMode === 'year' || viewMode === 'last365') {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [viewMode])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (viewMode === 'month' && !calendarData) return null
  if (viewMode === 'year' && !yearCalendarData) return null
  if (viewMode === 'last365' && !last365CalendarData) return null

  function buildDayMap(
    days: { date: string; checked: boolean; new_words_count: number; review_words_count: number }[]
  ) {
    const m = new Map<string, (typeof days)[0]>()
    days.forEach(d => m.set(d.date, d))
    return m
  }

  // 渲染某个月小日历
  function renderMonthMini(
    monthDate: Date,
    dayMap: Map<string, any>,
    monthLabel?: string,
    compact = false
  ) {
    const y = monthDate.getFullYear()
    const mIndex = monthDate.getMonth()
    const monthStart = startOfMonth(monthDate)
    const firstDay = monthStart.getDay()
    const daysInMonth = new Date(y, mIndex + 1, 0).getDate()

    const calendarDays: (any | null)[] = []
    for (let i = 0; i < firstDay; i++) calendarDays.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(mIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      calendarDays.push(dayMap.get(dateStr) ?? { date: dateStr, checked: false })
    }

    // compact 模式使用固定高度行和更小字号，避免文字换行造成重叠
    return (
      <div key={`${y}-${mIndex}`} className={`${compact ? 'mb-2 overflow-hidden' : 'mb-4'}`}>
        <div className={`${compact ? 'text-xs' : 'text-sm'} mb-1 font-medium`}>
          {monthLabel ?? format(monthDate, 'yyyy年M月', { locale: zhCN })}
        </div>
        <div
          className={`grid grid-cols-7 ${compact ? 'gap-0.5' : 'gap-0.5'}`}
          style={compact ? { gridAutoRows: '1.4rem' } : {}}
        >
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div
              key={day}
              className={`text-muted-foreground ${compact ? 'py-0.5 text-[10px] leading-tight' : 'py-1 text-xs'} text-center font-medium`}
            >
              {day}
            </div>
          ))}
          {calendarDays.map((day, idx) => {
            if (!day)
              return (
                <div
                  key={`empty-${idx}`}
                  className={compact ? undefined : 'aspect-square'}
                  style={compact ? { height: '1.4rem' } : undefined}
                />
              )

            const date = new Date(day.date)
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

            if (compact) {
              return (
                <div
                  key={day.date}
                  style={{
                    height: '1.4rem',
                    lineHeight: '1.4rem',
                    fontSize: '9px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                  className={`relative flex items-center justify-center rounded ${isToday ? 'ring-primary ring-1 ring-offset-1' : ''}`}
                >
                  <span>{date.getDate()}</span>
                  {day.checked && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '62%',
                        border: '1px solid white',
                      }}
                      className="absolute z-10 rounded-full bg-green-500"
                    />
                  )}
                </div>
              )
            }

            // non-compact (月视图) 恢复为原始样式：方形格子、竖向布局、较大标记
            return (
              <div
                key={day.date}
                className={`flex aspect-square flex-col items-center justify-center rounded text-xs ${
                  isToday ? 'ring-primary ring-1 ring-offset-1' : ''
                }`}
              >
                <span>{date.getDate()}</span>
                {day.checked && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-green-500" />}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const dayMapAll =
    viewMode === 'month'
      ? buildDayMap(calendarData?.calendar ?? [])
      : viewMode === 'year'
        ? buildDayMap(yearCalendarData?.calendar ?? [])
        : buildDayMap(last365CalendarData?.calendar ?? [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {viewMode === 'month' && format(currentDate, 'yyyy年M月', { locale: zhCN })}
            {viewMode === 'year' && `${year}年`}
            {viewMode === 'last365' && `近 365 天`}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {viewMode === 'month' && <div>{renderMonthMini(currentDate, dayMapAll)}</div>}

        {/* 年视图与近365天视图使用全屏覆盖展示 */}
        {viewMode === 'year' &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className={`fixed inset-0 z-[9999] bg-white`}
              style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', minHeight: '100vh' }}
            >
              <div className="absolute top-3 right-4 left-4 flex items-center">
                <div className="text-lg font-semibold">{year} 年 — 完整日历</div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-0"
                  onClick={() => setViewMode('month')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {(() => {
                const count = 12
                const cols = 3 // 强制一行显示 3 列，以便截图时每行仅 3 个月
                const gridStyle = fitOneScreen
                  ? {
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      height: 'calc(100vh - 72px)',
                    }
                  : {}
                return (
                  <div
                    className={`grid ${fitOneScreen ? 'gap-1' : 'gap-6'}`}
                    style={{ paddingTop: 56, paddingLeft: 0, paddingRight: 0, ...gridStyle } as any}
                  >
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <div key={idx} className={`rounded border ${fitOneScreen ? 'p-1' : 'p-3'}`}>
                        {renderMonthMini(
                          new Date(year, idx, 1),
                          dayMapAll,
                          undefined,
                          fitOneScreen
                        )}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>,
            document.body
          )}

        {viewMode === 'last365' &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              className="fixed inset-0 z-[9999] flex flex-col bg-white"
              style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', minHeight: '100vh' }}
            >
              <div className="flex flex-shrink-0 items-center px-4 pt-3 pb-2">
                <div className="text-lg font-semibold">近 365 天 — 完整日历</div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto"
                  onClick={() => setViewMode('month')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1">
                {renderContributionGraph(
                  last365CalendarData?.calendar ?? [],
                  true,
                  last365CalendarData
                    ? {
                        start_date: last365CalendarData.start_date,
                        end_date: last365CalendarData.end_date,
                      }
                    : undefined
                )}
              </div>
            </div>,
            document.body
          )}
      </CardContent>
      <CardFooter className="flex gap-2 border-t pt-4">
        <Button
          size="sm"
          variant={viewMode === 'month' ? 'default' : 'ghost'}
          onClick={() => setViewMode('month')}
        >
          月
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'year' ? 'default' : 'ghost'}
          onClick={() => setViewMode('year')}
        >
          年
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'last365' ? 'default' : 'ghost'}
          onClick={() => setViewMode('last365')}
        >
          近365天
        </Button>
        {(viewMode === 'year' || viewMode === 'last365') && (
          <Button
            size="sm"
            variant={fitOneScreen ? 'default' : 'outline'}
            onClick={() => setFitOneScreen(v => !v)}
          >
            {fitOneScreen ? '一屏' : '还原'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
