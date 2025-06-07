'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RotateCcw, Trophy, Users, Bot, User, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from './stores/game-store'
import { GameStats } from './components/game-stats'

const TicTacToe = () => {
  const {
    board,
    currentPlayer,
    winner,
    gameOver,
    gameMode,
    difficulty,
    scores,
    isAiThinking,
    makeMove,
    resetGame,
    resetScores,
    setGameMode,
    setDifficulty
  } = useGameStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主游戏区域 */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                  井字棋
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 游戏模式选择 */}
                <div className="flex justify-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={gameMode === 'pvp' ? 'default' : 'outline'}
                      onClick={() => setGameMode('pvp')}
                      className="flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      双人对战
                    </Button>
                    <Button
                      variant={gameMode === 'ai' ? 'default' : 'outline'}
                      onClick={() => setGameMode('ai')}
                      className="flex items-center gap-2"
                    >
                      <Bot className="w-4 h-4" />
                      人机对战
                    </Button>
                  </div>
                </div>

                {/* AI 难度选择 */}
                {gameMode === 'ai' && (
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">AI 难度:</span>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">简单</SelectItem>
                          <SelectItem value="medium">中等</SelectItem>
                          <SelectItem value="hard">困难</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* 分数显示 */}
                <div className="flex justify-center gap-4 mb-6">
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    <User className="w-4 h-4 mr-2" />
                    X: {scores.X}
                  </Badge>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    平局: {scores.draws}
                  </Badge>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {gameMode === 'ai' ? <Bot className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />}
                    O: {scores.O}
                  </Badge>
                </div>

                {/* 游戏状态 */}
                <div className="text-center mb-6">
                  <AnimatePresence mode="wait">
                    {isAiThinking ? (
                      <motion.div
                        key="thinking"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-xl text-blue-600 flex items-center justify-center gap-2"
                      >
                        <Loader2 className="w-5 h-5 animate-spin" />
                        AI 思考中...
                      </motion.div>
                    ) : winner ? (
                      <motion.div
                        key="winner"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-2xl font-bold text-green-600"
                      >
                        🎉 {gameMode === 'ai' && winner === 'O' ? 'AI' : `玩家 ${winner}`} 获胜！
                      </motion.div>
                    ) : gameOver ? (
                      <motion.div
                        key="draw"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-2xl font-bold text-yellow-600"
                      >
                        🤝 平局！
                      </motion.div>
                    ) : (
                      <motion.div
                        key="current"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="text-xl text-gray-700"
                      >
                        当前玩家: <span className="font-bold text-blue-600">
                          {gameMode === 'ai' && currentPlayer === 'O' ? 'AI (O)' : `${currentPlayer}`}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 游戏棋盘 */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-6">
                  {board.map((cell, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: cell ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => makeMove(index)}
                      className={`
                        aspect-square bg-white border-2 border-gray-300 rounded-lg
                        text-4xl font-bold transition-all duration-200
                        hover:border-blue-400 hover:shadow-md
                        ${cell ? 'cursor-default' : 'cursor-pointer'}
                        ${cell === 'X' ? 'text-blue-600' : 'text-red-600'}
                        ${isAiThinking && gameMode === 'ai' ? 'pointer-events-none opacity-50' : ''}
                      `}
                      disabled={!!cell || gameOver || isAiThinking}
                    >
                      <AnimatePresence>
                        {cell && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            {cell}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </div>

                {/* 控制按钮 */}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={resetGame}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isAiThinking}
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新开始
                  </Button>
                  <Button
                    onClick={resetScores}
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    disabled={isAiThinking}
                  >
                    重置分数
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 游戏规则 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">游戏规则</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• 两名玩家轮流在 3×3 的棋盘上放置标记（X 和 O）</p>
                <p>• 率先在横、竖或斜线上连成三个标记的玩家获胜</p>
                <p>• 如果棋盘填满且无人获胜，则为平局</p>
                <p>• 点击&ldquo;重新开始&rdquo;可以开始新一轮游戏</p>
                <p>• 人机对战模式下，你是 X，AI 是 O</p>
                <p>• AI 有三种难度：简单（随机）、中等（混合策略）、困难（最优策略）</p>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏统计 */}
          <div className="lg:col-span-1">
            <GameStats />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TicTacToe 