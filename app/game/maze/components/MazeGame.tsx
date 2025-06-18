"use client"

import { useEffect, useCallback, useRef } from 'react'
import { useMazeStore } from '../store'
import MazeCanvas from './MazeCanvas'

export default function MazeGame() {
  const {
    moveToPosition,
    gameStarted,
    gameCompleted,
    isAutoMoving,
    mazeSize,
    cameraConfig
  } = useMazeStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 将屏幕坐标转换为迷宫网格坐标
  const screenToMazeCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return null
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    // 获取canvas内的相对坐标 (0 到 canvas尺寸)
    const x = clientX - rect.left
    const y = clientY - rect.top
    
    // 转换为标准化坐标 (0 到 1)
    const normalizedX = x / rect.width
    const normalizedY = y / rect.height
    
    // 根据视角模式进行不同的坐标转换
    let mazeX: number, mazeY: number
    
    if (cameraConfig.mode === 'top') {
      // 俯视模式：直接映射到迷宫网格
      const margin = 0.05 // 迷宫周围的边距
      const effectiveX = (normalizedX - margin) / (1 - 2 * margin)
      const effectiveY = (normalizedY - margin) / (1 - 2 * margin)
      
      // 确保在有效范围内
      const clampedX = Math.max(0, Math.min(1, effectiveX))
      const clampedY = Math.max(0, Math.min(1, effectiveY))
      
      mazeX = Math.floor(clampedX * mazeSize)
      mazeY = Math.floor(clampedY * mazeSize)
    } else if (cameraConfig.mode === 'follow') {
      // 2.5D模式：使用更精确的坐标转换
      const viewportStartX = 0.12
      const viewportEndX = 0.88
      const viewportStartY = 0.20
      const viewportEndY = 0.80
      
      // 检查点击是否在迷宫显示区域内
      if (normalizedX >= viewportStartX && normalizedX <= viewportEndX &&
          normalizedY >= viewportStartY && normalizedY <= viewportEndY) {
        
        // 将屏幕坐标映射到迷宫网格
        const relativeX = (normalizedX - viewportStartX) / (viewportEndX - viewportStartX)
        const relativeY = (normalizedY - viewportStartY) / (viewportEndY - viewportStartY)
        
        mazeX = Math.floor(relativeX * mazeSize)
        mazeY = Math.floor(relativeY * mazeSize)
      } else {
        // 点击在迷宫区域外，使用最接近的边界点
        const clampedX = Math.max(viewportStartX, Math.min(viewportEndX, normalizedX))
        const clampedY = Math.max(viewportStartY, Math.min(viewportEndY, normalizedY))
        
        const relativeX = (clampedX - viewportStartX) / (viewportEndX - viewportStartX)
        const relativeY = (clampedY - viewportStartY) / (viewportEndY - viewportStartY)
        
        mazeX = Math.floor(relativeX * mazeSize)
        mazeY = Math.floor(relativeY * mazeSize)
      }
    } else {
      // 第一人称模式：简单映射
      mazeX = Math.floor(normalizedX * mazeSize)
      mazeY = Math.floor(normalizedY * mazeSize)
    }
    
    // 确保坐标在有效范围内
    mazeX = Math.max(0, Math.min(mazeSize - 1, mazeX))
    mazeY = Math.max(0, Math.min(mazeSize - 1, mazeY))
    
    // 特殊处理：如果点击在终点附近，优先识别为终点
    const endpointX = mazeSize - 1
    const endpointY = mazeSize - 1
    const distanceToEndpoint = Math.abs(mazeX - endpointX) + Math.abs(mazeY - endpointY)
    
    if (distanceToEndpoint <= 1) {
      mazeX = endpointX
      mazeY = endpointY
    }
    
    return { x: mazeX, y: mazeY }
  }, [mazeSize, cameraConfig.mode])

  // 处理画布点击
  const handleCanvasClick = useCallback((event: MouseEvent) => {
    if (!gameStarted || gameCompleted || isAutoMoving) {
      return
    }

    const coordinates = screenToMazeCoordinates(event.clientX, event.clientY)
    if (!coordinates) return

    moveToPosition(coordinates.x, coordinates.y)
  }, [gameStarted, gameCompleted, isAutoMoving, screenToMazeCoordinates, moveToPosition])

  // 处理触摸点击
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!gameStarted || gameCompleted || isAutoMoving) {
      return
    }

    event.preventDefault()
    
    if (event.changedTouches.length > 0) {
      const touch = event.changedTouches[0]
      const coordinates = screenToMazeCoordinates(touch.clientX, touch.clientY)
      if (!coordinates) return

      moveToPosition(coordinates.x, coordinates.y)
    }
  }, [gameStarted, gameCompleted, isAutoMoving, screenToMazeCoordinates, moveToPosition])

  // 绑定事件监听器
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('click', handleCanvasClick)
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('click', handleCanvasClick)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleCanvasClick, handleTouchEnd])

  return (
    <div className="relative w-full h-full">
      <MazeCanvas ref={canvasRef} />
      

      
      {gameCompleted && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 rounded-lg">
          <div className="text-white text-center">
            <h3 className="text-2xl font-bold mb-2">🎉 恭喜通关！</h3>
            <p className="text-sm opacity-90">你成功走出了迷宫</p>
          </div>
        </div>
      )}
    </div>
  )
} 