"use client"

import { useState, useEffect } from "react"
import { format, parse } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Clock, Calendar } from "lucide-react"
import { toast } from "sonner"

const TimeConverter = () => {
  // 时间戳转日期时间
  const [timestamp, setTimestamp] = useState("")
  const [dateTime, setDateTime] = useState("")
  const [dateFormat, setDateFormat] = useState("yyyy-MM-dd HH:mm:ss")
  const [timestampCopied, setTimestampCopied] = useState(false)

  // 日期时间转时间戳
  const [inputDateTime, setInputDateTime] = useState("")
  const [outputTimestamp, setOutputTimestamp] = useState("")
  const [dateTimeCopied, setDateTimeCopied] = useState(false)

  // 当前时间相关状态
  const [currentTimestamp, setCurrentTimestamp] = useState(0)
  const [currentDateTime, setCurrentDateTime] = useState("")

  // 更新当前时间
  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date()
      setCurrentTimestamp(Math.floor(now.getTime() / 1000))
      setCurrentDateTime(format(now, "yyyy-MM-dd HH:mm:ss", { locale: zhCN }))
    }

    updateCurrentTime()
    const timer = setInterval(updateCurrentTime, 1000)

    return () => clearInterval(timer)
  }, [])

  // 时间戳转日期时间
  const convertTimestampToDateTime = () => {
    try {
      if (!timestamp.trim()) {
        setDateTime("请输入时间戳")
        return
      }

      // 移除可能存在的非数字字符
      const cleanTimestamp = timestamp.replace(/\D/g, '')
      const timestampNum = Number(cleanTimestamp)
      
      if (isNaN(timestampNum)) {
        setDateTime("无效的时间戳")
        return
      }

      let date
      
      // 根据时间戳位数判断是秒级还是毫秒级
      if (cleanTimestamp.length >= 13) {
        // 毫秒级时间戳
        date = new Date(timestampNum)
      } else {
        // 秒级时间戳（包括小于10位的有效时间戳）
        date = new Date(timestampNum * 1000)
      }
      
      // 验证日期是否有效（检查是否超出了JavaScript Date支持的范围）
      if (isNaN(date.getTime()) || date.getTime() < 0) {
        setDateTime("无效的时间戳")
        return
      }
      
      // 检查日期是否明显不合理（1970年以前或远未来）
      const year = date.getFullYear()
      if (year < 1970 || year > 2100) {
        setDateTime(`可能不正确的时间戳 (${year}年)，请检查`)
        return
      }

      const result = format(date, dateFormat, { locale: zhCN })
      setDateTime(result)
      toast.success("转换成功", { 
        description: `${timestamp} → ${result}`
      })
    } catch (error) {
      console.error("时间戳转换错误:", error)
      setDateTime("转换出错")
      toast.error("转换失败")
    }
  }

  // 日期时间转时间戳
  const convertDateTimeToTimestamp = () => {
    try {
      if (!inputDateTime.trim()) {
        setOutputTimestamp("请输入日期时间")
        return
      }
      
      // 更宽松的日期格式正则表达式，支持缩写格式
      const dateTimePattern = /^\d{4}-\d{1,2}-\d{1,2}( \d{1,2}:\d{1,2}:\d{1,2})?$/
      if (!dateTimePattern.test(inputDateTime)) {
        setOutputTimestamp("日期格式应为 yyyy-M-d 或 yyyy-MM-dd HH:mm:ss")
        return
      }
      
      // 标准化日期格式
      let standardDateTime = inputDateTime
      const parts = inputDateTime.split(' ')
      if (parts.length > 0) {
        const dateParts = parts[0].split('-')
        if (dateParts.length === 3) {
          // 确保月和日都是两位数
          const year = dateParts[0]
          const month = dateParts[1].padStart(2, '0')
          const day = dateParts[2].padStart(2, '0')
          
          standardDateTime = `${year}-${month}-${day}`
          if (parts.length > 1) {
            standardDateTime += ` ${parts[1]}`
          }
        }
      }
      
      // 使用date-fns解析日期时间字符串
      let date
      if (!standardDateTime.includes(' ')) {
        // 只有日期部分，添加默认时间 00:00:00
        date = parse(`${standardDateTime} 00:00:00`, "yyyy-MM-dd HH:mm:ss", new Date())
      } else {
        date = parse(standardDateTime, "yyyy-MM-dd HH:mm:ss", new Date())
      }
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        setOutputTimestamp("无效的日期格式")
        return
      }
      
      // 检查日期是否在合理范围内
      const year = date.getFullYear()
      if (year < 1970) {
        setOutputTimestamp(`可能不正确的日期 (${year}年)，请检查`)
        return
      }
      
      const result = Math.floor(date.getTime() / 1000).toString()
      setOutputTimestamp(result)
      toast.success("转换成功", { 
        description: `${inputDateTime} → ${result}`
      })
    } catch (error) {
      console.error("日期转换错误:", error)
      setOutputTimestamp("转换出错")
      toast.error("转换失败")
    }
  }

  // 使用当前时间戳
  const useCurrentTimestamp = () => {
    try {
      const now = new Date()
      const current = Math.floor(now.getTime() / 1000)
      setTimestamp(current.toString())
      
      // 直接计算结果而不是调用转换函数
      const result = format(now, dateFormat, { locale: zhCN })
      setDateTime(result)
      toast.success("已使用当前时间", {
        description: `${current} → ${result}`
      })
    } catch (error) {
      console.error("使用当前时间戳出错:", error)
      toast.error("获取当前时间戳失败")
    }
  }

  // 使用当前日期时间
  const useCurrentDateTime = () => {
    try {
      const now = new Date()
      const formattedDate = format(now, "yyyy-MM-dd HH:mm:ss", { locale: zhCN })
      setInputDateTime(formattedDate)
      
      // 直接计算结果而不是调用转换函数
      const result = Math.floor(now.getTime() / 1000).toString()
      setOutputTimestamp(result)
      toast.success("已使用当前时间", {
        description: `${formattedDate} → ${result}`
      })
    } catch (error) {
      console.error("使用当前日期时间出错:", error)
      toast.error("获取当前日期时间失败")
    }
  }

  // 复制到剪贴板
  const copyToClipboard = (text: string, type: 'timestamp' | 'dateTime') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'timestamp') {
        setTimestampCopied(true)
        setTimeout(() => setTimestampCopied(false), 2000)
      } else {
        setDateTimeCopied(true)
        setTimeout(() => setDateTimeCopied(false), 2000)
      }
      
      toast("已复制到剪贴板", {
        description: text,
        duration: 2000,
      })
    })
  }

  return (
    <div className="space-y-8">
      {/* 当前时间显示区域 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Clock className="h-5 w-5" />
            当前时间
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">时间戳</p>
                  <p className="font-mono text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {currentTimestamp}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20" 
                  onClick={() => copyToClipboard(currentTimestamp.toString(), 'timestamp')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">日期时间</p>
                  <p className="font-mono text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {currentDateTime}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20" 
                  onClick={() => copyToClipboard(currentDateTime, 'dateTime')}
                >
                  <Copy className="h-4 w-4" />
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
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                      placeholder="输入时间戳（支持秒级和毫秒级）"
                      className="flex-1"
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
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  />
                </div>

                <Button 
                  onClick={convertTimestampToDateTime}
                  className="w-full h-11"
                  size="lg"
                >
                  转换
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="datetime" className="text-sm font-medium">转换结果</Label>
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
                      disabled={!dateTime || dateTime === "无效的时间戳" || dateTime === "转换出错" || dateTime === "请输入时间戳"}
                    >
                      {dateTimeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
                      value={inputDateTime}
                      onChange={(e) => setInputDateTime(e.target.value)}
                      className="flex-1"
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
                >
                  转换
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="output-timestamp" className="text-sm font-medium">时间戳结果（秒）</Label>
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
                      disabled={!outputTimestamp || outputTimestamp === "转换出错" || outputTimestamp === "请输入日期时间"}
                    >
                      {timestampCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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