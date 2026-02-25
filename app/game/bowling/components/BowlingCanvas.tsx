'use client'

import { useRef, useEffect } from 'react'
import { useBowlingStore } from '../store'
import { GameControls } from './GameControls'
import { useBowlingControls } from '../hooks/useBowlingControls'
import { useBowlingScene } from '../hooks/useBowlingScene'
import { useBowlingAnimation } from '../hooks/useBowlingAnimation'
import { useBowlingGameState } from '../hooks/useBowlingGameState'

export function BowlingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 获取store状态
  const { aimAngle, power, lastKnockedDown, gyroSupported, gyroPermission } = useBowlingStore()

  // 游戏状态管理
  const { refs, gameState, handleResultProcessed, resetProcessingState, setMounted } =
    useBowlingGameState()

  // 场景管理
  const { sceneRef, isMounted, resetBall, resetScene, throwBall, calculateKnockedDownPins } =
    useBowlingScene(canvasRef)

  // 控制逻辑
  const {
    isCharging,
    chargePower,
    currentAimAngle,
    isDragging,
    startCharging,
    endCharging,
    updateManualAngle,
  } = useBowlingControls()

  // 处理投球结果的回调
  const onResultProcessed = () => {
    const knockedDownCount = calculateKnockedDownPins()
    handleResultProcessed(knockedDownCount)
  }

  // 动画循环
  useBowlingAnimation({
    sceneRef,
    showingResult: gameState.showingResult,
    ballThrownRef: refs.ballThrownRef,
    isProcessingResultRef: refs.isProcessingResultRef,
    onResultProcessed,
  })

  // 处理鼠标/触摸移动事件
  useEffect(() => {
    if (!isDragging || !isCharging) return

    const handleMouseMove = (event: MouseEvent) => {
      if (canvasRef.current) {
        updateManualAngle(event, canvasRef.current)
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      event.preventDefault()
      if (canvasRef.current) {
        updateManualAngle(event, canvasRef.current)
      }
    }

    const handleMouseUp = () => endCharging()
    const handleTouchEnd = () => endCharging()

    if (!gyroSupported || !gyroPermission) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isDragging, isCharging, gyroSupported, gyroPermission, updateManualAngle, endCharging])

  // 重置效果 - 新一轮时完全重置
  useEffect(() => {
    if (isMounted.current && !gameState.showingResult) {
      console.log(`GAME: New frame detected (${gameState.currentFrame}). Performing full reset.`)
      resetScene()
      resetProcessingState()
    }
  }, [gameState.currentFrame, resetScene, resetProcessingState, gameState.showingResult, isMounted])

  // 重置效果 - 第二次投球时只重置球
  useEffect(() => {
    if (isMounted.current && gameState.currentThrow === 2 && !gameState.showingResult) {
      console.log(
        `GAME: Second throw detected in frame ${gameState.currentFrame}. Resetting ball only.`
      )
      resetBall()
      resetProcessingState()
    }
  }, [
    gameState.currentThrow,
    gameState.currentFrame,
    resetBall,
    resetProcessingState,
    gameState.showingResult,
    isMounted,
  ])

  // 监听投球事件
  useEffect(() => {
    if (!gameState.ballThrown || !sceneRef.current?.ball) return

    // eslint-disable-next-line react-hooks/immutability -- refs.current 为合法的可变写入
    refs.ballThrownRef.current = true
    console.log('🎳 Three.js 投球！', { aimAngle, power })

    throwBall(aimAngle, power)
  }, [gameState.ballThrown, aimAngle, power, throwBall, refs.ballThrownRef, sceneRef])

  // 场景初始化完成后设置挂载状态
  useEffect(() => {
    if (sceneRef.current) {
      setMounted()
    }
  }, [sceneRef, setMounted])

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-lg bg-gradient-to-b from-sky-200 to-sky-100">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-pointer"
        style={{ display: 'block' }}
        onMouseDown={e => startCharging(e, canvasRef.current || undefined)}
        onMouseUp={endCharging}
        onMouseLeave={endCharging}
        onTouchStart={e => {
          e.preventDefault()
          startCharging(e, canvasRef.current || undefined)
        }}
        onTouchEnd={e => {
          e.preventDefault()
          endCharging()
        }}
        onTouchCancel={e => {
          e.preventDefault()
          endCharging()
        }}
      />

      <GameControls
        canThrow={gameState.canThrow}
        ballThrown={gameState.ballThrown}
        showingResult={gameState.showingResult}
        isCharging={isCharging}
        chargePower={chargePower}
        currentAimAngle={currentAimAngle}
        gyroSupported={gyroSupported}
        gyroPermission={gyroPermission}
        lastKnockedDown={lastKnockedDown}
      />
    </div>
  )
}
