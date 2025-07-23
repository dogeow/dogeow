'use client'

import { Button } from '@/components/ui/button'
import { GameRulesDialog } from '@/components/ui/game-rules-dialog'
import { useTetrisGame } from './hooks/useTetrisGame'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { GameBoard } from './components/GameBoard'
import { NextPieceDisplay } from './components/NextPieceDisplay'
import { GameInfo } from './components/GameInfo'
import { MobileControls } from './components/MobileControls'

export default function TetrisGame() {
  const {
    gameState,
    isSoftDropping,
    movePiece,
    rotatePiece,
    hardDrop,
    startSoftDrop,
    stopSoftDrop,
    resetGame,
    togglePause,
    bestScore,
  } = useTetrisGame()

  // 键盘控制
  useKeyboardControls({
    movePiece,
    rotatePiece,
    hardDrop,
    togglePause,
    gameOver: gameState.gameOver,
  })

  return (
    <div className="container mx-auto max-w-7xl p-2 sm:p-4">
      <div className="mb-4 text-center sm:mb-6">
        <div className="mb-2 flex items-center justify-center gap-4">
          <h1 className="text-2xl font-bold sm:text-4xl">俄罗斯方块</h1>
          <GameRulesDialog
            title="俄罗斯方块游戏规则"
            rules={[
              '使用方向键移动和旋转方块',
              '空格键硬降，下方向键软降',
              'P键暂停游戏',
              '填满一行会自动消除并得分',
              '消除多行可获得更高分数',
              '方块堆到顶部游戏结束',
            ]}
          />
        </div>
        <p className="hidden text-sm text-gray-600 sm:block sm:text-base">
          使用方向键移动和旋转，空格键硬降，P键暂停
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* 游戏主体区域 - 模仿经典游戏机屏幕 */}
        <div className="flex justify-center">
          <div className="relative">
            {/* 游戏机外壳 */}
            <div className="rounded-2xl border-4 border-gray-400 bg-gradient-to-br from-gray-200 to-gray-300 p-6 shadow-2xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
              {/* 屏幕区域 */}
              <div className="relative overflow-hidden rounded-lg bg-black p-4 shadow-inner">
                {/* 背光效果 - 夜晚模式绿色，白天模式无背光 */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-transparent dark:from-green-400/10 dark:to-green-300/20"></div>

                <div className="relative z-10 flex gap-4">
                  {/* 主游戏区域 */}
                  <div className="flex flex-col">
                    <GameBoard board={gameState.board} currentPiece={gameState.currentPiece} />
                  </div>

                  {/* 右侧信息区域 */}
                  <div className="flex w-32 flex-col gap-3 sm:w-40">
                    {/* 下一个方块 */}
                    <NextPieceDisplay
                      nextPiece={gameState.nextPiece}
                      isClient={gameState.isClient}
                    />

                    {/* 得分信息 */}
                    <GameInfo
                      score={gameState.score}
                      lines={gameState.lines}
                      level={gameState.level}
                      bestScore={bestScore}
                    />

                    {/* 游戏状态 */}
                    {(gameState.gameOver || gameState.paused) && (
                      <div className="rounded border border-red-500/50 bg-gray-900 p-3">
                        <div className="text-center">
                          {gameState.gameOver && (
                            <div>
                              <div className="mb-2 font-mono text-xs text-red-400">GAME OVER</div>
                              <Button onClick={resetGame} size="sm" className="text-xs">
                                重新开始
                              </Button>
                            </div>
                          )}
                          {gameState.paused && !gameState.gameOver && (
                            <div className="font-mono text-xs text-yellow-400">PAUSED</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 移动端控制按钮 */}
        <MobileControls
          movePiece={movePiece}
          rotatePiece={rotatePiece}
          hardDrop={hardDrop}
          startSoftDrop={startSoftDrop}
          stopSoftDrop={stopSoftDrop}
          togglePause={togglePause}
          gameOver={gameState.gameOver}
          paused={gameState.paused}
          isSoftDropping={isSoftDropping}
        />
      </div>
    </div>
  )
}
