'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp } from 'lucide-react'
import { useGameStore } from '../stores/game-store'

export const GameStats = () => {
  const { scores, gameMode, difficulty } = useGameStore()
  
  const totalGames = scores.X + scores.O + scores.draws
  const winRate = totalGames > 0 ? ((scores.X / totalGames) * 100).toFixed(1) : '0'
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          游戏统计
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基础统计 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalGames}</div>
            <div className="text-sm text-gray-600">总游戏数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{winRate}%</div>
            <div className="text-sm text-gray-600">胜率 (X)</div>
          </div>
        </div>

        {/* 详细分数 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">玩家 X 获胜</span>
            <Badge variant="outline" className="text-blue-600">
              {scores.X}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {gameMode === 'ai' ? 'AI' : '玩家'} O 获胜
            </span>
            <Badge variant="outline" className="text-red-600">
              {scores.O}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">平局</span>
            <Badge variant="outline" className="text-yellow-600">
              {scores.draws}
            </Badge>
          </div>
        </div>

        {/* 游戏模式信息 */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">游戏模式</span>
            <Badge variant={gameMode === 'ai' ? 'default' : 'secondary'}>
              {gameMode === 'ai' ? '人机对战' : '双人对战'}
            </Badge>
          </div>
          {gameMode === 'ai' && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">AI 难度</span>
              <Badge 
                variant="outline" 
                className={
                  difficulty === 'hard' ? 'text-red-600' :
                  difficulty === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }
              >
                {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
              </Badge>
            </div>
          )}
        </div>

        {/* 成就提示 */}
        {totalGames >= 10 && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <TrendingUp className="w-4 h-4" />
              <span>已完成 {totalGames} 场游戏！</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 