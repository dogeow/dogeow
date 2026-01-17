import React, { memo } from 'react'
import { Button } from '@/components/ui/button'

interface CompletionMessageProps {
  startTime: Date
  bestTime: number
  onReset: () => void
}

export const CompletionMessage = memo<CompletionMessageProps>(
  ({ startTime, bestTime, onReset }) => {
    const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
    const isNewRecord = bestTime > 0 && bestTime === completionTime

    return (
      <div className="mt-4 animate-bounce text-center">
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 shadow-lg">
          <p className="mb-2 text-xl font-bold text-green-600">🎉 恭喜完成！</p>
          <div className="mb-3 text-sm text-gray-600">
            <p>用时 {completionTime} 秒</p>
            {isNewRecord && (
              <p className="mt-1 font-medium text-green-600">⚡ 新的最佳时间记录！</p>
            )}
          </div>
          <Button onClick={onReset} className="mt-2" size="sm">
            再玩一次
          </Button>
        </div>
      </div>
    )
  }
)

CompletionMessage.displayName = 'CompletionMessage'
