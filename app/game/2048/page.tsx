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
type MoveResult = { newBoard: Board; scoreGained: number; moved: boolean }

const BOARD_SIZE = 4
const MIN_SWIPE_DISTANCE = 30
const MOVE_THROTTLE = 200
const RANDOM_DIRECTION_DISPLAY_TIME = 500

// 常量配置
const SPEED_OPTIONS: SpeedOption[] = [
  { value: 1, label: '不能再快了' },
  { value: 200, label: '快' },
  { value: 500, label: '正常' },
  { value: 1000, label: '慢' },
]

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left']

const DIRECTION_SYMBOLS = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→'
} as const

// 工具函数
const initializeBoard = (): Board => {
  const newBoard = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0))
  addRandomTile(newBoard)
  addRandomTile(newBoard)
  return newBoard
}

const addRandomTile = (board: Board): void => {
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

const transpose = (board: Board): Board => {
  return board[0].map((_, colIndex) => board.map(row => row[colIndex]))
}

const isGameOver = (board: Board): boolean => {
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

const getNextDirection = (current: Direction, clockwise: boolean): Direction => {
  const currentIndex = DIRECTIONS.indexOf(current)
  
  if (clockwise) {
    return DIRECTIONS[(currentIndex + 1) % 4]
  } else {
    return DIRECTIONS[(currentIndex - 1 + 4) % 4]
  }
}

const getRandomDirection = (): Direction => {
  return DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)]
}

// 获取方块颜色的优化版本
const getTileColor = (value: number): string => {
  const colorMap: Record<number, string> = {
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
  return colorMap[value] || 'bg-purple-500 text-white dark:bg-purple-400 shadow-lg shadow-purple-500/50'
}

export default function Game2048() {
  const { bestScore, setBestScore, incrementGamesPlayed, incrementGamesWon, gamesPlayed, gamesWon } = useGame2048Store()
  
  // 游戏状态
  const [board, setBoard] = useState<Board>(() => initializeBoard())
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([])
  const [canUndo, setCanUndo] = useState(false)
  
  // 自动运行状态
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [isDirectionalRunning, setIsDirectionalRunning] = useState(false)
  const [currentDirection, setCurrentDirection] = useState<Direction>('down')
  const [isClockwise, setIsClockwise] = useState(true)
  const [speed, setSpeed] = useState(500)
  const [showRandomDirection, setShowRandomDirection] = useState<Direction | null>(null)
  
  // Refs
  const autoRunIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const directionalRunIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const randomDirectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 移动逻辑优化
  const moveLeft = useCallback((board: Board): MoveResult => {
    const newBoard = board.map(row => [...row])
    let scoreGained = 0
    let moved = false

    for (let i = 0; i < BOARD_SIZE; i++) {
      const row = newBoard[i].filter(cell => cell !== 0)
      const mergedRow: number[] = []
      let j = 0
      
      while (j < row.length) {
        if (j < row.length - 1 && row[j] === row[j + 1]) {
          const mergedValue = row[j] * 2
          mergedRow.push(mergedValue)
          scoreGained += mergedValue
          j += 2
        } else {
          mergedRow.push(row[j])
          j += 1
        }
      }
      
      while (mergedRow.length < BOARD_SIZE) {
        mergedRow.push(0)
      }
      
      for (let k = 0; k < BOARD_SIZE; k++) {
        if (newBoard[i][k] !== mergedRow[k]) {
          moved = true
        }
      }
      
      newBoard[i] = mergedRow
    }

    return { newBoard, scoreGained, moved }
  }, [])

  const moveRight = useCallback((board: Board): MoveResult => {
    const rotatedBoard = board.map(row => [...row].reverse())
    const { newBoard, scoreGained, moved } = moveLeft(rotatedBoard)
    return {
      newBoard: newBoard.map(row => [...row].reverse()),
      scoreGained,
      moved
    }
  }, [moveLeft])

  const moveUp = useCallback((board: Board): MoveResult => {
    const transposedBoard = transpose(board)
    const { newBoard, scoreGained, moved } = moveLeft(transposedBoard)
    return {
      newBoard: transpose(newBoard),
      scoreGained,
      moved
    }
  }, [moveLeft])

  const moveDown = useCallback((board: Board): MoveResult => {
    const transposedBoard = transpose(board)
    const { newBoard, scoreGained, moved } = moveRight(transposedBoard)
    return {
      newBoard: transpose(newBoard),
      scoreGained,
      moved
    }
  }, [moveRight])

  // 移动处理器映射
  const moveHandlers = useMemo(() => ({
    left: moveLeft,
    right: moveRight,
    up: moveUp,
    down: moveDown
  }), [moveLeft, moveRight, moveUp, moveDown])

  // 处理移动的核心逻辑
  const handleMove = useCallback((direction: Direction) => {
    if (gameOver) return

    setBoard(currentBoard => {
      const result = moveHandlers[direction](currentBoard)

      if (result.moved) {
        const newBoard = [...result.newBoard]
        addRandomTile(newBoard)
        
        // 检查是否达到2048
        if (!gameWon) {
          const has2048 = newBoard.some(row => row.some(cell => cell === 2048))
          if (has2048) {
            setGameWon(true)
            incrementGamesWon()
          }
        }
        
        // 更新分数和历史
        setScore(currentScore => {
          setHistory(prev => [...prev.slice(-4), { board: [...currentBoard], score: currentScore }])
          return currentScore + result.scoreGained
        })
        setCanUndo(true)
        
        // 检查游戏结束
        if (isGameOver(newBoard)) {
          setGameOver(true)
          incrementGamesPlayed()
          toast.error('游戏结束！')
        }
        
        return newBoard
      }
      
      return currentBoard
    })
  }, [gameOver, gameWon, incrementGamesPlayed, incrementGamesWon, moveHandlers])

  // 自动运行逻辑
  const startAutoRun = useCallback(() => {
    const runAutoMove = () => {
      const randomDirection = getRandomDirection()
      handleMove(randomDirection)
    }
    autoRunIntervalRef.current = setInterval(runAutoMove, speed)
  }, [handleMove, speed])

  const startDirectionalRun = useCallback(() => {
    const runDirectionalMove = () => {
      setCurrentDirection(prev => {
        const nextDir = getNextDirection(prev, isClockwise)
        handleMove(nextDir)
        return nextDir
      })
    }
    directionalRunIntervalRef.current = setInterval(runDirectionalMove, speed)
  }, [handleMove, isClockwise, speed])

  const stopAutoRun = useCallback(() => {
    if (autoRunIntervalRef.current) {
      clearInterval(autoRunIntervalRef.current)
      autoRunIntervalRef.current = null
    }
  }, [])

  const stopDirectionalRun = useCallback(() => {
    if (directionalRunIntervalRef.current) {
      clearInterval(directionalRunIntervalRef.current)
      directionalRunIntervalRef.current = null
    }
  }, [])

  // 控制函数
  const toggleAutoRun = useCallback(() => {
    if (isAutoRunning) {
      stopAutoRun()
      setIsAutoRunning(false)
      toast.success('已停止随机自动运行')
    } else {
      setIsAutoRunning(true)
      startAutoRun()
      toast.success('开始随机自动运行')
    }
  }, [isAutoRunning, startAutoRun, stopAutoRun])

  const toggleDirectionalRun = useCallback(() => {
    if (isDirectionalRunning) {
      stopDirectionalRun()
      setIsDirectionalRunning(false)
      toast.success('已停止方向循环运行')
    } else {
      setIsDirectionalRunning(true)
      startDirectionalRun()
      toast.success(`开始${isClockwise ? '顺时针' : '逆时针'}循环运行`)
    }
  }, [isDirectionalRunning, isClockwise, startDirectionalRun, stopDirectionalRun])

  const toggleClockwise = useCallback(() => {
    setIsClockwise(prev => !prev)
    toast.success(`切换为${!isClockwise ? '顺时针' : '逆时针'}模式`)
  }, [isClockwise])

  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed)
    
    // 重新启动正在运行的定时器
    if (isAutoRunning) {
      stopAutoRun()
      setTimeout(() => startAutoRun(), 0)
    }
    
    if (isDirectionalRunning) {
      stopDirectionalRun()
      setTimeout(() => startDirectionalRun(), 0)
    }
    
    const speedLabel = SPEED_OPTIONS.find(option => option.value === newSpeed)?.label || '自定义'
    toast.success(`速度已调整为：${speedLabel}`)
  }, [isAutoRunning, isDirectionalRunning, startAutoRun, startDirectionalRun, stopAutoRun, stopDirectionalRun])

  const randomMoveOnce = useCallback(() => {
    if (gameOver || isAutoRunning || isDirectionalRunning) return
    
    const randomDirection = getRandomDirection()
    setShowRandomDirection(randomDirection)
    handleMove(randomDirection)
    
    if (randomDirectionTimeoutRef.current) {
      clearTimeout(randomDirectionTimeoutRef.current)
    }
    randomDirectionTimeoutRef.current = setTimeout(() => {
      setShowRandomDirection(null)
    }, RANDOM_DIRECTION_DISPLAY_TIME)
  }, [gameOver, isAutoRunning, isDirectionalRunning, handleMove])

  const resetGame = useCallback(() => {
    stopAutoRun()
    stopDirectionalRun()
    
    setBoard(initializeBoard())
    setScore(0)
    setGameOver(false)
    setGameWon(false)
    setHistory([])
    setCanUndo(false)
    setIsAutoRunning(false)
    setIsDirectionalRunning(false)
    setCurrentDirection('down')
    setSpeed(500)
    setShowRandomDirection(null)
  }, [stopAutoRun, stopDirectionalRun])

  const undoMove = useCallback(() => {
    if (history.length > 0 && canUndo) {
      const lastState = history[history.length - 1]
      setBoard(lastState.board)
      setScore(lastState.score)
      setHistory(prev => prev.slice(0, -1))
      setCanUndo(history.length > 1)
      setGameOver(false)
      toast.success('已撤销上一步')
    }
  }, [history, canUndo])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const keyToDirection: Record<string, Direction> = {
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'ArrowUp': 'up',
        'ArrowDown': 'down'
      }
      
      const direction = keyToDirection[e.key]
      if (direction) {
        e.preventDefault()
        handleMove(direction)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleMove])

  // 触摸事件处理
  useEffect(() => {
    let startX = 0
    let startY = 0
    let lastMoveTime = 0
    let isGameAreaTouch = false

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
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
      if (currentTime - lastMoveTime < MOVE_THROTTLE) return

      const currentX = e.touches[0].clientX
      const currentY = e.touches[0].clientY
      const diffX = startX - currentX
      const diffY = startY - currentY

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > MIN_SWIPE_DISTANCE) {
          handleMove(diffX > 0 ? 'left' : 'right')
          startX = currentX
          startY = currentY
          lastMoveTime = currentTime
        }
      } else {
        if (Math.abs(diffY) > MIN_SWIPE_DISTANCE) {
          handleMove(diffY > 0 ? 'up' : 'down')
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

  // 自动运行重启逻辑
  useEffect(() => {
    if (isAutoRunning && autoRunIntervalRef.current === null) {
      startAutoRun()
    }
  }, [isAutoRunning, startAutoRun])

  useEffect(() => {
    if (isDirectionalRunning && directionalRunIntervalRef.current === null) {
      startDirectionalRun()
    }
  }, [isDirectionalRunning, startDirectionalRun])

  // 游戏结束时停止自动运行
  useEffect(() => {
    if (gameOver) {
      if (isAutoRunning) {
        stopAutoRun()
        setIsAutoRunning(false)
      }
      if (isDirectionalRunning) {
        stopDirectionalRun()
        setIsDirectionalRunning(false)
      }
    }
  }, [gameOver, isAutoRunning, isDirectionalRunning, stopAutoRun, stopDirectionalRun])

  // 更新最高分
  useEffect(() => {
    if (score > 0) {
      setBestScore(score)
    }
  }, [score, setBestScore])

  // 清理定时器
  useEffect(() => {
    return () => {
      stopAutoRun()
      stopDirectionalRun()
      if (randomDirectionTimeoutRef.current) {
        clearTimeout(randomDirectionTimeoutRef.current)
      }
    }
  }, [stopAutoRun, stopDirectionalRun])

  // 渲染优化的组件
  const GameStats = useMemo(() => (
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
  ), [score, bestScore])

  const GameBoard = useMemo(() => (
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
  ), [board])

  const DirectionControls = useMemo(() => (
    <div className="mb-6">
      <div className="flex flex-col items-center space-y-2">
        <Button
          variant="outline"
          size="lg"
          className="w-12 h-12 p-0 text-xl"
          onClick={() => handleMove('up')}
          disabled={gameOver || isAutoRunning || isDirectionalRunning}
        >
          {DIRECTION_SYMBOLS.up}
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 p-0 text-xl"
            onClick={() => handleMove('left')}
            disabled={gameOver || isAutoRunning || isDirectionalRunning}
          >
            {DIRECTION_SYMBOLS.left}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 p-0 text-lg"
            onClick={randomMoveOnce}
            disabled={gameOver || isAutoRunning || isDirectionalRunning}
          >
            {showRandomDirection ? DIRECTION_SYMBOLS[showRandomDirection] : '🎲'}
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-12 h-12 p-0 text-xl"
            onClick={() => handleMove('right')}
            disabled={gameOver || isAutoRunning || isDirectionalRunning}
          >
            {DIRECTION_SYMBOLS.right}
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="lg"
          className="w-12 h-12 p-0 text-xl"
          onClick={() => handleMove('down')}
          disabled={gameOver || isAutoRunning || isDirectionalRunning}
        >
          {DIRECTION_SYMBOLS.down}
        </Button>
      </div>
    </div>
  ), [gameOver, isAutoRunning, isDirectionalRunning, showRandomDirection, handleMove, randomMoveOnce])

  const AutoRunControls = useMemo(() => (
    <div className="mb-6 space-y-3">
      <div className="text-center">
        <div className="mb-3">
          <div className="flex justify-center flex-wrap gap-1">
            {SPEED_OPTIONS.map((option) => (
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
        
        {(isAutoRunning || isDirectionalRunning) && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            {isAutoRunning && <div>🎲 随机运行中...</div>}
            {isDirectionalRunning && (
              <div>
                🔄 {isClockwise ? '顺时针' : '逆时针'}循环中 
                <span className="ml-1 font-mono text-lg">
                  ({DIRECTION_SYMBOLS[currentDirection]})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ), [speed, gameOver, isAutoRunning, isDirectionalRunning, isClockwise, currentDirection, changeSpeed, toggleAutoRun, toggleDirectionalRun, toggleClockwise])

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
        
        {GameStats}
        
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

      {GameBoard}

      {gameWon && (
        <div className="text-center mb-4 p-4 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <div className="text-green-800 dark:text-green-200 font-bold">🎉 恭喜！你达到了2048！</div>
          <div className="text-green-600 dark:text-green-300 text-sm">继续游戏挑战更高分数</div>
        </div>
      )}

      {gameOver && (
        <div className="text-center mb-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-800 dark:text-red-200 font-bold">游戏结束</div>
          <div className="text-red-600 dark:text-red-300 text-sm">最终分数: {score}</div>
        </div>
      )}

      {DirectionControls}
      {AutoRunControls}
    </div>
  )
} 