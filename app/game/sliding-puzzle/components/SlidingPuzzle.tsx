"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// 内联组件 - 计时器
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

// 内联组件 - 移动次数
function MoveCounter({ moves }: { moves: number }) {
  return (
    <div className="text-center">
      <div className="text-sm text-gray-500">移动次数</div>
      <div className="font-semibold">{moves}</div>
    </div>
  )
}

// 主游戏组件
interface PuzzleProps {
  size: 3 | 4 | 5
  onComplete: () => void
}

export default function SlidingPuzzle({ size, onComplete }: PuzzleProps) {
  // 检查拼图是否有解
  const checkSolvable = useCallback((board: number[], boardSize: number) => {
    // 找到空格位置
    const emptyIndex = board.indexOf(0)
    const emptyRow = Math.floor(emptyIndex / boardSize)
    
    // 计算逆序数
    let inversions = 0
    for (let i = 0; i < board.length; i++) {
      if (board[i] === 0) continue
      
      for (let j = i + 1; j < board.length; j++) {
        if (board[j] === 0) continue
        if (board[i] > board[j]) inversions++
      }
    }
    
    // 根据棋盘大小和空格位置判断是否有解
    if (boardSize % 2 === 1) {
      // 奇数大小棋盘：逆序数为偶数才有解
      return inversions % 2 === 0
    } else {
      // 偶数大小棋盘：空格所在行（从下往上数）加逆序数为奇数才有解
      const emptyRowFromBottom = boardSize - 1 - emptyRow
      return (inversions + emptyRowFromBottom) % 2 === 1
    }
  }, [])
  
  // 随机打乱棋盘并确保有解
  const shuffleBoard = useCallback((board: number[], boardSize: number) => {
    const shuffled = [...board]
    let solved = false
    
    // 尝试最多10次生成有解的棋盘
    for (let attempt = 0; attempt < 10 && !solved; attempt++) {
      // 洗牌算法
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      
      // 确保不是已经完成的状态
      const isSolvable = checkSolvable(shuffled, boardSize)
      const isAlreadySolved = shuffled.every((num, index) => 
        num === index || (index === shuffled.length - 1 && num === 0))
      
      solved = isSolvable && !isAlreadySolved
    }
    
    return shuffled
  }, [checkSolvable])
  
  // 生成初始棋盘
  const createBoard = useCallback((boardSize: number) => {
    const numbers = Array.from({ length: boardSize * boardSize }, (_, i) => i)
    return shuffleBoard(numbers, boardSize)
  }, [shuffleBoard])
  
  // 游戏状态
  const [board, setBoard] = useState(createBoard(size))
  const [moves, setMoves] = useState(0)
  const [startTime, setStartTime] = useState(new Date())
  const [isComplete, setIsComplete] = useState(false)
  
  // 重置游戏
  const resetGame = useCallback(() => {
    setBoard(createBoard(size))
    setMoves(0)
    setStartTime(new Date())
    setIsComplete(false)
  }, [size, createBoard])

  // 当尺寸改变时重置游戏
  useEffect(() => {
    resetGame()
  }, [resetGame])
  
  // 移动方块
  const moveTile = useCallback((index: number) => {
    if (isComplete) return
    
    const emptyIndex = board.indexOf(0)
    
    // 检查是否可移动（与空白方块相邻）
    const isValidMove = (
      // 同一行相邻
      (Math.floor(index / size) === Math.floor(emptyIndex / size) && 
        Math.abs(index - emptyIndex) === 1) ||
      // 同一列相邻
      (index % size === emptyIndex % size && 
        Math.abs(index - emptyIndex) === size)
    )
    
    if (!isValidMove) return
    
    // 移动方块
    const newBoard = [...board]
    ;[newBoard[index], newBoard[emptyIndex]] = [newBoard[emptyIndex], newBoard[index]]
    
    setBoard(newBoard)
    setMoves(prev => prev + 1)
    
    // 检查是否完成
    const completed = newBoard.every((value, index) => 
      (index === newBoard.length - 1 && value === 0) || value === index + 1 || value === index
    )
    
    if (completed) {
      setIsComplete(true)
      onComplete()
    }
  }, [board, isComplete, size, onComplete])
  
  // 处理键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete) return
      
      const emptyIndex = board.indexOf(0)
      
      let targetIndex = -1
      switch (e.key) {
        case 'ArrowUp':
          if (emptyIndex < board.length - size) {
            targetIndex = emptyIndex + size
          }
          break
        case 'ArrowDown':
          if (emptyIndex >= size) {
            targetIndex = emptyIndex - size
          }
          break
        case 'ArrowLeft':
          if (emptyIndex % size < size - 1) {
            targetIndex = emptyIndex + 1
          }
          break
        case 'ArrowRight':
          if (emptyIndex % size > 0) {
            targetIndex = emptyIndex - 1
          }
          break
      }
      
      if (targetIndex !== -1) {
        moveTile(targetIndex)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [board, isComplete, size, moveTile])
  
  return (
    <Card className="p-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <MoveCounter moves={moves} />
        <Timer startTime={startTime} />
      </div>
      
      <div 
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          aspectRatio: '1/1'
        }}
      >
        {board.map((value, index) => (
          <div
            key={index}
            onClick={() => moveTile(index)}
            className={`
              flex items-center justify-center
              rounded-md transition-all select-none
              ${value === 0 
                ? 'border border-dashed border-muted bg-transparent' 
                : 'bg-primary text-primary-foreground shadow cursor-pointer hover:bg-primary/80 active:scale-95'}
              ${isComplete ? 'border-green-400' : ''}
            `}
            style={{
              aspectRatio: '1/1',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
              fontSize: size > 3 ? '1rem' : '1.25rem',
              fontWeight: 'bold'
            }}
          >
            {value !== 0 && value}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>提示：点击数字方块或使用键盘方向键移动</p>
      </div>
    </Card>
  )
} 