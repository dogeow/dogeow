import React, { memo } from 'react'
import { Clock, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { CopyType } from '../constants'

interface CurrentTimeDisplayProps {
  currentTimestamp: number
  currentDateTime: string
  copyStates: { [k in CopyType]: boolean }
  onCopy: (text: string, type: CopyType) => void
}

export const CurrentTimeDisplay = memo<CurrentTimeDisplayProps>(
  ({ currentTimestamp, currentDateTime, copyStates, onCopy }) => {
    return (
      <Card className="border-border/60 bg-muted/20 shadow-sm">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Clock className="h-4 w-4" />
            当前时间
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            <div className="border-border/60 bg-background/70 rounded-md border px-3 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-0.5 text-[11px]">时间戳</p>
                  <p className="truncate font-mono text-sm font-semibold">{currentTimestamp}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-muted/60 hover:text-foreground h-7 w-7"
                  onClick={() => onCopy(currentTimestamp.toString(), 'timestamp')}
                >
                  {copyStates.timestamp ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="border-border/60 bg-background/70 rounded-md border px-3 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-muted-foreground mb-0.5 text-[11px]">日期时间</p>
                  <p className="truncate font-mono text-sm font-semibold">{currentDateTime}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-muted/60 hover:text-foreground h-7 w-7"
                  onClick={() => onCopy(currentDateTime, 'dateTime')}
                >
                  {copyStates.dateTime ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
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

CurrentTimeDisplay.displayName = 'CurrentTimeDisplay'
