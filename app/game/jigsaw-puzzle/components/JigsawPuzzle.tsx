"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useJigsawStats } from "../hooks/useJigsawStats"

// 计时器组件
function Timer({ startTime }: { startTime: Date }) {
  const [time, setTime] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      setTime(elapsed)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [startTime])
  
  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  
  return (
    <div className="text-center font-mono">
      <div className="text-sm text-gray-500">用时</div>
      <div className="font-semibold">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </div>
    </div>
  )
}

// 拼图游戏组件接口
interface JigsawPuzzleProps {
  imageUrl: string
  size: 2 | 3 | 4
  onComplete: () => void
}

// 拼图块接口
interface PuzzlePiece {
  id: number
  row: number
  col: number
  isPlaced: boolean
  imageStyle: React.CSSProperties
}

// 拼图槽位接口
interface PuzzleSlot {
  id: number
  row: number
  col: number
  pieceId: number | null
}

export default function JigsawPuzzle({ imageUrl, size, onComplete }: JigsawPuzzleProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [slots, setSlots] = useState<PuzzleSlot[]>([])
  const [startTime, setStartTime] = useState(new Date())
  const [isComplete, setIsComplete] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [draggedPiece, setDraggedPiece] = useState<number | null>(null)
  const [currentTab, setCurrentTab] = useState("0")
  const { stats, updateStats } = useJigsawStats(size)
  
  const puzzleSize = 240 // 拼图区域大小
  const pieceSize = puzzleSize / size
  const piecesPerTab = 6 // 每个标签页显示的拼图块数量
  
  // 初始化拼图
  const initializePuzzle = useCallback(() => {
    const totalPieces = size * size
    
    // 创建拼图块
    const newPieces: PuzzlePiece[] = []
    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / size)
      const col = i % size
      
      newPieces.push({
        id: i,
        row,
        col,
        isPlaced: false,
        imageStyle: {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${puzzleSize}px ${puzzleSize}px`,
          backgroundPosition: `-${col * pieceSize}px -${row * pieceSize}px`,
          backgroundRepeat: 'no-repeat'
        }
      })
    }
    
    // 打乱拼图块顺序
    const shuffledPieces = [...newPieces].sort(() => Math.random() - 0.5)
    
    // 创建拼图槽位
    const newSlots: PuzzleSlot[] = []
    for (let i = 0; i < totalPieces; i++) {
      const row = Math.floor(i / size)
      const col = i % size
      
      newSlots.push({
        id: i,
        row,
        col,
        pieceId: null
      })
    }
    
    setPieces(shuffledPieces)
    setSlots(newSlots)
    setStartTime(new Date())
    setIsComplete(false)
  }, [imageUrl, size, pieceSize, puzzleSize])
  
  // 图片加载完成后初始化拼图
  useEffect(() => {
    if (imageUrl) {
      const img = new Image()
      img.onload = () => {
        setImageLoaded(true)
        initializePuzzle()
      }
      img.onerror = () => {
        console.error('图片加载失败')
        setImageLoaded(false)
      }
      img.src = imageUrl
    }
  }, [imageUrl, initializePuzzle])
  
  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, pieceId: number) => {
    setDraggedPiece(pieceId)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedPiece(null)
  }
  
  // 处理拖拽悬停
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  
  // 处理放置
  const handleDrop = (e: React.DragEvent, slotId: number) => {
    e.preventDefault()
    
    if (draggedPiece === null) return
    
    const piece = pieces.find(p => p.id === draggedPiece)
    const slot = slots.find(s => s.id === slotId)
    
    if (!piece || !slot || slot.pieceId !== null) return
    
    // 检查是否是正确的位置
    const isCorrectPosition = piece.row === slot.row && piece.col === slot.col
    
    // 允许放置到任何空位置
    // 更新拼图块状态
    setPieces(prev => prev.map(p => 
      p.id === draggedPiece ? { ...p, isPlaced: true } : p
    ))
    
    // 更新槽位状态
    setSlots(prev => prev.map(s => 
      s.id === slotId ? { ...s, pieceId: draggedPiece } : s
    ))
    
    // 只有当所有拼图块都在正确位置时才算完成
    if (isCorrectPosition) {
      const updatedPieces = pieces.map(p => 
        p.id === draggedPiece ? { ...p, isPlaced: true } : p
      )
      
      // 检查是否所有拼图块都在正确位置
      const allInCorrectPosition = updatedPieces.every(p => {
        if (!p.isPlaced) return false
        const currentSlot = slots.find(s => s.pieceId === p.id)
        return currentSlot && currentSlot.row === p.row && currentSlot.col === p.col
      })
      
      if (allInCorrectPosition && updatedPieces.every(p => p.isPlaced)) {
        setIsComplete(true)
        const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
        updateStats(completionTime, pieces.length)
        onComplete()
      }
    }
    
    setDraggedPiece(null)
  }
  
  // 处理点击放置（移动端）
  const handlePieceClick = (pieceId: number) => {
    if (draggedPiece === pieceId) {
      setDraggedPiece(null)
      return
    }
    setDraggedPiece(pieceId)
  }
  
  // 处理槽位点击（移动端）
  const handleSlotClick = (slotId: number) => {
    if (draggedPiece === null) return
    
    const piece = pieces.find(p => p.id === draggedPiece)
    const slot = slots.find(s => s.id === slotId)
    
    if (!piece || !slot || slot.pieceId !== null) return
    
    // 检查是否是正确的位置
    const isCorrectPosition = piece.row === slot.row && piece.col === slot.col
    
    // 允许放置到任何空位置，但只有正确位置才算完成
    // 更新拼图块状态
    setPieces(prev => prev.map(p => 
      p.id === draggedPiece ? { ...p, isPlaced: true } : p
    ))
    
    // 更新槽位状态
    setSlots(prev => prev.map(s => 
      s.id === slotId ? { ...s, pieceId: draggedPiece } : s
    ))
    
    // 只有当所有拼图块都在正确位置时才算完成
    if (isCorrectPosition) {
      const updatedPieces = pieces.map(p => 
        p.id === draggedPiece ? { ...p, isPlaced: true } : p
      )
      
      // 检查是否所有拼图块都在正确位置
      const allInCorrectPosition = updatedPieces.every(p => {
        if (!p.isPlaced) return false
        const currentSlot = slots.find(s => s.pieceId === p.id)
        return currentSlot && currentSlot.row === p.row && currentSlot.col === p.col
      })
      
      if (allInCorrectPosition && updatedPieces.every(p => p.isPlaced)) {
        setIsComplete(true)
        const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
        updateStats(completionTime, pieces.length)
        onComplete()
      }
    }
    
    setDraggedPiece(null)
  }
  
  // 重新开始游戏
  const resetGame = () => {
    initializePuzzle()
    setCurrentTab("0")
  }
  
  // 获取所有拼图块（包括已放置的，但在选择区域显示为空位）
  const allPiecesForDisplay = pieces
  
  // 将拼图块分组到不同的标签页
  const pieceGroups = []
  for (let i = 0; i < allPiecesForDisplay.length; i += piecesPerTab) {
    pieceGroups.push(allPiecesForDisplay.slice(i, i + piecesPerTab))
  }
  
  if (!imageLoaded) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-pulse">
          <div className="w-64 h-64 bg-gray-200 rounded-lg mx-auto mb-4"></div>
          <p>加载图片中...</p>
        </div>
      </Card>
    )
  }
  
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* 游戏信息 */}
      <Card className="p-4 w-full max-w-md">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-sm text-gray-500">已完成</div>
            <div className="font-semibold">{pieces.filter(p => p.isPlaced).length}/{pieces.length}</div>
          </div>
          <Timer startTime={startTime} />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetGame}
          >
            重新开始
          </Button>
        </div>
      </Card>
      
      <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-6xl">
        {/* 拼图区域 */}
        <div className="flex flex-col items-center">
          <div 
            className="grid gap-1 border-2 border-gray-300 p-2 rounded-xl bg-white shadow-lg relative"
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              width: `${puzzleSize + 16}px`,
              height: `${puzzleSize + 16}px`
            }}
          >
            {slots.map((slot) => {
              const placedPiece = slot.pieceId !== null ? pieces.find(p => p.id === slot.pieceId) : null
              const isCorrectlyPlaced = placedPiece && placedPiece.row === slot.row && placedPiece.col === slot.col
              
              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, slot.id)}
                  className={`
                    relative rounded border-2 transition-all duration-200
                    ${slot.pieceId !== null 
                      ? (isCorrectlyPlaced ? 'border-green-400 bg-white' : 'border-orange-400 bg-white')
                      : 'border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50'}
                    ${draggedPiece !== null && slot.pieceId === null ? 'border-blue-400 bg-blue-50 cursor-pointer' : ''}
                  `}
                  style={{
                    width: `${pieceSize - 2}px`,
                    height: `${pieceSize - 2}px`,
                    ...(placedPiece ? placedPiece.imageStyle : {})
                  }}
                                  >
                </div>
              )
            })}
          </div>
          
          {isComplete && (
            <div className="mt-6 text-center animate-bounce">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-lg">
                <p className="text-green-600 font-bold text-xl mb-2">🎉 恭喜完成！</p>
                <div className="text-sm text-gray-600 mb-3">
                  <p>用时 {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)} 秒</p>
                  {stats.gamesCompleted > 1 && stats.bestTime === Math.floor((new Date().getTime() - startTime.getTime()) / 1000) && (
                    <p className="text-green-600 font-medium mt-1">⚡ 新的最佳时间记录！</p>
                  )}
                </div>
                <Button 
                  onClick={resetGame}
                  className="mt-2"
                  size="sm"
                >
                  再玩一次
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* 拼图块选择区域 */}
        <div className="flex flex-col items-center w-full lg:w-auto space-y-4">
          
          {/* 统计信息 */}
          {stats.gamesCompleted > 0 && (
            <Card className="p-3 w-full max-w-md">
              <h4 className="text-sm font-medium mb-2 text-gray-600">个人记录</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">最佳时间:</span>
                  <span className="font-mono">
                    {stats.bestTime ? `${Math.floor(stats.bestTime / 60)}:${(stats.bestTime % 60).toString().padStart(2, '0')}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">完成次数:</span>
                  <span className="font-mono">{stats.gamesCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">总拼图块:</span>
                  <span className="font-mono">{stats.totalPiecesPlaced}</span>
                </div>
              </div>
            </Card>
          )}
          
          <Card className="p-4 w-full max-w-md">
            {pieceGroups.length > 1 ? (
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full mb-4" style={{ gridTemplateColumns: `repeat(${pieceGroups.length}, 1fr)` }}>
                  {pieceGroups.map((_, index) => (
                    <TabsTrigger key={index} value={index.toString()}>
                      第{index + 1}组
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {pieceGroups.map((group, groupIndex) => (
                  <TabsContent key={groupIndex} value={groupIndex.toString()}>
                    <div className="grid grid-cols-3 gap-2">
                      {group.map((piece: PuzzlePiece) => (
                        <div
                          key={piece.id}
                          className={`
                            relative rounded border-2 transition-all duration-200
                            ${piece.isPlaced 
                              ? 'border-dashed border-gray-200 bg-gray-50/30' 
                              : `cursor-pointer ${draggedPiece === piece.id 
                                  ? 'border-blue-400 shadow-lg scale-105 bg-blue-50' 
                                  : 'border-gray-300 hover:border-primary hover:shadow-md bg-white'}`
                            }
                          `}
                          style={{
                            width: `${pieceSize}px`,
                            height: `${pieceSize}px`,
                            ...(piece.isPlaced ? {} : {
                              backgroundSize: `${puzzleSize}px ${puzzleSize}px`,
                              backgroundImage: `url(${imageUrl})`,
                              backgroundPosition: `-${piece.col * pieceSize}px -${piece.row * pieceSize}px`,
                              backgroundRepeat: 'no-repeat'
                            })
                          }}
                          {...(!piece.isPlaced && {
                            draggable: true,
                            onClick: () => handlePieceClick(piece.id),
                            onDragStart: (e: React.DragEvent) => handleDragStart(e, piece.id),
                            onDragEnd: handleDragEnd
                          })}
                        >
                          {!piece.isPlaced && draggedPiece === piece.id && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              ✓
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {allPiecesForDisplay.map((piece: PuzzlePiece) => (
                  <div
                    key={piece.id}
                    className={`
                      relative rounded border-2 transition-all duration-200
                      ${piece.isPlaced 
                        ? 'border-dashed border-gray-200 bg-gray-50/30' 
                        : `cursor-pointer ${draggedPiece === piece.id 
                            ? 'border-blue-400 shadow-lg scale-105 bg-blue-50' 
                            : 'border-gray-300 hover:border-primary hover:shadow-md bg-white'}`
                      }
                    `}
                    style={{
                      width: `${pieceSize}px`,
                      height: `${pieceSize}px`,
                      ...(piece.isPlaced ? {} : {
                        backgroundSize: `${puzzleSize}px ${puzzleSize}px`,
                        backgroundImage: `url(${imageUrl})`,
                        backgroundPosition: `-${piece.col * pieceSize}px -${piece.row * pieceSize}px`,
                        backgroundRepeat: 'no-repeat'
                      })
                    }}
                    {...(!piece.isPlaced && {
                      draggable: true,
                      onClick: () => handlePieceClick(piece.id),
                      onDragStart: (e: React.DragEvent) => handleDragStart(e, piece.id),
                      onDragEnd: handleDragEnd
                    })}
                  >
                    {!piece.isPlaced && draggedPiece === piece.id && (
                      <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
} 