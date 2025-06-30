"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { format, parse } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Clock, Calendar, RefreshCw } from "lucide-react"
import { toast } from "sonner"

// 常量配置
const CONSTANTS = {
  DEFAULT_FORMAT: "yyyy-MM-dd HH:mm:ss",
  MIN_YEAR: 1970,
  MAX_YEAR: 2100,
  MILLISECOND_THRESHOLD: 13,
  COPY_FEEDBACK_DURATION: 2000,
  CURRENT_TIME_UPDATE_INTERVAL: 1000,
} as const

const DATE_PATTERNS = {
  FLEXIBLE: /^\d{4}-\d{1,2}-\d{1,2}( \d{1,2}:\d{1,2}:\d{1,2})?$/,
  STANDARD: "yyyy-MM-dd HH:mm:ss",
} as const

const ERROR_MESSAGES = {
  EMPTY_TIMESTAMP: "请输入时间戳",
  INVALID_TIMESTAMP: "无效的时间戳",
  CONVERSION_ERROR: "转换出错",
  EMPTY_DATETIME: "请输入日期时间",
  INVALID_DATE_FORMAT: "日期格式应为 yyyy-M-d 或 yyyy-MM-dd HH:mm:ss",
  INVALID_DATE: "无效的日期格式",
  OUT_OF_RANGE: (year: number) => `可能不正确的时间 (${year}年)，请检查`,
} as const

interface CopyState {
  timestamp: boolean
  dateTime: boolean
}

const TimeConverter = () => {
  // 统一状态管理
  const [states, setStates] = useState({
    // 时间戳转日期
    timestamp: "",
    dateTime: "",
    dateFormat: CONSTANTS.DEFAULT_FORMAT,
    
    // 日期转时间戳
    inputDateTime: "",
    outputTimestamp: "",
    
    // 当前时间
    currentTimestamp: 0,
    currentDateTime: "",
  })

  const [copyStates, setCopyStates] = useState<CopyState>({
    timestamp: false,
    dateTime: false,
  })

  // 工具函数
  const validateYear = useCallback((year: number): boolean => {
    return year >= CONSTANTS.MIN_YEAR && year <= CONSTANTS.MAX_YEAR
  }, [])

  const cleanTimestamp = useCallback((input: string): string => {
    return input.replace(/\D/g, '')
  }, [])

  const standardizeDateTime = useCallback((input: string): string => {
    const parts = input.split(' ')
    if (parts.length === 0) return input

    const dateParts = parts[0].split('-')
    if (dateParts.length !== 3) return input

    const [year, month, day] = dateParts
    const standardDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    
    return parts.length > 1 ? `${standardDate} ${parts[1]}` : standardDate
  }, [])

  // 更新当前时间
  const updateCurrentTime = useCallback(() => {
    const now = new Date()
    setStates(prev => ({
      ...prev,
      currentTimestamp: Math.floor(now.getTime() / 1000),
      currentDateTime: format(now, CONSTANTS.DEFAULT_FORMAT, { locale: zhCN }),
    }))
  }, [])

  // 设置计时器
  useEffect(() => {
    updateCurrentTime()
    const timer = setInterval(updateCurrentTime, CONSTANTS.CURRENT_TIME_UPDATE_INTERVAL)
    return () => clearInterval(timer)
  }, [updateCurrentTime])

  // 时间戳转日期时间
  const convertTimestampToDateTime = useCallback(() => {
    try {
      const { timestamp, dateFormat } = states
      
      if (!timestamp.trim()) {
        setStates(prev => ({ ...prev, dateTime: ERROR_MESSAGES.EMPTY_TIMESTAMP }))
        return
      }

      const cleanTs = cleanTimestamp(timestamp)
      const timestampNum = Number(cleanTs)
      
      if (isNaN(timestampNum)) {
        setStates(prev => ({ ...prev, dateTime: ERROR_MESSAGES.INVALID_TIMESTAMP }))
        return
      }

      // 判断时间戳类型并创建日期对象
      const date = cleanTs.length >= CONSTANTS.MILLISECOND_THRESHOLD 
        ? new Date(timestampNum) 
        : new Date(timestampNum * 1000)
      
      // 验证日期有效性
      if (isNaN(date.getTime()) || date.getTime() < 0) {
        setStates(prev => ({ ...prev, dateTime: ERROR_MESSAGES.INVALID_TIMESTAMP }))
        return
      }
      
      const year = date.getFullYear()
      if (!validateYear(year)) {
        setStates(prev => ({ ...prev, dateTime: ERROR_MESSAGES.OUT_OF_RANGE(year) }))
        return
      }

      const result = format(date, dateFormat, { locale: zhCN })
      setStates(prev => ({ ...prev, dateTime: result }))
      
      toast.success("转换成功", { 
        description: `${timestamp} → ${result}`
      })
    } catch (error) {
      console.error("时间戳转换错误:", error)
      setStates(prev => ({ ...prev, dateTime: ERROR_MESSAGES.CONVERSION_ERROR }))
      toast.error("转换失败")
    }
  }, [states.timestamp, states.dateFormat, cleanTimestamp, validateYear])

  // 日期时间转时间戳
  const convertDateTimeToTimestamp = useCallback(() => {
    try {
      const { inputDateTime } = states
      
      if (!inputDateTime.trim()) {
        setStates(prev => ({ ...prev, outputTimestamp: ERROR_MESSAGES.EMPTY_DATETIME }))
        return
      }
      
      if (!DATE_PATTERNS.FLEXIBLE.test(inputDateTime)) {
        setStates(prev => ({ ...prev, outputTimestamp: ERROR_MESSAGES.INVALID_DATE_FORMAT }))
        return
      }
      
      const standardDateTime = standardizeDateTime(inputDateTime)
      
      // 解析日期
      const dateTimeWithTime = standardDateTime.includes(' ') 
        ? standardDateTime 
        : `${standardDateTime} 00:00:00`
      
      const date = parse(dateTimeWithTime, DATE_PATTERNS.STANDARD, new Date())
      
      if (isNaN(date.getTime())) {
        setStates(prev => ({ ...prev, outputTimestamp: ERROR_MESSAGES.INVALID_DATE }))
        return
      }
      
      const year = date.getFullYear()
      if (year < CONSTANTS.MIN_YEAR) {
        setStates(prev => ({ ...prev, outputTimestamp: ERROR_MESSAGES.OUT_OF_RANGE(year) }))
        return
      }
      
      const result = Math.floor(date.getTime() / 1000).toString()
      setStates(prev => ({ ...prev, outputTimestamp: result }))
      
      toast.success("转换成功", { 
        description: `${inputDateTime} → ${result}`
      })
    } catch (error) {
      console.error("日期转换错误:", error)
      setStates(prev => ({ ...prev, outputTimestamp: ERROR_MESSAGES.CONVERSION_ERROR }))
      toast.error("转换失败")
    }
  }, [states.inputDateTime, standardizeDateTime, validateYear])

  // 使用当前时间戳
  const useCurrentTimestamp = useCallback(() => {
    try {
      const now = new Date()
      const current = Math.floor(now.getTime() / 1000)
      const result = format(now, states.dateFormat, { locale: zhCN })
      
      setStates(prev => ({
        ...prev,
        timestamp: current.toString(),
        dateTime: result,
      }))
      
      toast.success("已使用当前时间", {
        description: `${current} → ${result}`
      })
    } catch (error) {
      console.error("使用当前时间戳出错:", error)
      toast.error("获取当前时间戳失败")
    }
  }, [states.dateFormat])

  // 使用当前日期时间
  const useCurrentDateTime = useCallback(() => {
    try {
      const now = new Date()
      const formattedDate = format(now, CONSTANTS.DEFAULT_FORMAT, { locale: zhCN })
      const result = Math.floor(now.getTime() / 1000).toString()
      
      setStates(prev => ({
        ...prev,
        inputDateTime: formattedDate,
        outputTimestamp: result,
      }))
      
      toast.success("已使用当前时间", {
        description: `${formattedDate} → ${result}`
      })
    } catch (error) {
      console.error("使用当前日期时间出错:", error)
      toast.error("获取当前日期时间失败")
    }
  }, [])

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (text: string, type: keyof CopyState) => {
    try {
      await navigator.clipboard.writeText(text)
      
      setCopyStates(prev => ({ ...prev, [type]: true }))
      setTimeout(() => {
        setCopyStates(prev => ({ ...prev, [type]: false }))
      }, CONSTANTS.COPY_FEEDBACK_DURATION)
      
      toast("已复制到剪贴板", {
        description: text,
        duration: CONSTANTS.COPY_FEEDBACK_DURATION,
      })
    } catch (error) {
      console.error("复制失败:", error)
      toast.error("复制失败")
    }
  }, [])

  // 检查输出是否可复制
  const isValidOutput = useCallback((output: string, errorMessages: string[]) => {
    return output && !errorMessages.includes(output)
  }, [])

  // 错误消息列表（用于验证输出是否有效）
  const errorMessageList = useMemo(() => [
    ERROR_MESSAGES.EMPTY_TIMESTAMP,
    ERROR_MESSAGES.INVALID_TIMESTAMP,
    ERROR_MESSAGES.CONVERSION_ERROR,
    ERROR_MESSAGES.EMPTY_DATETIME,
    ERROR_MESSAGES.INVALID_DATE_FORMAT,
    ERROR_MESSAGES.INVALID_DATE,
  ], [])

  // 更新单个状态的辅助函数
  const updateState = useCallback((key: string, value: string) => {
    setStates(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className="space-y-8">
      {/* 当前时间显示区域 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Clock className="h-5 w-5" />
            当前时间
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto text-blue-600 hover:text-blue-700"
              onClick={updateCurrentTime}
              title="刷新当前时间"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">时间戳</p>
                  <p className="font-mono text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {states.currentTimestamp}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20" 
                  onClick={() => copyToClipboard(states.currentTimestamp.toString(), 'timestamp')}
                >
                  {copyStates.timestamp ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">日期时间</p>
                  <p className="font-mono text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {states.currentDateTime}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20" 
                  onClick={() => copyToClipboard(states.currentDateTime, 'dateTime')}
                >
                  {copyStates.dateTime ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 转换工具区域 */}
      <Tabs defaultValue="timestamp-to-date" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12">
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
                  <Label htmlFor="timestamp" className="text-sm font-medium">时间戳</Label>
                  <div className="flex gap-3">
                    <Input 
                      id="timestamp" 
                      value={states.timestamp}
                      onChange={(e) => updateState('timestamp', e.target.value)}
                      placeholder="输入时间戳（支持秒级和毫秒级）"
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && convertTimestampToDateTime()}
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
                  <Label htmlFor="format" className="text-sm font-medium">日期格式</Label>
                  <Input 
                    id="format" 
                    placeholder="yyyy-MM-dd HH:mm:ss" 
                    value={states.dateFormat}
                    onChange={(e) => updateState('dateFormat', e.target.value)}
                  />
                </div>

                <Button 
                  onClick={convertTimestampToDateTime}
                  className="w-full h-11"
                  size="lg"
                  disabled={!states.timestamp.trim()}
                >
                  转换
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="datetime" className="text-sm font-medium">转换结果</Label>
                  <div className="flex">
                    <Input 
                      id="datetime" 
                      readOnly 
                      value={states.dateTime} 
                      className="rounded-r-none bg-gray-50 dark:bg-gray-900"
                      placeholder="转换结果将显示在这里"
                    />
                    <Button 
                      variant="outline" 
                      className="rounded-l-none border-l-0 px-3"
                      onClick={() => copyToClipboard(states.dateTime, 'dateTime')}
                      disabled={!isValidOutput(states.dateTime, errorMessageList)}
                    >
                      {copyStates.dateTime ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
                  <Label htmlFor="input-datetime" className="text-sm font-medium">日期时间</Label>
                  <div className="flex gap-3">
                    <Input 
                      id="input-datetime" 
                      placeholder="yyyy-MM-dd 或 yyyy-MM-dd HH:mm:ss" 
                      value={states.inputDateTime}
                      onChange={(e) => updateState('inputDateTime', e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && convertDateTimeToTimestamp()}
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
                  className="w-full h-11"
                  size="lg"
                  disabled={!states.inputDateTime.trim()}
                >
                  转换
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="output-timestamp" className="text-sm font-medium">时间戳结果（秒）</Label>
                  <div className="flex">
                    <Input 
                      id="output-timestamp" 
                      readOnly 
                      value={states.outputTimestamp}
                      className="rounded-r-none bg-gray-50 dark:bg-gray-900"
                      placeholder="转换结果将显示在这里"
                    />
                    <Button 
                      variant="outline" 
                      className="rounded-l-none border-l-0 px-3"
                      onClick={() => copyToClipboard(states.outputTimestamp, 'timestamp')}
                      disabled={!isValidOutput(states.outputTimestamp, errorMessageList)}
                    >
                      {copyStates.timestamp ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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