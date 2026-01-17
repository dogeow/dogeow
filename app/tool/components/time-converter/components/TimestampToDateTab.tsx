import React, { memo } from 'react'
import { Clock, Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ERROR_MESSAGE_LIST } from '../constants'
import { isValidOutput } from '../utils/conversionUtils'
import type { CopyType } from '../constants'

interface TimestampToDateTabProps {
  timestamp: string
  dateTime: string
  dateFormat: string
  copyStates: { [k in CopyType]: boolean }
  onTimestampChange: (value: string) => void
  onDateFormatChange: (value: string) => void
  onConvert: () => void
  onUseCurrent: () => void
  onCopy: (text: string, type: CopyType) => void
}

export const TimestampToDateTab = memo<TimestampToDateTabProps>(
  ({
    timestamp,
    dateTime,
    dateFormat,
    copyStates,
    onTimestampChange,
    onDateFormatChange,
    onConvert,
    onUseCurrent,
    onCopy,
  }) => {
    return (
      <Card className="border-border/60 bg-background/80 shadow-sm">
        <CardContent className="space-y-5 pt-5">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="timestamp" className="text-sm font-medium">
                时间戳
              </Label>
              <div className="flex gap-3">
                <Input
                  id="timestamp"
                  value={timestamp}
                  onChange={e => onTimestampChange(e.target.value)}
                  placeholder="输入时间戳（支持秒级和毫秒级）"
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && onConvert()}
                />
                <Button onClick={onUseCurrent} variant="outline" className="whitespace-nowrap">
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
                onChange={e => onDateFormatChange(e.target.value)}
              />
            </div>

            <Button onClick={onConvert} className="h-10 w-full" disabled={!timestamp.trim()}>
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
                  className="bg-muted/40 rounded-r-none"
                  placeholder="转换结果将显示在这里"
                />
                <Button
                  variant="outline"
                  className="rounded-l-none border-l-0 px-3"
                  onClick={() => onCopy(dateTime, 'dateTime')}
                  disabled={!isValidOutput(dateTime, ERROR_MESSAGE_LIST)}
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
    )
  }
)

TimestampToDateTab.displayName = 'TimestampToDateTab'
