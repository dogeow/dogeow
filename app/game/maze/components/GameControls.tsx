"use client"

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { useMazeStore } from '../store'
import { Play, Pause, RotateCcw, SkipForward, Settings } from 'lucide-react'
import { useState } from 'react'

export function GameControls() {
  const {
    isPlaying,
    isPaused,
    gameWon,
    level,
    sensitivity,
    gyroSupported,
    gyroPermission,
    ball,
    maze,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    nextLevel,
    setSensitivity,
    requestGyroPermission
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

            {/* 灵敏度设置 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                控制灵敏度: {sensitivity.toFixed(1)}
              </label>
              <Slider
                value={[sensitivity]}
                onValueChange={(value) => setSensitivity(value[0])}
                min={0.1}
                max={1.0}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* 陀螺仪状态 */}
            <div>
              <h4 className="text-sm font-medium mb-2">陀螺仪控制</h4>
              <div className="text-sm text-slate-600 space-y-2">
                <div className="text-xs">
                  设备: {navigator.userAgent.includes('iPhone') ? 'iPhone' : 
                         navigator.userAgent.includes('iPad') ? 'iPad' : 
                         navigator.userAgent.includes('Android') ? 'Android' : 'Desktop'}
                </div>
                {!gyroSupported ? (
                  <span className="text-red-500">❌ 设备不支持陀螺仪</span>
                ) : !gyroPermission ? (
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-500">⚠️ 需要权限</span>
                    <Button
                      onClick={requestGyroPermission}
                      size="sm"
                      variant="outline"
                    >
                      请求权限
                    </Button>
                  </div>
                ) : (
                  <span className="text-green-500">✅ 陀螺仪已启用</span>
                )}
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
              <div>小球速度: ({ball.vx.toFixed(2)}, {ball.vy.toFixed(2)})</div>
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

  const handleMove = (dx: number, dy: number) => {
    if (!isPlaying || isPaused) return
    moveBall(dx, dy)
  }

  const buttonClass = "w-12 h-12 rounded-lg bg-slate-600 hover:bg-slate-500 active:bg-slate-400 flex items-center justify-center text-white font-bold select-none"

  return (
    <div className="grid grid-cols-3 gap-2 w-fit mx-auto">
      <div></div>
      <button
        className={buttonClass}
        onTouchStart={() => handleMove(0, -1)}
        onMouseDown={() => handleMove(0, -1)}
      >
        ↑
      </button>
      <div></div>
      
      <button
        className={buttonClass}
        onTouchStart={() => handleMove(-1, 0)}
        onMouseDown={() => handleMove(-1, 0)}
      >
        ←
      </button>
      <div className="w-12 h-12"></div>
      <button
        className={buttonClass}
        onTouchStart={() => handleMove(1, 0)}
        onMouseDown={() => handleMove(1, 0)}
      >
        →
      </button>
      
      <div></div>
      <button
        className={buttonClass}
        onTouchStart={() => handleMove(0, 1)}
        onMouseDown={() => handleMove(0, 1)}
      >
        ↓
      </button>
      <div></div>
    </div>
  )
} 