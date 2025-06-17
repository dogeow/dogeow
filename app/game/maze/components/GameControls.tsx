"use client"

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useMazeStore } from '../store'
import { Play, Pause, RotateCcw, SkipForward, Settings } from 'lucide-react'
import { useState } from 'react'

export function GameControls() {
  const {
    isPlaying,
    isPaused,
    gameWon,
    level,
    ball,
    maze,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    nextLevel
  } = useMazeStore()

  const [showSettings, setShowSettings] = useState(false)

  const handlePlayPause = () => {
    if (!isPlaying) {
      startGame()
    } else if (isPaused) {
      resumeGame()
    } else {
      pauseGame()
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* 主要控制按钮 */}
      <div className="flex items-center space-x-4">
        <Button
          onClick={handlePlayPause}
          className="flex items-center space-x-2 px-6 py-3"
          variant={isPlaying && !isPaused ? "secondary" : "default"}
        >
          {!isPlaying ? (
            <>
              <Play className="w-4 h-4" />
              <span>开始游戏</span>
            </>
          ) : isPaused ? (
            <>
              <Play className="w-4 h-4" />
              <span>继续</span>
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              <span>暂停</span>
            </>
          )}
        </Button>

        <Button
          onClick={resetGame}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重置</span>
        </Button>

        {gameWon && (
          <Button
            onClick={nextLevel}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <SkipForward className="w-4 h-4" />
            <span>下一关</span>
          </Button>
        )}

        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="outline"
          size="icon"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <Card className="p-4 w-full max-w-md">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">游戏设置</h3>
            </div>

            {/* 控制说明 */}
            <div>
              <h4 className="text-sm font-medium mb-2">控制方式</h4>
              <div className="text-sm text-slate-600 space-y-1">
                <div>• PC端：WASD或方向键</div>
                <div>• 手机端：手势滑动</div>
                <div>• 智能移动：自动移动到岔口或墙壁</div>
              </div>
            </div>

            {/* 当前关卡 */}
            <div>
              <label className="block text-sm font-medium">
                当前关卡: {level}
              </label>
            </div>

            {/* 调试信息 */}
            <div className="text-xs text-slate-500 border-t pt-2">
              <div>游戏状态: {isPlaying ? '进行中' : '未开始'} {isPaused ? '(暂停)' : ''}</div>
              <div>小球位置: ({ball.x.toFixed(1)}, {ball.y.toFixed(1)})</div>
              <div>迷宫生成: {maze.length > 0 ? '是' : '否'}</div>
            </div>
          </div>
        </Card>
      )}

      {/* 虚拟方向键（移动端） */}
      <div className="block md:hidden">
        <Card className="p-4">
          <div className="text-center mb-2 text-sm text-slate-600">
            虚拟方向键
          </div>
          <VirtualDPad />
        </Card>
      </div>
    </div>
  )
}

function VirtualDPad() {
  const { moveBall, isPlaying, isPaused } = useMazeStore()

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isPlaying || isPaused) return
    moveBall(direction)
  }

  const buttonClass = "w-12 h-12 rounded-lg bg-slate-600 hover:bg-slate-500 active:bg-slate-400 flex items-center justify-center text-white font-bold select-none"

  return (
    <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
      <div></div>
      <button
        className={buttonClass}
        onTouchStart={() => handleMove('up')}
        onMouseDown={() => handleMove('up')}
      >
        ↑
      </button>
      <div></div>
      
      <button
        className={buttonClass}
        onTouchStart={() => handleMove('left')}
        onMouseDown={() => handleMove('left')}
      >
        ←
      </button>
      <div className="w-12 h-12"></div>
      <button
        className={buttonClass}
        onTouchStart={() => handleMove('right')}
        onMouseDown={() => handleMove('right')}
      >
        →
      </button>
      
      <div></div>
      <button
        className={buttonClass}
        onTouchStart={() => handleMove('down')}
        onMouseDown={() => handleMove('down')}
      >
        ↓
      </button>
      <div></div>
    </div>
  )
} 