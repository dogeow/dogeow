'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp } from 'lucide-react'
import { useGameStore } from '../stores/game-store'
import { useTranslation } from '@/hooks/useTranslation'

export const GameStats = () => {
  const { t } = useTranslation()
  const { scores, gameMode } = useGameStore()

  const totalGames = scores.X + scores.O + scores.draws
  const winRate = totalGames > 0 ? ((scores.X / totalGames) * 100).toFixed(1) : '0'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('game.tictactoe.stats.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基础统计 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalGames}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('game.tictactoe.stats.total_games')}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{winRate}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {t('game.tictactoe.stats.win_rate_x')}
            </div>
          </div>
        </div>

        {/* 详细分数 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t('game.tictactoe.stats.player_x_wins')}
            </span>
            <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
              {scores.X}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {gameMode === 'ai' ? 'AI' : '玩家'} O {t('game.tictactoe.stats.player_o_wins')}
            </span>
            <Badge variant="outline" className="text-red-600 dark:text-red-400">
              {scores.O}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {t('game.tictactoe.stats.draws')}
            </span>
            <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
              {scores.draws}
            </Badge>
          </div>
        </div>

        {/* 成就提示 */}
        {totalGames >= 10 && (
          <div className="border-t pt-4 dark:border-gray-600">
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <TrendingUp className="h-4 w-4" />
              <span>
                {t('game.tictactoe.achievement').replace('{count}', totalGames.toString())}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
