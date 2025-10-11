import { Card } from '@/components/ui/card'

interface GameStatsProps {
  gamesCompleted: number
  bestTime: number | null
  totalPiecesPlaced: number
}

/**
 * 游戏统计信息组件
 */
export function GameStats({ gamesCompleted, bestTime, totalPiecesPlaced }: GameStatsProps) {
  if (gamesCompleted === 0) return null

  return (
    <Card className="w-full max-w-md p-3">
      <h4 className="mb-2 text-sm font-medium text-gray-600">个人记录</h4>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">最佳时间:</span>
          <span className="font-mono">
            {bestTime
              ? `${Math.floor(bestTime / 60)}:${(bestTime % 60).toString().padStart(2, '0')}`
              : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">完成次数:</span>
          <span className="font-mono">{gamesCompleted}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">总拼图块:</span>
          <span className="font-mono">{totalPiecesPlaced}</span>
        </div>
      </div>
    </Card>
  )
}
