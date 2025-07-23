'use client'

interface GameControlsProps {
  canThrow: boolean
  ballThrown: boolean
  showingResult: boolean
  isCharging: boolean
  chargePower: number
  currentAimAngle: number
  gyroSupported: boolean
  gyroPermission: boolean
  lastKnockedDown: number
}

export function GameControls({
  canThrow,
  ballThrown,
  showingResult,
  isCharging,
  chargePower,
  currentAimAngle,
  gyroSupported,
  gyroPermission,
  lastKnockedDown,
}: GameControlsProps) {
  return (
    <>
      {/* 瞄准线和力度条 */}
      {canThrow && !ballThrown && (
        <div className="absolute bottom-30" style={{ left: '50%', transform: 'translateX(-50%)' }}>
          {/* 信息显示区域 - 放在右侧 */}
          <div className="absolute bottom-20 left-full ml-4 rounded-lg bg-black/70 px-3 py-2 text-sm whitespace-nowrap text-white backdrop-blur-sm">
            {isCharging ? (
              <div>
                <div className="text-lg font-bold">💪 {chargePower}%</div>
                <div className="text-xs">蓄力中...</div>
              </div>
            ) : (
              <div>
                <div className="font-semibold">角度: {currentAimAngle.toFixed(1)}°</div>
                {gyroSupported && gyroPermission && (
                  <div className="mt-1 text-xs text-green-300">🎯 陀螺仪已启用</div>
                )}
                {gyroSupported && !gyroPermission && (
                  <div className="mt-1 text-xs text-yellow-300">⚠️ 需要陀螺仪权限</div>
                )}
                {!gyroSupported && <div className="mt-1 text-xs text-gray-300">📱 手动控制</div>}
              </div>
            )}
          </div>

          {/* 蓄力条 - 放在虚线上方独立显示 */}
          {isCharging && (
            <div className="absolute bottom-full left-1/2 mb-20 -translate-x-1/2 transform">
              <div className="h-32 w-6 rounded-full bg-gray-800/70 p-1 backdrop-blur-sm">
                <div
                  className="w-full rounded-full transition-all duration-75"
                  style={{
                    height: `${chargePower}%`,
                    background: `linear-gradient(to top, 
                      ${
                        chargePower < 30 ? '#22c55e' : chargePower < 70 ? '#eab308' : '#ef4444'
                      } 0%, 
                      ${
                        chargePower < 30 ? '#16a34a' : chargePower < 70 ? '#ca8a04' : '#dc2626'
                      } 100%)`,
                    boxShadow: '0 0 8px rgba(255,255,255,0.3)',
                    position: 'absolute',
                    bottom: 0,
                  }}
                />
              </div>
            </div>
          )}

          {/* 瞄准虚线 */}
          <div
            className="h-40 w-0.5 origin-bottom transition-transform duration-100"
            style={{
              transform: `rotate(${currentAimAngle}deg)`,
              transformOrigin: 'bottom center',
              background:
                'repeating-linear-gradient(to top, #ef4444 0px, #ef4444 8px, transparent 8px, transparent 16px)',
            }}
          />
        </div>
      )}

      {/* 投球状态提示 */}
      {ballThrown && !showingResult && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 transform rounded-lg bg-red-600/90 px-4 py-2 text-center text-white">
          <div className="text-lg font-bold">🎳 投球中...</div>
          <div className="text-sm">球正在滚动</div>
        </div>
      )}

      {/* 结果显示 */}
      {showingResult && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 transform animate-pulse rounded-lg bg-green-600/90 px-6 py-3 text-center text-white">
          <div className="text-xl font-bold">🎯 投球结果</div>
          <div className="text-lg">
            击倒 <span className="font-bold text-yellow-300">{lastKnockedDown}</span> 个球瓶
          </div>
          <div className="text-sm">
            剩余 <span className="font-bold text-red-300">{10 - lastKnockedDown}</span> 个球瓶
          </div>
          {lastKnockedDown === 10 && (
            <div className="mt-1 text-lg font-bold text-yellow-300">🎉 全中！</div>
          )}
        </div>
      )}
    </>
  )
}
