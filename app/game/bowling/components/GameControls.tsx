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
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2" style={{ left: '61%' }}>
          <div 
            className="w-0.5 h-50 origin-bottom transition-transform duration-100 relative"
            style={{ 
              transform: `translateX(-50%) rotate(${currentAimAngle}deg)`,
              transformOrigin: 'bottom center',
              background: 'repeating-linear-gradient(to top, #ef4444 0px, #ef4444 8px, transparent 8px, transparent 16px)'
            }}
          >
            {/* 力度条叠加在虚线上 */}
            {isCharging && (
              <div 
                className="absolute bottom-0 left-0 w-full transition-all duration-75"
                style={{ 
                  height: `${chargePower}%`,
                  background: `linear-gradient(to top, 
                    ${chargePower < 30 ? '#22c55e' : 
                      chargePower < 70 ? '#eab308' : '#ef4444'} 0%, 
                    ${chargePower < 30 ? '#16a34a' : 
                      chargePower < 70 ? '#ca8a04' : '#dc2626'} 100%)`,
                  opacity: 0.9,
                  borderRadius: '1px',
                  boxShadow: '0 0 4px rgba(255,255,255,0.5)'
                }}
              />
            )}
          </div>
          <div className="text-center text-white text-sm mt-2 bg-black/50 px-2 py-1 rounded">
            {isCharging ? (
              <div>
                <div className="font-bold">💪 {chargePower}%</div>
                <div className="text-xs">蓄力中...</div>
              </div>
            ) : (
              <div>
                <div>角度: {currentAimAngle.toFixed(1)}°</div>
                {gyroSupported && gyroPermission && (
                  <div className="text-xs text-green-300">🎯 陀螺仪已启用</div>
                )}
                {gyroSupported && !gyroPermission && (
                  <div className="text-xs text-yellow-300">⚠️ 需要陀螺仪权限</div>
                )}
                {!gyroSupported && (
                  <div className="text-xs text-gray-300">📱 手动控制</div>
                )}
              </div>
            )}
          </div>
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