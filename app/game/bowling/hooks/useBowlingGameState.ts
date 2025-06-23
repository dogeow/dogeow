import { useRef, useEffect, useCallback } from "react"
import { useBowlingStore } from "../store"

interface GameStateRefs {
  ballThrownRef: React.RefObject<boolean>
  canThrowRef: React.RefObject<boolean>
  showingResultRef: React.RefObject<boolean>
  isProcessingResultRef: React.RefObject<boolean>
  isMountedRef: React.RefObject<boolean>
}

export function useBowlingGameState() {
  // 创建所有需要的refs
  const ballThrownRef = useRef(false)
  const canThrowRef = useRef(true)
  const showingResultRef = useRef(false)
  const isProcessingResultRef = useRef(false)
  const isMountedRef = useRef(false)

  const {
    ballThrown,
    canThrow,
    showingResult,
    currentFrame,
    currentThrow,
    processThrowResult,
  } = useBowlingStore()

  // 同步状态到refs
  useEffect(() => {
    ballThrownRef.current = ballThrown
    console.log('🎳 ballThrown状态更新:', ballThrown)
  }, [ballThrown])

  useEffect(() => {
    canThrowRef.current = canThrow
  }, [canThrow])

  useEffect(() => {
    showingResultRef.current = showingResult
  }, [showingResult])

  // 处理投球结果
  const handleResultProcessed = useCallback((knockedDownCount: number) => {
    if (showingResult) {
      console.log('⚠️ 结果正在显示中，跳过处理')
      return
    }
    console.log(`🎳 最终击倒球瓶数: ${knockedDownCount}`)
    processThrowResult(knockedDownCount)
    isProcessingResultRef.current = false
  }, [processThrowResult, showingResult])

  // 重置处理状态
  const resetProcessingState = useCallback(() => {
    isProcessingResultRef.current = false
  }, [])

  // 设置已挂载状态
  const setMounted = useCallback(() => {
    isMountedRef.current = true
  }, [])

  const refs: GameStateRefs = {
    ballThrownRef,
    canThrowRef,
    showingResultRef,
    isProcessingResultRef,
    isMountedRef
  }

  return {
    refs,
    gameState: {
      ballThrown,
      canThrow,
      showingResult,
      currentFrame,
      currentThrow
    },
    handleResultProcessed,
    resetProcessingState,
    setMounted
  }
} 