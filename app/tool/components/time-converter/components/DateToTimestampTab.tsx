import React, { memo } from 'react'
import { Copy, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { ERROR_MESSAGE_LIST } from '../constants'
import { isValidOutput } from '../utils/conversionUtils'
import type { CopyType } from '../constants'

interface DateToTimestampTabProps {
  inputDateTime: string
  outputTimestamp: string
  copyStates: { [k in CopyType]: boolean }
  onInputDateTimeChange: (value: string) => void
  onConvert: () => void
  onUseCurrent: () => void
  onCopy: (text: string, type: CopyType) => void
}

export const DateToTimestampTab = memo<DateToTimestampTabProps>(
  ({
    inputDateTime,
    outputTimestamp,
    copyStates,
    onInputDateTimeChange,
    onConvert,
    onUseCurrent,
    onCopy,
  }) => {
    return (
      <Card className="border-border/60 bg-background/80 shadow-sm">
        <CardContent className="space-y-5 pt-5">
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
                  onChange={e => onInputDateTimeChange(e.target.value)}
                  className="flex-1"
                  onKeyDown={e => e.key === 'Enter' && onConvert()}
                />
                <Button onClick={onUseCurrent} variant="outline" className="whitespace-nowrap">
                  使用当前
                </Button>
              </div>
            </div>

            <Button onClick={onConvert} className="h-10 w-full" disabled={!inputDateTime.trim()}>
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
                  className="bg-muted/40 rounded-r-none"
                  placeholder="转换结果将显示在这里"
                />
                <Button
                  variant="outline"
                  className="rounded-l-none border-l-0 px-3"
                  onClick={() => onCopy(outputTimestamp, 'timestamp')}
                  disabled={!isValidOutput(outputTimestamp, ERROR_MESSAGE_LIST)}
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
    )
  }
)

DateToTimestampTab.displayName = 'DateToTimestampTab'
