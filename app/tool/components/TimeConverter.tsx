"use client"

import { useState, useEffect } from "react"
import { format, parse } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"
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
      } else if (cleanTimestamp.length >= 10) {
        // 秒级时间戳
        date = new Date(timestampNum * 1000)
      } else {
        // 时间戳位数不足
        setDateTime("时间戳位数不足")
        return
      }
      
      // 验证日期是否有效（检查是否超出了JavaScript Date支持的范围）
      if (isNaN(date.getTime()) || date.getTime() <= 0) {
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
      
      // 验证日期时间格式
      const dateTimePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      if (!dateTimePattern.test(inputDateTime)) {
        setOutputTimestamp("日期格式应为 yyyy-MM-dd HH:mm:ss")
        return
      }
      
      // 使用date-fns解析日期时间字符串
      const date = parse(inputDateTime, "yyyy-MM-dd HH:mm:ss", new Date())
      
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">当前时间</h3>
          <p className="text-sm text-muted-foreground">用于快速填充</p>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end space-x-2">
            <p className="font-mono">时间戳: {currentTimestamp}</p>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => copyToClipboard(currentTimestamp.toString(), 'timestamp')}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <p className="text-sm font-mono">{currentDateTime}</p>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={() => copyToClipboard(currentDateTime, 'dateTime')}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="timestamp-to-date">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timestamp-to-date">时间戳转日期</TabsTrigger>
          <TabsTrigger value="date-to-timestamp">日期转时间戳</TabsTrigger>
        </TabsList>

        <TabsContent value="timestamp-to-date" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="timestamp">时间戳</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="timestamp" 
                      placeholder="输入10位或13位时间戳" 
                      value={timestamp}
                      onChange={(e) => setTimestamp(e.target.value)}
                    />
                    <Button onClick={useCurrentTimestamp}>使用当前</Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="format">日期格式</Label>
                  <Input 
                    id="format" 
                    placeholder="yyyy-MM-dd HH:mm:ss" 
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                  />
                </div>

                <Button onClick={convertTimestampToDateTime}>转换</Button>

                <div className="grid gap-2">
                  <Label htmlFor="datetime">转换结果</Label>
                  <div className="flex">
                    <Input 
                      id="datetime" 
                      readOnly 
                      value={dateTime} 
                      className="rounded-r-none"
                    />
                    <Button 
                      variant="outline" 
                      className="rounded-l-none border-l-0"
                      onClick={() => copyToClipboard(dateTime, 'dateTime')}
                      disabled={!dateTime || dateTime === "无效的时间戳" || dateTime === "转换出错"}
                    >
                      {dateTimeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="date-to-timestamp" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="input-datetime">日期时间</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="input-datetime" 
                      placeholder="yyyy-MM-dd HH:mm:ss" 
                      value={inputDateTime}
                      onChange={(e) => setInputDateTime(e.target.value)}
                    />
                    <Button onClick={useCurrentDateTime}>使用当前</Button>
                  </div>
                </div>

                <Button onClick={convertDateTimeToTimestamp}>转换</Button>

                <div className="grid gap-2">
                  <Label htmlFor="output-timestamp">时间戳结果 (秒)</Label>
                  <div className="flex">
                    <Input 
                      id="output-timestamp" 
                      readOnly 
                      value={outputTimestamp}
                      className="rounded-r-none"
                    />
                    <Button 
                      variant="outline" 
                      className="rounded-l-none border-l-0"
                      onClick={() => copyToClipboard(outputTimestamp, 'timestamp')}
                      disabled={!outputTimestamp || outputTimestamp === "转换出错"}
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