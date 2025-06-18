"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useBowlingStore } from "../store"
import { HelpCircle } from "lucide-react"

export function GameControls() {
  const {
    canThrow,
    ballThrown,
    gyroSupported,
    gyroPermission,
    tiltX,
    tiltY,
    throwBall,
    setPower,
    resetGame
  } = useBowlingStore()

  const [isCharging, setIsCharging] = useState(false)
  const [chargePower, setChargePower] = useState(0)
  const [showHelp, setShowHelp] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const chargeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 确保只在客户端渲染陀螺仪状态
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 开始蓄力
  const startCharging = () => {
    if (!canThrow || ballThrown) return
    
    setIsCharging(true)
    setChargePower(20) // 起始力度
    
    chargeIntervalRef.current = setInterval(() => {
      setChargePower(prev => {
        const next = prev + 2
        return next > 100 ? 20 : next // 循环蓄力
      })
    }, 50)
  }

  // 结束蓄力并投球
  const endCharging = () => {
    if (!isCharging) return
    
    setIsCharging(false)
    if (chargeIntervalRef.current) {
      clearInterval(chargeIntervalRef.current)
      chargeIntervalRef.current = null
    }
    
    // 设置力度并投球
    setPower(chargePower)
    throwBall()
    setChargePower(0)
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (chargeIntervalRef.current) {
        clearInterval(chargeIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className="bg-amber-800/30 p-6 rounded-lg space-y-4 w-full max-w-md">
      {/* 标题和帮助按钮 */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-lg">🎮 游戏控制</h3>
        <Button
          onClick={() => setShowHelp(!showHelp)}
          variant="ghost"
          size="sm"
          className="text-amber-200 hover:text-white"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>

      {/* 帮助信息 */}
      {showHelp && (
        <div className="bg-amber-700/50 p-4 rounded-lg text-amber-100 text-sm space-y-2">
          <h4 className="font-bold text-amber-50">🎯 游戏说明</h4>
          <div className="space-y-1">
            <p>📱 <strong>瞄准：</strong>左右倾斜设备调整角度</p>
            <p>🎳 <strong>投球：</strong>按住投球按钮蓄力，松开发射</p>
            <p>💪 <strong>力度：</strong>按住时间越长，力度越大</p>
            <p>🎯 <strong>目标：</strong>击倒所有球瓶得分</p>
          </div>
        </div>
      )}

      {/* 力度显示（仅在蓄力时显示） */}
      {isCharging && (
        <div className="space-y-2">
          <div className="text-center">
            <div className="text-white text-2xl font-bold">
              💪 {chargePower}%
            </div>
            <div className="text-amber-200 text-sm">蓄力中...</div>
          </div>
          <div className="bg-amber-900 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-full transition-all duration-75"
              style={{ width: `${chargePower}%` }}
            />
          </div>
        </div>
      )}

      {/* 投球按钮 */}
      <div className="flex space-x-3">
        <Button
          onMouseDown={startCharging}
          onMouseUp={endCharging}
          onTouchStart={startCharging}
          onTouchEnd={endCharging}
          disabled={!canThrow || ballThrown}
          className={`flex-1 font-bold py-6 text-lg transition-all ${
            isCharging 
              ? 'bg-yellow-500 hover:bg-yellow-600 text-black animate-pulse' 
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {ballThrown ? "🎳 投球中..." : isCharging ? "🔥 蓄力中" : "🎳 按住投球"}
        </Button>
        
        <Button
          onClick={() => {
            console.log('🔄 手动重置游戏')
            resetGame()
          }}
          variant="outline"
          className="px-4 bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200"
          title="重置游戏"
        >
          🔄
        </Button>
      </div>

      {/* 陀螺仪状态 - 只在客户端渲染 */}
      {isClient && (
        <div className="text-center text-sm">
          {gyroSupported ? (
            gyroPermission ? (
              <div className="text-green-400">
                <div>✅ 陀螺仪已启用</div>
                {!showHelp && (
                  <div className="text-xs mt-1 text-amber-300">
                    倾斜: {tiltX.toFixed(2)}, {tiltY.toFixed(2)}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-yellow-400">
                ⚠️ 等待陀螺仪权限...
              </div>
            )
          ) : (
            <div className="text-red-400">
              ❌ 此设备不支持陀螺仪
            </div>
          )}
        </div>
      )}
    </div>
  )
} 