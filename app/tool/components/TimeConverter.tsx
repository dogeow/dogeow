'use client'

import React, { memo } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Calendar } from 'lucide-react'
import { useCopyFeedback } from './time-converter/hooks/useCopyFeedback'
import { useCurrentTime } from './time-converter/hooks/useCurrentTime'
import { useTimeConversion } from './time-converter/hooks/useTimeConversion'
import { CurrentTimeDisplay } from './time-converter/components/CurrentTimeDisplay'
import { TimestampToDateTab } from './time-converter/components/TimestampToDateTab'
import { DateToTimestampTab } from './time-converter/components/DateToTimestampTab'

// 提取 props 类型
interface TimeConverterProps {
  // 可以扩展 props 用于外部控制
}

const TimeConverterContent: React.FC<TimeConverterProps> = () => {
  const { currentTimestamp, currentDateTime } = useCurrentTime()
  const { copyStates, copyToClipboard, cleanup } = useCopyFeedback()
  const {
    timestamp,
    setTimestamp,
    dateTime,
    dateFormat,
    setDateFormat,
    inputDateTime,
    setInputDateTime,
    outputTimestamp,
    convertTimestampToDateTime,
    convertDateTimeToTimestamp,
    useCurrentTimestamp,
    useCurrentDateTime,
  } = useTimeConversion()

  // 组件卸载时清理
  React.useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  return (
    <div className="space-y-6">
      <CurrentTimeDisplay
        currentTimestamp={currentTimestamp}
        currentDateTime={currentDateTime}
        copyStates={copyStates}
        onCopy={copyToClipboard}
      />

      <Tabs defaultValue="timestamp-to-date" className="space-y-5">
        <TabsList className="bg-muted/40 grid h-10 w-full grid-cols-2 p-1">
          <TabsTrigger value="timestamp-to-date" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            时间戳转日期
          </TabsTrigger>
          <TabsTrigger value="date-to-timestamp" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            日期转时间戳
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timestamp-to-date" className="space-y-5">
          <TimestampToDateTab
            timestamp={timestamp}
            dateTime={dateTime}
            dateFormat={dateFormat}
            copyStates={copyStates}
            onTimestampChange={setTimestamp}
            onDateFormatChange={setDateFormat}
            onConvert={convertTimestampToDateTime}
            onUseCurrent={useCurrentTimestamp}
            onCopy={copyToClipboard}
          />
        </TabsContent>

        <TabsContent value="date-to-timestamp" className="space-y-5">
          <DateToTimestampTab
            inputDateTime={inputDateTime}
            outputTimestamp={outputTimestamp}
            copyStates={copyStates}
            onInputDateTimeChange={setInputDateTime}
            onConvert={convertDateTimeToTimestamp}
            onUseCurrent={useCurrentDateTime}
            onCopy={copyToClipboard}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 使用 memo 包装，避免父组件重渲染导致不必要更新
const TimeConverter = memo<TimeConverterProps>(TimeConverterContent, () => true)

TimeConverter.displayName = 'TimeConverter'

export default TimeConverter
