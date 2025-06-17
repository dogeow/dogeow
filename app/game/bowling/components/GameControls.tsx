"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useBowlingStore } from "../store"

export function GameControls() {
  const {
    aimAngle,
    power,
    canThrow,
    ballThrown,
    sensitivity,
    gyroSupported,
    gyroPermission,
    tiltX,
    tiltY,
    throwBall,
    setAimAngle,
    setPower,
    setSensitivity,
    resetGame
  } = useBowlingStore()

  return (
    <div className="bg-amber-800/30 p-6 rounded-lg space-y-4 w-full max-w-md">
      <h3 className="text-white font-bold text-lg text-center">🎮 游戏控制</h3>
      
      {/* 瞄准角度控制 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-amber-100 text-sm font-medium">
            瞄准角度: {aimAngle.toFixed(1)}°
          </label>
          {gyroSupported && gyroPermission && (
            <span className="text-green-400 text-xs">
              陀螺仪: {tiltX.toFixed(2)}
            </span>
          )}
        </div>
        <Slider
          value={[aimAngle]}
          onValueChange={(value) => setAimAngle(value[0])}
          min={-30}
          max={30}
          step={0.5}
          disabled={gyroSupported && gyroPermission && canThrow}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-amber-200">
          <span>← 左</span>
          <span>中心</span>
          <span>右 →</span>
        </div>
      </div>

      {/* 力度控制 */}
      <div className="space-y-2">
        <label className="text-amber-100 text-sm font-medium">
          投球力度: {power}%
        </label>
        <Slider
          value={[power]}
          onValueChange={(value) => setPower(value[0])}
          min={20}
          max={100}
          step={5}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-amber-200">
          <span>轻</span>
          <span>中</span>
          <span>重</span>
        </div>
      </div>

      {/* 陀螺仪灵敏度 */}
      {gyroSupported && (
        <div className="space-y-2">
          <label className="text-amber-100 text-sm font-medium">
            陀螺仪灵敏度: {sensitivity.toFixed(1)}
          </label>
          <Slider
            value={[sensitivity]}
            onValueChange={(value) => setSensitivity(value[0])}
            min={0.1}
            max={2.0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-amber-200">
            <span>低</span>
            <span>中</span>
            <span>高</span>
          </div>
        </div>
      )}

      {/* 投球按钮 */}
      <div className="flex space-x-3">
        <Button
          onClick={throwBall}
          disabled={!canThrow || ballThrown}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3"
        >
          {ballThrown ? "🎳 投球中..." : "🎳 投球"}
        </Button>
        
        <Button
          onClick={resetGame}
          variant="outline"
          className="px-4 bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200"
        >
          🔄
        </Button>
      </div>

      {/* 陀螺仪状态 */}
      <div className="text-center text-sm">
        {gyroSupported ? (
          gyroPermission ? (
            <div className="text-green-400">
              <div>✅ 陀螺仪已启用</div>
              <div className="text-xs mt-1">
                倾斜: X={tiltX.toFixed(2)}, Y={tiltY.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-yellow-400">
              ⚠️ 等待陀螺仪权限...
            </div>
          )
        ) : (
          <div className="text-red-400">
            ❌ 陀螺仪不支持
          </div>
        )}
      </div>

      {/* 操作提示 */}
      <div className="text-center text-xs text-amber-200 space-y-1">
        {gyroSupported && gyroPermission ? (
          <div>
            <p>📱 左右倾斜设备来瞄准</p>
            <p>🎯 点击投球按钮发射</p>
          </div>
        ) : (
          <div>
            <p>💻 拖动滑块调整角度和力度</p>
            <p>🎳 点击投球按钮发射</p>
          </div>
        )}
      </div>
    </div>
  )
} 