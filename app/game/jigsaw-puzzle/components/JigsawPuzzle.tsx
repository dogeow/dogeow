"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff } from "lucide-react"
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
  const [showFloatingReference, setShowFloatingReference] = useState(false)
  const [selectedPlacedPiece, setSelectedPlacedPiece] = useState<number | null>(null)
  const [wronglyPlacedPieces, setWronglyPlacedPieces] = useState<Set<number>>(new Set())
  const { stats, updateStats } = useJigsawStats(size)
  
  const puzzleSize = 240
  const pieceSize = puzzleSize / size
  const piecesPerTab = 6

  // 初始化拼图
  const initializePuzzle = useCallback(() => {
    const totalPieces = size * size
    
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
    
    const shuffledPieces = [...newPieces].sort(() => Math.random() - 0.5)
    
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
    setWronglyPlacedPieces(new Set())
  }, [imageUrl, size, pieceSize, puzzleSize])
  
  // 图片加载完成后初始化拼图
  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image()
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
  
  // 键盘事件监听
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancelSelection()
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // 取消所有选择
  const cancelSelection = () => {
    setDraggedPiece(null)
    setSelectedPlacedPiece(null)
  }
  
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
    
    const slot = slots.find(s => s.id === slotId)
    if (!slot || slot.pieceId !== null) return
    
    const piece = pieces.find(p => p.id === draggedPiece)
    if (!piece) return
    
    const pieceId = draggedPiece
    placePieceInSlot(pieceId, slotId)
    setDraggedPiece(null)
    
    // 检查是否放置正确，如果错误则自动选中该拼图块，方便用户继续移动
    const isCorrectPosition = piece.row === slot.row && piece.col === slot.col
    if (!isCorrectPosition) {
      setSelectedPlacedPiece(pieceId)
    } else {
      setSelectedPlacedPiece(null)
    }
  }
  
  // 处理点击放置（移动端）
  const handlePieceClick = (pieceId: number) => {
    if (draggedPiece === pieceId) {
      setDraggedPiece(null)
      return
    }
    
    setSelectedPlacedPiece(null)
    setDraggedPiece(pieceId)
  }
  
  // 处理已放置拼图块的点击
  const handlePlacedPieceClick = (pieceId: number) => {
    if (selectedPlacedPiece === pieceId) {
      setSelectedPlacedPiece(null)
      return
    }
    
    setDraggedPiece(null)
    setSelectedPlacedPiece(pieceId)
  }
  
  // 交换两个拼图块的位置
  const swapPieces = (pieceId1: number, pieceId2: number) => {
    const slot1 = slots.find(s => s.pieceId === pieceId1)
    const slot2 = slots.find(s => s.pieceId === pieceId2)
    
    if (!slot1 || !slot2) return
    
    // 交换槽位中的拼图块
    setSlots(prev => prev.map(s => {
      if (s.id === slot1.id) return { ...s, pieceId: pieceId2 }
      if (s.id === slot2.id) return { ...s, pieceId: pieceId1 }
      return s
    }))
    
    // 更新错误状态
    const piece1 = pieces.find(p => p.id === pieceId1)
    const piece2 = pieces.find(p => p.id === pieceId2)
    
    if (piece1 && piece2) {
      setWronglyPlacedPieces(prev => {
        const newSet = new Set(prev)
        
        // 检查piece1在slot2的位置是否正确
        const piece1Correct = piece1.row === slot2.row && piece1.col === slot2.col
        if (piece1Correct) {
          newSet.delete(pieceId1)
        } else {
          newSet.add(pieceId1)
        }
        
        // 检查piece2在slot1的位置是否正确
        const piece2Correct = piece2.row === slot1.row && piece2.col === slot1.col
        if (piece2Correct) {
          newSet.delete(pieceId2)
        } else {
          newSet.add(pieceId2)
        }
        
        return newSet
      })
    }
    
    setTimeout(() => {
      checkGameCompletion()
    }, 100)
  }
  
  // 处理槽位点击（移动端）
  const handleSlotClick = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId)
    if (!slot) return
    
    // 如果点击的槽位有拼图块
    if (slot.pieceId !== null) {
      // 如果有选中的拼图块，则交换位置
      if (selectedPlacedPiece !== null && selectedPlacedPiece !== slot.pieceId) {
        swapPieces(selectedPlacedPiece, slot.pieceId)
        setSelectedPlacedPiece(null)
        return
      }
      
      // 否则选中这个拼图块
      handlePlacedPieceClick(slot.pieceId)
      return
    }
    
    // 如果点击的是空槽位
    if (draggedPiece !== null) {
      const piece = pieces.find(p => p.id === draggedPiece)
      if (!piece) return
      
      placePieceInSlot(draggedPiece, slotId)
      setDraggedPiece(null)
      return
    }
    
    if (selectedPlacedPiece !== null) {
      // 先从原位置移除拼图块
      const originalSlot = slots.find(s => s.pieceId === selectedPlacedPiece)
      if (originalSlot) {
        setSlots(prev => prev.map(s => 
          s.id === originalSlot.id ? { ...s, pieceId: null } : s
        ))
        
        // 从错误状态中移除（因为已经移走了）
        setWronglyPlacedPieces(prev => {
          const newSet = new Set(prev)
          newSet.delete(selectedPlacedPiece)
          return newSet
        })
      }
      
      // 放置到新位置
      placePieceInSlot(selectedPlacedPiece, slotId)
      
      // 清除选中状态，允许用户继续操作其他拼图块
      setSelectedPlacedPiece(null)
      
      return
    }
  }
  
  // 统一的拼图块放置逻辑
  const placePieceInSlot = (pieceId: number, slotId: number) => {
    const piece = pieces.find(p => p.id === pieceId)
    const slot = slots.find(s => s.id === slotId)
    
    if (!piece || !slot) return
    
    // 检查是否放置正确
    const isCorrectPosition = piece.row === slot.row && piece.col === slot.col
    
    setPieces(prev => prev.map(p => 
      p.id === pieceId ? { ...p, isPlaced: true } : p
    ))
    
    setSlots(prev => prev.map(s => 
      s.id === slotId ? { ...s, pieceId: pieceId } : s
    ))
    
    // 立即更新错误放置的拼图块状态
    setWronglyPlacedPieces(prev => {
      const newSet = new Set(prev)
      if (isCorrectPosition) {
        newSet.delete(pieceId)
      } else {
        newSet.add(pieceId)
      }
      return newSet
    })
    
    setTimeout(() => {
      checkGameCompletion()
    }, 100)
  }
  
  // 检查游戏完成状态
  const checkGameCompletion = () => {
    const allPiecesPlaced = pieces.every(p => p.isPlaced)
    if (!allPiecesPlaced) return
    
    const allInCorrectPosition = pieces.every(p => {
      const currentSlot = slots.find(s => s.pieceId === p.id)
      return currentSlot && currentSlot.row === p.row && currentSlot.col === p.col
    })
    
    if (allInCorrectPosition) {
      setIsComplete(true)
      const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
      updateStats(completionTime, pieces.length)
      onComplete()
    }
  }
  
  // 重新开始游戏
  const resetGame = () => {
    initializePuzzle()
    setCurrentTab("0")
    setDraggedPiece(null)
    setSelectedPlacedPiece(null)
    setWronglyPlacedPieces(new Set())
  }
  
  // 获取所有拼图块
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
    <div className="flex flex-col items-center space-y-4">
      {/* 游戏信息和操作提示 */}
      <Card className="p-4 w-full max-w-4xl">
        <div className="flex flex-col space-y-3">
          {/* 主要游戏信息 */}
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="text-sm text-gray-500">已完成</div>
              <div className="font-semibold">{pieces.filter(p => p.isPlaced).length}/{pieces.length}</div>
            </div>
            <Timer startTime={startTime} />
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowFloatingReference(!showFloatingReference)}
                className="flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showFloatingReference ? '隐藏' : '显示'}参考
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetGame}
              >
                重新开始
              </Button>
            </div>
          </div>
          
          {/* 进度条 */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">完成进度</span>
              <span className="text-xs font-medium text-gray-700">
                {Math.round((pieces.filter(p => p.isPlaced).length / pieces.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${pieces.length > 0 ? (pieces.filter(p => p.isPlaced).length / pieces.length) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      </Card>
      
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-center w-full max-w-6xl relative">
        {/* 浮动原图参考 */}
        {showFloatingReference && (
          <div className="fixed top-4 right-4 z-50 lg:absolute lg:top-0 lg:right-0 lg:z-10">
            <Card className="p-2 shadow-lg border-2 border-primary/20 bg-white/95 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">原图参考</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFloatingReference(false)}
                  className="h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <EyeOff className="h-3 w-3" />
                </Button>
              </div>
              <div className="relative w-24 h-24 rounded overflow-hidden border border-gray-200">
                <Image
                  src={imageUrl}
                  alt="浮动原图参考"
                  fill
                  className="object-cover"
                />
                {pieces.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="text-white text-xs text-center py-1 font-medium">
                      {Math.round((pieces.filter(p => p.isPlaced).length / pieces.length) * 100)}%
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-1 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${pieces.length > 0 ? (pieces.filter(p => p.isPlaced).length / pieces.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </Card>
          </div>
        )}
        
        {/* 拼图区域 */}
        <div className="flex flex-col items-center">
          <div 
            className="grid border-2 border-gray-300 rounded-xl bg-white shadow-lg relative"
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              width: `${puzzleSize}px`,
              height: `${puzzleSize}px`
            }}
          >

            
            {slots.map((slot) => {
              const placedPiece = slot.pieceId !== null ? pieces.find(p => p.id === slot.pieceId) : null
              const isSelected = selectedPlacedPiece === slot.pieceId
              const isWronglyPlaced = placedPiece && wronglyPlacedPieces.has(placedPiece.id)
              
              // 使用拼图块自己的图片样式，而不是根据槽位位置计算
              const slotImageStyle = placedPiece ? {
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: `${puzzleSize}px ${puzzleSize}px`,
                backgroundPosition: `-${placedPiece.col * pieceSize}px -${placedPiece.row * pieceSize}px`,
                backgroundRepeat: 'no-repeat'
              } : {}
              
              return (
                <div
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, slot.id)}
                  className={`
                    relative cursor-pointer
                    ${slot.pieceId !== null 
                      ? (isSelected 
                          ? 'ring-2 ring-gray-400 ring-inset' 
                          : (isWronglyPlaced 
                              ? 'ring-2 ring-red-400 ring-inset' 
                              : ''))
                      : 'border border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50'}
                    ${draggedPiece !== null && slot.pieceId === null ? 'border-gray-400 bg-gray-100' : ''}
                    ${selectedPlacedPiece !== null && slot.pieceId === null ? 'border-gray-400 bg-gray-100' : ''}
                  `}
                  style={{
                    width: `${pieceSize}px`,
                    height: `${pieceSize}px`,
                    ...slotImageStyle
                  }}
                >
                </div>
              )
            })}
          </div>
          
          {isComplete && (
            <div className="mt-4 text-center animate-bounce">
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
                  {pieceGroups.map((group, index) => {
                    const remainingCount = group.filter(piece => !piece.isPlaced).length
                    return (
                      <TabsTrigger key={index} value={index.toString()}>
                        第{index + 1}组 ({remainingCount})
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
                
                {pieceGroups.map((group, groupIndex) => (
                  <TabsContent key={groupIndex} value={groupIndex.toString()}>
                    <div className="grid grid-cols-3 gap-2 justify-items-center">
                      {group.map((piece: PuzzlePiece) => (
                        <div
                          key={piece.id}
                          className={`
                            relative rounded border-2 flex items-center justify-center
                            ${piece.isPlaced 
                              ? 'border-dashed border-gray-200 bg-gray-50/30' 
                              : `cursor-pointer ${draggedPiece === piece.id 
                                  ? 'border-gray-400 bg-gray-50' 
                                  : 'border-gray-300 hover:border-primary bg-white'}`
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

                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="grid grid-cols-3 gap-2 justify-items-center">
                {allPiecesForDisplay.map((piece: PuzzlePiece) => (
                  <div
                    key={piece.id}
                    className={`
                      relative rounded border-2 flex items-center justify-center
                      ${piece.isPlaced 
                        ? 'border-dashed border-gray-200 bg-gray-50/30' 
                        : `cursor-pointer ${draggedPiece === piece.id 
                            ? 'border-gray-400 bg-gray-50' 
                            : 'border-gray-300 hover:border-primary bg-white'}`
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