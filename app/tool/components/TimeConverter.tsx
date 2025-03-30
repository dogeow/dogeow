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
      // 检查时间戳长度，如果是13位则为毫秒级时间戳，否则为秒级时间戳
      const timestampNum = Number(timestamp)
      if (isNaN(timestampNum)) {
        setDateTime("无效的时间戳")
        return
      }

      const date = new Date(
        timestampNum.toString().length > 10 
          ? timestampNum 
          : timestampNum * 1000
      )

      setDateTime(format(date, dateFormat, { locale: zhCN }))
    } catch (error) {
      setDateTime("转换出错")
    }
  }

  // 日期时间转时间戳
  const convertDateTimeToTimestamp = () => {
    try {
      const date = parse(inputDateTime, "yyyy-MM-dd HH:mm:ss", new Date())
      setOutputTimestamp(Math.floor(date.getTime() / 1000).toString())
    } catch (error) {
      setOutputTimestamp("转换出错")
    }
  }

  // 使用当前时间戳
  const useCurrentTimestamp = () => {
    setTimestamp(currentTimestamp.toString())
    convertTimestampToDateTime()
  }

  // 使用当前日期时间
  const useCurrentDateTime = () => {
    setInputDateTime(currentDateTime)
    convertDateTimeToTimestamp()
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