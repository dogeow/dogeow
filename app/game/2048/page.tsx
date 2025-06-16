"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useGame2048Store } from "./store"
import { GameRulesDialog } from "@/components/ui/game-rules-dialog"

type Board = number[][]
type Direction = 'up' | 'down' | 'left' | 'right'
type SpeedOption = { value: number; label: string }

const BOARD_SIZE = 4

export default function Game2048() {
  const { bestScore, setBestScore, incrementGamesPlayed, incrementGamesWon, gamesPlayed, gamesWon } = useGame2048Store()
  const [board, setBoard] = useState<Board>(() => initializeBoard())
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([])
  const [canUndo, setCanUndo] = useState(false)
  
  // 自动运行相关状态
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [isDirectionalRunning, setIsDirectionalRunning] = useState(false)
  const [currentDirection, setCurrentDirection] = useState<Direction>('down')
  const [isClockwise, setIsClockwise] = useState(true)
  const [speed, setSpeed] = useState(500) // 默认500ms
  const [showRandomDirection, setShowRandomDirection] = useState<Direction | null>(null)
  const autoRunIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const directionalRunIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const randomDirectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // 辅助函数
  const transpose = useCallback((board: Board): Board => {
    return board[0].map((_, colIndex) => board.map(row => row[colIndex]))
  }, [])

  // 移动和合并逻辑
  const moveLeft = useCallback((board: Board): { newBoard: Board; scoreGained: number; moved: boolean } => {
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
  }, [gameWon, incrementGamesWon])

  const moveRight = useCallback((board: Board) => {
    const rotatedBoard = board.map(row => [...row].reverse())
    const { newBoard, scoreGained, moved } = moveLeft(rotatedBoard)
    return {
      newBoard: newBoard.map(row => [...row].reverse()),
      scoreGained,
      moved
    }
  }, [moveLeft])

  const moveUp = useCallback((board: Board) => {
    const transposedBoard = transpose(board)
    const { newBoard, scoreGained, moved } = moveLeft(transposedBoard)
    return {
      newBoard: transpose(newBoard),
      scoreGained,
      moved
    }
  }, [moveLeft, transpose])

  const moveDown = useCallback((board: Board) => {
    const transposedBoard = transpose(board)
    const { newBoard, scoreGained, moved } = moveRight(transposedBoard)
    return {
      newBoard: transpose(newBoard),
      scoreGained,
      moved
    }
  }, [moveRight, transpose])

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

    setBoard(currentBoard => {
      let result
      switch (direction) {
        case 'left':
          result = moveLeft(currentBoard)
          break
        case 'right':
          result = moveRight(currentBoard)
          break
        case 'up':
          result = moveUp(currentBoard)
          break
        case 'down':
          result = moveDown(currentBoard)
          break
      }

      if (result.moved) {
        const newBoard = [...result.newBoard]
        addRandomTile(newBoard)
        
        // 保存当前状态到历史记录
        setScore(currentScore => {
          setHistory(prev => [...prev.slice(-4), { board: [...currentBoard], score: currentScore }])
          return currentScore + result.scoreGained
        })
        setCanUndo(true)
        
        if (isGameOver(newBoard)) {
          setGameOver(true)
          incrementGamesPlayed()
          toast.error('游戏结束！')
        }
        
        return newBoard
      }
      
      return currentBoard
    })
  }, [gameOver, incrementGamesPlayed, moveDown, moveLeft, moveRight, moveUp])

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

  // 触摸事件处理 - 仅在游戏区域生效
  useEffect(() => {
    let startX = 0
    let startY = 0
    let lastMoveTime = 0
    let isGameAreaTouch = false
    const moveThrottle = 200 // 200ms内只能移动一次

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      // 检查是否在游戏区域内
      const gameBoard = target.closest('[data-game-board]')
      if (gameBoard) {
        isGameAreaTouch = true
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
      } else {
        isGameAreaTouch = false
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isGameAreaTouch || !startX || !startY) return
      
      const currentTime = Date.now()
      if (currentTime - lastMoveTime < moveThrottle) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY

      const diffX = startX - currentX
      const diffY = startY - currentY

      const minSwipeDistance = 30

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipeDistance) {
          if (diffX > 0) {
            handleMove('left')
          } else {
            handleMove('right')
          }
          // 更新起始点为当前位置，允许连续滑动
          startX = currentX
          startY = currentY
          lastMoveTime = currentTime
        }
      } else {
        if (Math.abs(diffY) > minSwipeDistance) {
          if (diffY > 0) {
            handleMove('up')
          } else {
            handleMove('down')
          }
          // 更新起始点为当前位置，允许连续滑动
          startX = currentX
          startY = currentY
          lastMoveTime = currentTime
        }
      }
    }

    const handleTouchEnd = () => {
      startX = 0
      startY = 0
      lastMoveTime = 0
      isGameAreaTouch = false
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleMove])

  // 获取下一个方向（顺时针或逆时针）
  const getNextDirection = useCallback((current: Direction, clockwise: boolean): Direction => {
    const directions: Direction[] = ['up', 'right', 'down', 'left']
    const currentIndex = directions.indexOf(current)
    
    if (clockwise) {
      return directions[(currentIndex + 1) % 4]
    } else {
      return directions[(currentIndex - 1 + 4) % 4]
    }
  }, [])

  // 随机方向自动运行
  const toggleAutoRun = useCallback(() => {
    if (isAutoRunning) {
      // 停止自动运行
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current)
        autoRunIntervalRef.current = null
      }
      setIsAutoRunning(false)
      toast.success('已停止随机自动运行')
    } else {
      // 开始自动运行
      setIsAutoRunning(true)
      toast.success('开始随机自动运行')
      
      const runAutoMove = () => {
        const directions: Direction[] = ['up', 'down', 'left', 'right']
        const randomDirection = directions[Math.floor(Math.random() * directions.length)]
        handleMove(randomDirection)
      }
      
      autoRunIntervalRef.current = setInterval(runAutoMove, speed)
    }
  }, [isAutoRunning, handleMove, speed])

  // 方向循环自动运行
  const toggleDirectionalRun = useCallback(() => {
    if (isDirectionalRunning) {
      // 停止方向循环运行
      if (directionalRunIntervalRef.current) {
        clearInterval(directionalRunIntervalRef.current)
        directionalRunIntervalRef.current = null
      }
      setIsDirectionalRunning(false)
      toast.success('已停止方向循环运行')
    } else {
      // 开始方向循环运行
      setIsDirectionalRunning(true)
      toast.success(`开始${isClockwise ? '顺时针' : '逆时针'}循环运行`)
      
      const runDirectionalMove = () => {
        setCurrentDirection(prev => {
          const nextDir = getNextDirection(prev, isClockwise)
          handleMove(nextDir)
          return nextDir
        })
      }
      
      directionalRunIntervalRef.current = setInterval(runDirectionalMove, speed)
    }
  }, [isDirectionalRunning, isClockwise, getNextDirection, handleMove, speed])

  // 切换顺时针/逆时针
  const toggleClockwise = useCallback(() => {
    setIsClockwise(prev => !prev)
    toast.success(`切换为${!isClockwise ? '顺时针' : '逆时针'}模式`)
  }, [isClockwise])

  // 速度控制
  const speedOptions = useMemo<SpeedOption[]>(() => [
    { value: 1, label: '不能再快了' },
    { value: 200, label: '快' },
    { value: 500, label: '正常' },
    { value: 1000, label: '慢' },
  ], [])

  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    
    // 如果正在运行，重新启动定时器以应用新速度
    if (isAutoRunning && autoRunIntervalRef.current) {
      clearInterval(autoRunIntervalRef.current)
      const runAutoMove = () => {
        const directions: Direction[] = ['up', 'down', 'left', 'right']
        const randomDirection = directions[Math.floor(Math.random() * directions.length)]
        handleMove(randomDirection)
      }
      autoRunIntervalRef.current = setInterval(runAutoMove, newSpeed)
    }
    
    if (isDirectionalRunning && directionalRunIntervalRef.current) {
      clearInterval(directionalRunIntervalRef.current)
      const runDirectionalMove = () => {
        setCurrentDirection(prev => {
          const nextDir = getNextDirection(prev, isClockwise)
          handleMove(nextDir)
          return nextDir
        })
      }
      directionalRunIntervalRef.current = setInterval(runDirectionalMove, newSpeed)
    }
    
    const speedLabel = speedOptions.find(option => option.value === newSpeed)?.label || '自定义'
    toast.success(`速度已调整为：${speedLabel}`)
  }, [isAutoRunning, isDirectionalRunning, isClockwise, getNextDirection, handleMove, speedOptions])

  // 随机移动一次
  const randomMoveOnce = useCallback(() => {
    if (gameOver || isAutoRunning || isDirectionalRunning) return
    
    const directions: Direction[] = ['up', 'down', 'left', 'right']
    const randomDirection = directions[Math.floor(Math.random() * directions.length)]
    
    // 显示随机到的方向
    setShowRandomDirection(randomDirection)
    
    // 执行移动
    handleMove(randomDirection)
    
    // 500ms后恢复显示🎲
    if (randomDirectionTimeoutRef.current) {
      clearTimeout(randomDirectionTimeoutRef.current)
    }
    randomDirectionTimeoutRef.current = setTimeout(() => {
      setShowRandomDirection(null)
    }, 500)
  }, [gameOver, isAutoRunning, isDirectionalRunning, handleMove])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (autoRunIntervalRef.current) {
        clearInterval(autoRunIntervalRef.current)
      }
      if (directionalRunIntervalRef.current) {
        clearInterval(directionalRunIntervalRef.current)
      }
      if (randomDirectionTimeoutRef.current) {
        clearTimeout(randomDirectionTimeoutRef.current)
      }
    }
  }, [])

  // 游戏结束时停止自动运行
  useEffect(() => {
    if (gameOver) {
      if (isAutoRunning) {
        if (autoRunIntervalRef.current) {
          clearInterval(autoRunIntervalRef.current)
          autoRunIntervalRef.current = null
        }
        setIsAutoRunning(false)
      }
      if (isDirectionalRunning) {
        if (directionalRunIntervalRef.current) {
          clearInterval(directionalRunIntervalRef.current)
          directionalRunIntervalRef.current = null
        }
        setIsDirectionalRunning(false)
      }
    }
  }, [gameOver, isAutoRunning, isDirectionalRunning])

  // 更新最高分
  useEffect(() => {
    if (score > 0) {
      setBestScore(score)
    }
  }, [score, setBestScore])

  // 重新开始游戏
  const resetGame = () => {
    // 停止所有自动运行
    if (autoRunIntervalRef.current) {
      clearInterval(autoRunIntervalRef.current)
      autoRunIntervalRef.current = null
    }
    if (directionalRunIntervalRef.current) {
      clearInterval(directionalRunIntervalRef.current)
      directionalRunIntervalRef.current = null
    }
    
    setBoard(initializeBoard())
    setScore(0)
    setGameOver(false)
    setGameWon(false)
    setHistory([])
    setCanUndo(false)
    setIsAutoRunning(false)
    setIsDirectionalRunning(false)
    setCurrentDirection('down')
    setSpeed(500) // 重置速度为默认值
    setShowRandomDirection(null) // 重置随机方向显示
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
        <div className="flex items-center justify-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">2048</h1>
          <GameRulesDialog
            title="2048游戏规则"
            rules={[
              "滑动屏幕或使用方向键移动方块",
              "相同数字的方块会合并成更大的数字",
              "目标：合并出2048方块！",
              "可使用按钮手动控制或自动运行",
              "支持撤销上一步操作",
              "游戏结束条件：棋盘填满且无法合并"
            ]}
          />
        </div>
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
          data-game-board
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

      {/* 方向控制按钮 */}
      <div className="mb-6">
        <div className="flex flex-col items-center space-y-2">
          {/* 上按钮 */}
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 p-0 text-xl"
            onClick={() => handleMove('up')}
            disabled={gameOver || isAutoRunning || isDirectionalRunning}
          >
            ↑
          </Button>
          
          {/* 中间一行：左、中心、右 */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="lg"
              className="w-12 h-12 p-0 text-xl"
              onClick={() => handleMove('left')}
              disabled={gameOver || isAutoRunning || isDirectionalRunning}
            >
              ←
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-12 h-12 p-0 text-lg"
              onClick={randomMoveOnce}
              disabled={gameOver || isAutoRunning || isDirectionalRunning}
            >
              {showRandomDirection ? (
                showRandomDirection === 'up' ? '↑' :
                showRandomDirection === 'down' ? '↓' :
                showRandomDirection === 'left' ? '←' : '→'
              ) : '🎲'}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-12 h-12 p-0 text-xl"
              onClick={() => handleMove('right')}
              disabled={gameOver || isAutoRunning || isDirectionalRunning}
            >
              →
            </Button>
          </div>
          
          {/* 下按钮 */}
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 p-0 text-xl"
            onClick={() => handleMove('down')}
            disabled={gameOver || isAutoRunning || isDirectionalRunning}
          >
            ↓
          </Button>
        </div>
      </div>

      {/* 自动运行控制 */}
      <div className="mb-6 space-y-3">
        <div className="text-center">
          {/* 速度控制 */}
          <div className="mb-3">
            <div className="flex justify-center flex-wrap gap-1">
              {speedOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={speed === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeSpeed(option.value)}
                  disabled={gameOver}
                  className="text-xs px-2 py-1"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 自动运行控制 - 同一行显示 */}
          <div className="flex justify-center items-center space-x-2">
            <Button
              variant={isAutoRunning ? "destructive" : "default"}
              size="default"
              onClick={toggleAutoRun}
              disabled={gameOver || isDirectionalRunning}
              className="text-sm px-4"
            >
              {isAutoRunning ? '🛑' : '🎲'}
            </Button>
            
            <span className="text-gray-400">|</span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleClockwise}
              disabled={gameOver || isAutoRunning}
              className="text-xs px-2"
            >
              {isClockwise ? '🔄' : '🔃'}
            </Button>
            
            <Button
              variant={isDirectionalRunning ? "destructive" : "default"}
              size="default"
              onClick={toggleDirectionalRun}
              disabled={gameOver || isAutoRunning}
              className="text-sm px-4"
            >
              {isDirectionalRunning ? '🛑' : '🔄'}
            </Button>
          </div>
          
          {/* 当前状态显示 */}
          {(isAutoRunning || isDirectionalRunning) && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {isAutoRunning && <div>🎲 随机运行中...</div>}
              {isDirectionalRunning && (
                <div>
                  🔄 {isClockwise ? '顺时针' : '逆时针'}循环中 
                  <span className="ml-1 font-mono text-lg">
                    ({currentDirection === 'up' ? '↑' : 
                      currentDirection === 'down' ? '↓' : 
                      currentDirection === 'left' ? '←' : '→'})
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


    </div>
  )
} 