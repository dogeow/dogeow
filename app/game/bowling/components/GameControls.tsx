"use client"

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
  lastKnockedDown
}: GameControlsProps) {
  return (
    <>
      {/* 瞄准线和力度条 */}
      {canThrow && !ballThrown && (
        <div className="absolute bottom-30" style={{ left: '50%', transform: 'translateX(-50%)' }}>
          {/* 信息显示区域 - 放在右侧 */}
          <div className="absolute bottom-20 left-full ml-4 text-white text-sm bg-black/70 px-3 py-2 rounded-lg backdrop-blur-sm whitespace-nowrap">
            {isCharging ? (
              <div>
                <div className="font-bold text-lg">💪 {chargePower}%</div>
                <div className="text-xs">蓄力中...</div>
              </div>
            ) : (
              <div>
                <div className="font-semibold">角度: {currentAimAngle.toFixed(1)}°</div>
                {gyroSupported && gyroPermission && (
                  <div className="text-xs text-green-300 mt-1">🎯 陀螺仪已启用</div>
                )}
                {gyroSupported && !gyroPermission && (
                  <div className="text-xs text-yellow-300 mt-1">⚠️ 需要陀螺仪权限</div>
                )}
                {!gyroSupported && (
                  <div className="text-xs text-gray-300 mt-1">📱 手动控制</div>
                )}
              </div>
            )}
          </div>

          {/* 蓄力条 - 放在虚线上方独立显示 */}
          {isCharging && (
            <div className="absolute bottom-full mb-20 left-1/2 transform -translate-x-1/2">
              <div className="w-6 h-32 bg-gray-800/70 rounded-full p-1 backdrop-blur-sm">
                <div 
                  className="w-full rounded-full transition-all duration-75"
                  style={{ 
                    height: `${chargePower}%`,
                    background: `linear-gradient(to top, 
                      ${chargePower < 30 ? '#22c55e' : 
                        chargePower < 70 ? '#eab308' : '#ef4444'} 0%, 
                      ${chargePower < 30 ? '#16a34a' : 
                        chargePower < 70 ? '#ca8a04' : '#dc2626'} 100%)`,
                    boxShadow: '0 0 8px rgba(255,255,255,0.3)',
                    position: 'absolute',
                    bottom: 0
                  }}
                />
              </div>
            </div>
          )}

          {/* 瞄准虚线 */}
          <div 
            className="w-0.5 h-40 origin-bottom transition-transform duration-100"
            style={{ 
              transform: `rotate(${currentAimAngle}deg)`,
              transformOrigin: 'bottom center',
              background: 'repeating-linear-gradient(to top, #ef4444 0px, #ef4444 8px, transparent 8px, transparent 16px)'
            }}
          />
        </div>
      )}
      
      {/* 投球状态提示 */}
      {ballThrown && !showingResult && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-lg text-center">
          <div className="text-lg font-bold">🎳 投球中...</div>
          <div className="text-sm">球正在滚动</div>
        </div>
      )}
      
      {/* 结果显示 */}
      {showingResult && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white px-6 py-3 rounded-lg text-center animate-pulse">
          <div className="text-xl font-bold">🎯 投球结果</div>
          <div className="text-lg">
            击倒 <span className="text-yellow-300 font-bold">{lastKnockedDown}</span> 个球瓶
          </div>
          <div className="text-sm">
            剩余 <span className="text-red-300 font-bold">{10 - lastKnockedDown}</span> 个球瓶
          </div>
          {lastKnockedDown === 10 && (
            <div className="text-lg font-bold text-yellow-300 mt-1">🎉 全中！</div>
          )}
        </div>
      )}
    </>
  )
} 