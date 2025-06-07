"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useGame2048Store } from "@/stores/game2048Store"

type Board = number[][]
type Direction = 'up' | 'down' | 'left' | 'right'

const BOARD_SIZE = 4

export default function Game2048() {
  const { bestScore, setBestScore, incrementGamesPlayed, incrementGamesWon, gamesPlayed, gamesWon } = useGame2048Store()
  const [board, setBoard] = useState<Board>(() => initializeBoard())
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([])
  const [canUndo, setCanUndo] = useState(false)

  // 初始化棋盘
  function initializeBoard(): Board {
    const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))
    addRandomTile(newBoard)
    addRandomTile(newBoard)
    return newBoard
  }

  // 添加随机方块
  function addRandomTile(board: Board) {
    const emptyCells: [number, number][] = []
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] === 0) {
          emptyCells.push([i, j])
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * emptyCells.length)
      const [row, col] = emptyCells[randomIndex]
      board[row][col] = Math.random() < 0.9 ? 2 : 4
    }
  }

  // 移动和合并逻辑
  function moveLeft(board: Board): { newBoard: Board; scoreGained: number; moved: boolean } {
    const newBoard = board.map(row => [...row])
    let scoreGained = 0
    let moved = false

    for (let i = 0; i < BOARD_SIZE; i++) {
      // 先移除所有0
      const row = newBoard[i].filter(cell => cell !== 0)
      
      // 合并相同的数字
      const mergedRow: number[] = []
      let j = 0
      while (j < row.length) {
        if (j < row.length - 1 && row[j] === row[j + 1]) {
          // 合并相同的数字
          const mergedValue = row[j] * 2
          mergedRow.push(mergedValue)
          scoreGained += mergedValue
          if (mergedValue === 2048 && !gameWon) {
            setGameWon(true)
            incrementGamesWon()
          }
          j += 2 // 跳过下一个数字，因为已经合并了
        } else {
          mergedRow.push(row[j])
          j += 1
        }
      }
      
      // 填充0到右边
      while (mergedRow.length < BOARD_SIZE) {
        mergedRow.push(0)
      }
      
      // 检查是否有移动
      for (let k = 0; k < BOARD_SIZE; k++) {
        if (newBoard[i][k] !== mergedRow[k]) {
          moved = true
        }
      }
      
      newBoard[i] = mergedRow
    }

    return { newBoard, scoreGained, moved }
  }

  function moveRight(board: Board) {
    const rotatedBoard = board.map(row => [...row].reverse())
    const { newBoard, scoreGained, moved } = moveLeft(rotatedBoard)
    return {
      newBoard: newBoard.map(row => [...row].reverse()),
      scoreGained,
      moved
    }
  }

  function moveUp(board: Board) {
    const transposedBoard = transpose(board)
    const { newBoard, scoreGained, moved } = moveLeft(transposedBoard)
    return {
      newBoard: transpose(newBoard),
      scoreGained,
      moved
    }
  }

  function moveDown(board: Board) {
    const transposedBoard = transpose(board)
    const { newBoard, scoreGained, moved } = moveRight(transposedBoard)
    return {
      newBoard: transpose(newBoard),
      scoreGained,
      moved
    }
  }

  function transpose(board: Board): Board {
    return board[0].map((_, colIndex) => board.map(row => row[colIndex]))
  }

  // 检查游戏是否结束
  function isGameOver(board: Board): boolean {
    // 检查是否还有空格
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (board[i][j] === 0) return false
      }
    }

    // 检查是否还能合并
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const current = board[i][j]
        if (
          (i < BOARD_SIZE - 1 && board[i + 1][j] === current) ||
          (j < BOARD_SIZE - 1 && board[i][j + 1] === current)
        ) {
          return false
        }
      }
    }

    return true
  }

  // 处理移动
  const handleMove = useCallback((direction: Direction) => {
    if (gameOver) return

    let result
    switch (direction) {
      case 'left':
        result = moveLeft(board)
        break
      case 'right':
        result = moveRight(board)
        break
      case 'up':
        result = moveUp(board)
        break
      case 'down':
        result = moveDown(board)
        break
    }

    if (result.moved) {
      // 保存当前状态到历史记录
      setHistory(prev => [...prev.slice(-4), { board: [...board], score }])
      setCanUndo(true)
      
      const newBoard = [...result.newBoard]
      addRandomTile(newBoard)
      setBoard(newBoard)
      setScore(prev => prev + result.scoreGained)
      
      if (isGameOver(newBoard)) {
        setGameOver(true)
        incrementGamesPlayed()
        toast.error('游戏结束！')
      }
    }
  }, [board, gameOver, gameWon, incrementGamesPlayed, moveDown, moveLeft, moveRight, moveUp, score])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          handleMove('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          handleMove('right')
          break
        case 'ArrowUp':
          e.preventDefault()
          handleMove('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          handleMove('down')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleMove])

  // 触摸事件处理
  useEffect(() => {
    let startX = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startX || !startY) return

      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY

      const diffX = startX - endX
      const diffY = startY - endY

      const minSwipeDistance = 50

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipeDistance) {
          if (diffX > 0) {
            handleMove('left')
          } else {
            handleMove('right')
          }
        }
      } else {
        if (Math.abs(diffY) > minSwipeDistance) {
          if (diffY > 0) {
            handleMove('up')
          } else {
            handleMove('down')
          }
        }
      }

      startX = 0
      startY = 0
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMove])

  // 更新最高分
  useEffect(() => {
    if (score > 0) {
      setBestScore(score)
    }
  }, [score, setBestScore])

  // 重新开始游戏
  const resetGame = () => {
    setBoard(initializeBoard())
    setScore(0)
    setGameOver(false)
    setGameWon(false)
    setHistory([])
    setCanUndo(false)
  }

  // 撤销上一步
  const undoMove = () => {
    if (history.length > 0 && canUndo) {
      const lastState = history[history.length - 1]
      setBoard(lastState.board)
      setScore(lastState.score)
      setHistory(prev => prev.slice(0, -1))
      setCanUndo(history.length > 1)
      setGameOver(false)
      toast.success('已撤销上一步')
    }
  }

  // 获取方块颜色
  const getTileColor = (value: number) => {
    const colors: { [key: number]: string } = {
      0: 'bg-gray-100 dark:bg-gray-800',
      2: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
      4: 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-100',
      8: 'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-orange-100',
      16: 'bg-orange-300 text-orange-900 dark:bg-orange-600 dark:text-orange-100',
      32: 'bg-orange-400 text-white dark:bg-orange-500',
      64: 'bg-red-400 text-white dark:bg-red-500',
      128: 'bg-yellow-300 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100',
      256: 'bg-yellow-400 text-yellow-900 dark:bg-yellow-500 dark:text-yellow-100',
      512: 'bg-yellow-500 text-white dark:bg-yellow-400 dark:text-yellow-900',
      1024: 'bg-green-400 text-white dark:bg-green-500',
      2048: 'bg-green-500 text-white dark:bg-green-400 shadow-lg shadow-green-500/50'
    }
    return colors[value] || 'bg-purple-500 text-white dark:bg-purple-400 shadow-lg shadow-purple-500/50'
  }

  return (
    <div 
      className="container py-4 px-4 max-w-md mx-auto"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">2048</h1>
        <p className="text-gray-600 text-sm mb-4">
          滑动合并数字，达到2048！
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">当前分数</div>
            <div className="text-xl font-bold">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">最高分</div>
            <div className="text-xl font-bold">{bestScore}</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            游戏次数: {gamesPlayed} | 胜利次数: {gamesWon}
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={undoMove} 
              variant="outline" 
              size="sm"
              disabled={!canUndo}
            >
              撤销
            </Button>
            <Button onClick={resetGame} variant="outline" size="sm">
              重新开始
            </Button>
          </div>
        </div>
      </div>

      <Card className="p-4 mb-4">
        <div 
          className="grid grid-cols-4 gap-2"
          style={{ touchAction: 'none' }}
        >
          {board.map((row, i) =>
            row.map((cell, j) => (
                             <div
                 key={`${i}-${j}`}
                                  className={`
                   aspect-square rounded-lg flex items-center justify-center
                   ${cell >= 1000 ? 'text-sm' : cell >= 100 ? 'text-base' : 'text-lg'} 
                   font-bold transition-all duration-200 ease-in-out
                   ${getTileColor(cell)}
                   ${cell !== 0 ? 'scale-100' : 'scale-95'}
                   hover:scale-105
                 `}
               >
                 {cell !== 0 && (
                   <span className="animate-in fade-in-0 zoom-in-95 duration-200">
                     {cell}
                   </span>
                 )}
               </div>
            ))
          )}
        </div>
      </Card>

      {gameWon && (
        <div className="text-center mb-4 p-4 bg-green-100 rounded-lg">
          <div className="text-green-800 font-bold">🎉 恭喜！你达到了2048！</div>
          <div className="text-green-600 text-sm">继续游戏挑战更高分数</div>
        </div>
      )}

      {gameOver && (
        <div className="text-center mb-4 p-4 bg-red-100 rounded-lg">
          <div className="text-red-800 font-bold">游戏结束</div>
          <div className="text-red-600 text-sm">最终分数: {score}</div>
        </div>
      )}

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="mb-2 font-medium text-blue-800 dark:text-blue-200">游戏说明</p>
          <p className="mb-1">📱 滑动屏幕或使用方向键移动方块</p>
          <p className="mb-1">🔢 相同数字的方块会合并</p>
          <p>🎯 目标：合并出2048方块！</p>
        </div>
        
        <div className="flex justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <span>⬅️</span>
            <span>左滑</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>➡️</span>
            <span>右滑</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⬆️</span>
            <span>上滑</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>⬇️</span>
            <span>下滑</span>
          </div>
        </div>
      </div>
    </div>
  )
} 