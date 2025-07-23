'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parse } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Clock, Calendar, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

// 常量配置
const DEFAULT_FORMAT = 'yyyy-MM-dd HH:mm:ss'
const MIN_YEAR = 1970
const MAX_YEAR = 2100
const MILLISECOND_THRESHOLD = 13
const COPY_FEEDBACK_DURATION = 2000
const CURRENT_TIME_UPDATE_INTERVAL = 1000

const FLEXIBLE_DATE_REGEX = /^\d{4}-\d{1,2}-\d{1,2}( \d{1,2}:\d{1,2}:\d{1,2})?$/
const STANDARD_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss'

const ERROR_MESSAGES = {
  EMPTY_TIMESTAMP: '请输入时间戳',
  INVALID_TIMESTAMP: '无效的时间戳',
  CONVERSION_ERROR: '转换出错',
  EMPTY_DATETIME: '请输入日期时间',
  INVALID_DATE_FORMAT: '日期格式应为 yyyy-M-d 或 yyyy-MM-dd HH:mm:ss',
  INVALID_DATE: '无效的日期格式',
  OUT_OF_RANGE: (year: number) => `可能不正确的时间 (${year}年)，请检查`,
} as const

type CopyType = 'timestamp' | 'dateTime'

const errorMessageList = [
  ERROR_MESSAGES.EMPTY_TIMESTAMP,
  ERROR_MESSAGES.INVALID_TIMESTAMP,
  ERROR_MESSAGES.CONVERSION_ERROR,
  ERROR_MESSAGES.EMPTY_DATETIME,
  ERROR_MESSAGES.INVALID_DATE_FORMAT,
  ERROR_MESSAGES.INVALID_DATE,
]

const useCopyFeedback = () => {
  const [copyStates, setCopyStates] = useState<{ [k in CopyType]: boolean }>({
    timestamp: false,
    dateTime: false,
  })

  const copyToClipboard = useCallback(async (text: string, type: CopyType) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStates(prev => ({ ...prev, [type]: true }))
      setTimeout(() => setCopyStates(prev => ({ ...prev, [type]: false })), COPY_FEEDBACK_DURATION)
      toast('已复制到剪贴板', {
        description: text,
        duration: COPY_FEEDBACK_DURATION,
      })
    } catch (error) {
      console.error('复制失败:', error)
      toast.error('复制失败')
    }
  }, [])

  return { copyStates, copyToClipboard }
}

const useCurrentTime = () => {
  const [currentTimestamp, setCurrentTimestamp] = useState(0)
  const [currentDateTime, setCurrentDateTime] = useState('')

  const updateCurrentTime = useCallback(() => {
    const now = new Date()
    setCurrentTimestamp(Math.floor(now.getTime() / 1000))
    setCurrentDateTime(format(now, DEFAULT_FORMAT, { locale: zhCN }))
  }, [])

  useEffect(() => {
    updateCurrentTime()
    const timer = setInterval(updateCurrentTime, CURRENT_TIME_UPDATE_INTERVAL)
    return () => clearInterval(timer)
  }, [updateCurrentTime])

  return { currentTimestamp, currentDateTime, updateCurrentTime }
}

const validateYear = (year: number) => year >= MIN_YEAR && year <= MAX_YEAR

const cleanTimestamp = (input: string) => input.replace(/\D/g, '')

const standardizeDateTime = (input: string) => {
  const [date, time] = input.split(' ')
  const dateParts = date?.split('-') ?? []
  if (dateParts.length !== 3) return input
  const [year, month, day] = dateParts
  const standardDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  return time ? `${standardDate} ${time}` : standardDate
}

const isValidOutput = (output: string) =>
  output && !errorMessageList.includes(output as (typeof errorMessageList)[number])

const TimeConverter = () => {
  // 状态管理
  const [timestamp, setTimestamp] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [dateFormat, setDateFormat] = useState(DEFAULT_FORMAT)
  const [inputDateTime, setInputDateTime] = useState('')
  const [outputTimestamp, setOutputTimestamp] = useState('')

  const { currentTimestamp, currentDateTime, updateCurrentTime } = useCurrentTime()
  const { copyStates, copyToClipboard } = useCopyFeedback()

  // 时间戳转日期时间
  const convertTimestampToDateTime = useCallback(() => {
    try {
      if (!timestamp.trim()) {
        setDateTime(ERROR_MESSAGES.EMPTY_TIMESTAMP)
        return
      }
      const cleanTs = cleanTimestamp(timestamp)
      const timestampNum = Number(cleanTs)
      if (isNaN(timestampNum)) {
        setDateTime(ERROR_MESSAGES.INVALID_TIMESTAMP)
        return
      }
      const date =
        cleanTs.length >= MILLISECOND_THRESHOLD
          ? new Date(timestampNum)
          : new Date(timestampNum * 1000)
      if (isNaN(date.getTime()) || date.getTime() < 0) {
        setDateTime(ERROR_MESSAGES.INVALID_TIMESTAMP)
        return
      }
      const year = date.getFullYear()
      if (!validateYear(year)) {
        setDateTime(ERROR_MESSAGES.OUT_OF_RANGE(year))
        return
      }
      const result = format(date, dateFormat, { locale: zhCN })
      setDateTime(result)
      toast.success('转换成功', {
        description: `${timestamp} → ${result}`,
      })
    } catch (error) {
      console.error('时间戳转换错误:', error)
      setDateTime(ERROR_MESSAGES.CONVERSION_ERROR)
      toast.error('转换失败')
    }
  }, [timestamp, dateFormat])

  // 日期时间转时间戳
  const convertDateTimeToTimestamp = useCallback(() => {
    try {
      if (!inputDateTime.trim()) {
        setOutputTimestamp(ERROR_MESSAGES.EMPTY_DATETIME)
        return
      }
      if (!FLEXIBLE_DATE_REGEX.test(inputDateTime)) {
        setOutputTimestamp(ERROR_MESSAGES.INVALID_DATE_FORMAT)
        return
      }
      const standardDateTimeStr = standardizeDateTime(inputDateTime)
      const dateTimeWithTime = standardDateTimeStr.includes(' ')
        ? standardDateTimeStr
        : `${standardDateTimeStr} 00:00:00`
      const date = parse(dateTimeWithTime, STANDARD_DATE_FORMAT, new Date())
      if (isNaN(date.getTime())) {
        setOutputTimestamp(ERROR_MESSAGES.INVALID_DATE)
        return
      }
      const year = date.getFullYear()
      if (year < MIN_YEAR) {
        setOutputTimestamp(ERROR_MESSAGES.OUT_OF_RANGE(year))
        return
      }
      const result = Math.floor(date.getTime() / 1000).toString()
      setOutputTimestamp(result)
      toast.success('转换成功', {
        description: `${inputDateTime} → ${result}`,
      })
    } catch (error) {
      console.error('日期转换错误:', error)
      setOutputTimestamp(ERROR_MESSAGES.CONVERSION_ERROR)
      toast.error('转换失败')
    }
  }, [inputDateTime])

  // 使用当前时间戳
  const useCurrentTimestamp = useCallback(() => {
    try {
      const now = new Date()
      const current = Math.floor(now.getTime() / 1000)
      const result = format(now, dateFormat, { locale: zhCN })
      setTimestamp(current.toString())
      setDateTime(result)
      toast.success('已使用当前时间', {
        description: `${current} → ${result}`,
      })
    } catch (error) {
      console.error('使用当前时间戳出错:', error)
      toast.error('获取当前时间戳失败')
    }
  }, [dateFormat])

  // 使用当前日期时间
  const useCurrentDateTime = useCallback(() => {
    try {
      const now = new Date()
      const formattedDate = format(now, DEFAULT_FORMAT, { locale: zhCN })
      const result = Math.floor(now.getTime() / 1000).toString()
      setInputDateTime(formattedDate)
      setOutputTimestamp(result)
      toast.success('已使用当前时间', {
        description: `${formattedDate} → ${result}`,
      })
    } catch (error) {
      console.error('使用当前日期时间出错:', error)
      toast.error('获取当前日期时间失败')
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* 当前时间显示区域 */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Clock className="h-5 w-5" />
            当前时间
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-6 w-6 text-blue-600 hover:text-blue-700"
              onClick={updateCurrentTime}
              title="刷新当前时间"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-blue-100 bg-white/60 p-4 dark:border-blue-800 dark:bg-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">时间戳</p>
                  <p className="font-mono text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {currentTimestamp}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                  onClick={() => copyToClipboard(currentTimestamp.toString(), 'timestamp')}
                >
                  {copyStates.timestamp ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-white/60 p-4 dark:border-blue-800 dark:bg-gray-800/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground mb-1 text-sm">日期时间</p>
                  <p className="font-mono text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {currentDateTime}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20 dark:hover:text-blue-300"
                  onClick={() => copyToClipboard(currentDateTime, 'dateTime')}
                >
                  {copyStates.dateTime ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 转换工具区域 */}
      <Tabs defaultValue="timestamp-to-date" className="space-y-6">
        <TabsList className="grid h-12 w-full grid-cols-2">
          <TabsTrigger value="timestamp-to-date" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            时间戳转日期
          </TabsTrigger>
          <TabsTrigger value="date-to-timestamp" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            日期转时间戳
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timestamp-to-date" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">时间戳转日期时间</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timestamp" className="text-sm font-medium">
                    时间戳
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="timestamp"
                      value={timestamp}
                      onChange={e => setTimestamp(e.target.value)}
                      placeholder="输入时间戳（支持秒级和毫秒级）"
                      className="flex-1"
                      onKeyDown={e => e.key === 'Enter' && convertTimestampToDateTime()}
                    />
                    <Button
                      onClick={useCurrentTimestamp}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      使用当前
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format" className="text-sm font-medium">
                    日期格式
                  </Label>
                  <Input
                    id="format"
                    placeholder="yyyy-MM-dd HH:mm:ss"
                    value={dateFormat}
                    onChange={e => setDateFormat(e.target.value)}
                  />
                </div>

                <Button
                  onClick={convertTimestampToDateTime}
                  className="h-11 w-full"
                  size="lg"
                  disabled={!timestamp.trim()}
                >
                  转换
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="datetime" className="text-sm font-medium">
                    转换结果
                  </Label>
                  <div className="flex">
                    <Input
                      id="datetime"
                      readOnly
                      value={dateTime}
                      className="rounded-r-none bg-gray-50 dark:bg-gray-900"
                      placeholder="转换结果将显示在这里"
                    />
                    <Button
                      variant="outline"
                      className="rounded-l-none border-l-0 px-3"
                      onClick={() => copyToClipboard(dateTime, 'dateTime')}
                      disabled={!isValidOutput(dateTime)}
                    >
                      {copyStates.dateTime ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="date-to-timestamp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">日期时间转时间戳</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="input-datetime" className="text-sm font-medium">
                    日期时间
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="input-datetime"
                      placeholder="yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss"
                      value={inputDateTime}
                      onChange={e => setInputDateTime(e.target.value)}
                      className="flex-1"
                      onKeyDown={e => e.key === 'Enter' && convertDateTimeToTimestamp()}
                    />
                    <Button
                      onClick={useCurrentDateTime}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      使用当前
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={convertDateTimeToTimestamp}
                  className="h-11 w-full"
                  size="lg"
                  disabled={!inputDateTime.trim()}
                >
                  转换
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="output-timestamp" className="text-sm font-medium">
                    时间戳结果（秒）
                  </Label>
                  <div className="flex">
                    <Input
                      id="output-timestamp"
                      readOnly
                      value={outputTimestamp}
                      className="rounded-r-none bg-gray-50 dark:bg-gray-900"
                      placeholder="转换结果将显示在这里"
                    />
                    <Button
                      variant="outline"
                      className="rounded-l-none border-l-0 px-3"
                      onClick={() => copyToClipboard(outputTimestamp, 'timestamp')}
                      disabled={!isValidOutput(outputTimestamp)}
                    >
                      {copyStates.timestamp ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TimeConverter
