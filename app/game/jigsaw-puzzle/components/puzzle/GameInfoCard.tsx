import React, { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import { Timer } from './Timer'
import type { PuzzlePiece } from '../../../utils/puzzleUtils'

interface GameInfoCardProps {
  pieces: PuzzlePiece[]
  startTime: Date
  isComplete: boolean
  showFloatingReference: boolean
  onToggleReference: () => void
  onReset: () => void
}

export const GameInfoCard = memo<GameInfoCardProps>(
  ({ pieces, startTime, isComplete, showFloatingReference, onToggleReference, onReset }) => {
    const placedCount = pieces.filter(p => p.isPlaced).length
    const totalCount = pieces.length
    const progress = totalCount > 0 ? (placedCount / totalCount) * 100 : 0

    return (
      <Card className="w-full max-w-4xl p-4">
        <div className="flex flex-col space-y-3">
          {/* 主要游戏信息 */}
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-sm text-gray-500">已完成</div>
              <div className="font-semibold">
                {placedCount}/{totalCount}
              </div>
            </div>
            <Timer startTime={startTime} isComplete={isComplete} />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onToggleReference}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                {showFloatingReference ? '隐藏' : '显示'}参考
              </Button>
              <Button variant="outline" size="sm" onClick={onReset}>
                重新开始
              </Button>
            </div>
          </div>

          {/* 进度条 */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-gray-500">完成进度</span>
              <span className="text-xs font-medium text-gray-700">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>
    )
  }
)

GameInfoCard.displayName = 'GameInfoCard'
