'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCheckInCalendar } from '../hooks/useWord'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { format, startOfMonth, addMonths, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function CheckInCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const { data: calendarData, isLoading } = useCheckInCalendar(year, month)

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (!calendarData) {
    return null
  }

  const monthStart = startOfMonth(currentDate)
  const firstDayOfWeek = monthStart.getDay()

  // 生成日历网格
  const calendarDays: ((typeof calendarData.calendar)[0] | null)[] = []

  // 填充月初空白
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }

  // 填充日期
  calendarData.calendar.forEach(day => {
    calendarDays.push(day)
  })

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {format(currentDate, 'yyyy年M月', { locale: zhCN })}
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
        <div className="grid grid-cols-7 gap-0.5">
          {/* 星期标题 */}
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="text-muted-foreground py-1.5 text-center text-xs font-medium">
              {day}
            </div>
          ))}

          {/* 日期 */}
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const date = new Date(day.date)
            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

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
      </CardContent>
    </Card>
  )
}
