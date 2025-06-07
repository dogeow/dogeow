"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useMinesweeperStore } from "@/stores/minesweeperStore"

type CellState = 'hidden' | 'revealed' | 'flagged'
type Cell = {
  isMine: boolean
  neighborCount: number
  state: CellState
}

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 }
}

export default function MinesweeperGame() {
  const { stats, updateStats } = useMinesweeperStore()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [board, setBoard] = useState<Cell[][]>([])
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [mineCount, setMineCount] = useState(DIFFICULTIES.easy.mines)
  const [flagCount, setFlagCount] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [timer, setTimer] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [flagMode, setFlagMode] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const config = DIFFICULTIES[difficulty]

  // 初始化棋盘
  const initializeBoard = useCallback(() => {
    const newBoard: Cell[][] = []
    for (let row = 0; row < config.rows; row++) {
      newBoard[row] = []
      for (let col = 0; col < config.cols; col++) {
        newBoard[row][col] = {
          isMine: false,
          neighborCount: 0,
          state: 'hidden'
        }
      }
    }
    return newBoard
  }, [config])

  // 放置地雷
  const placeMines = useCallback((board: Cell[][], firstClickRow: number, firstClickCol: number) => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })))
    let minesPlaced = 0
    
    while (minesPlaced < config.mines) {
      const row = Math.floor(Math.random() * config.rows)
      const col = Math.floor(Math.random() * config.cols)
      
      // 不在第一次点击位置和周围放置地雷
      const isFirstClickArea = Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1
      
      if (!newBoard[row][col].isMine && !isFirstClickArea) {
        newBoard[row][col].isMine = true
        minesPlaced++
      }
    }
    
    return newBoard
  }, [config])

  // 计算邻居地雷数量
  const calculateNeighbors = useCallback((board: Cell[][]) => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })))
    
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (!newBoard[row][col].isMine) {
          let count = 0
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const newRow = row + i
              const newCol = col + j
              if (
                newRow >= 0 && newRow < config.rows &&
                newCol >= 0 && newCol < config.cols &&
                newBoard[newRow][newCol].isMine
              ) {
                count++
              }
            }
          }
          newBoard[row][col].neighborCount = count
        }
      }
    }
    
    return newBoard
  }, [config])

  // 重置游戏
  const resetGame = useCallback(() => {
    setBoard(initializeBoard())
    setGameState('playing')
    setMineCount(config.mines)
    setFlagCount(0)
    setFirstClick(true)
    setTimer(0)
    setGameStarted(false)
    setFlagMode(false)
  }, [initializeBoard, config.mines])

  // 揭示空白区域
  const revealEmptyArea = useCallback((board: Cell[][], row: number, col: number) => {
    const newBoard = board.map(row => row.map(cell => ({ ...cell })))
    const stack: [number, number][] = [[row, col]]
    
    while (stack.length > 0) {
      const [currentRow, currentCol] = stack.pop()!
      
      if (
        currentRow < 0 || currentRow >= config.rows ||
        currentCol < 0 || currentCol >= config.cols ||
        newBoard[currentRow][currentCol].state !== 'hidden'
      ) {
        continue
      }
      
      newBoard[currentRow][currentCol].state = 'revealed'
      
      if (newBoard[currentRow][currentCol].neighborCount === 0) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            stack.push([currentRow + i, currentCol + j])
          }
        }
      }
    }
    
    return newBoard
  }, [config])

  // 标记格子
  const handleCellFlag = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return
    
    setBoard(currentBoard => {
      const newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })))
      
      if (newBoard[row][col].state === 'hidden') {
        newBoard[row][col].state = 'flagged'
        setFlagCount(prev => prev + 1)
        setMineCount(prev => prev - 1)
      } else if (newBoard[row][col].state === 'flagged') {
        newBoard[row][col].state = 'hidden'
        setFlagCount(prev => prev - 1)
        setMineCount(prev => prev + 1)
      }
      
      return newBoard
    })
  }, [gameState])

  // 点击格子
  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameState !== 'playing') return
    
    // 如果是标记模式，执行标记操作
    if (flagMode) {
      handleCellFlag(row, col)
      return
    }
    
    setBoard(currentBoard => {
      let newBoard = currentBoard.map(row => row.map(cell => ({ ...cell })))
      
      if (newBoard[row][col].state !== 'hidden') return currentBoard
      
      // 第一次点击
      if (firstClick) {
        newBoard = placeMines(newBoard, row, col)
        newBoard = calculateNeighbors(newBoard)
        setFirstClick(false)
        setGameStarted(true)
      }
      
      // 点到地雷
      if (newBoard[row][col].isMine) {
        // 揭示所有地雷
        for (let i = 0; i < config.rows; i++) {
          for (let j = 0; j < config.cols; j++) {
            if (newBoard[i][j].isMine) {
              newBoard[i][j].state = 'revealed'
            }
          }
        }
        setGameState('lost')
        updateStats(difficulty, false)
        toast.error('踩到地雷了！游戏结束')
        return newBoard
      }
      
      // 揭示格子
      if (newBoard[row][col].neighborCount === 0) {
        newBoard = revealEmptyArea(newBoard, row, col)
      } else {
        newBoard[row][col].state = 'revealed'
      }
      
      return newBoard
    })
  }, [gameState, firstClick, placeMines, calculateNeighbors, revealEmptyArea, config, flagMode, difficulty, updateStats, handleCellFlag])

  // 右键标记（桌面端）
  const handleCellRightClick = useCallback((e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    handleCellFlag(row, col)
  }, [handleCellFlag])

  // 长按开始
  const handleTouchStart = useCallback((row: number, col: number) => {
    const timer = setTimeout(() => {
      handleCellFlag(row, col)
      setLongPressTimer(null)
    }, 500) // 500ms长按
    setLongPressTimer(timer)
  }, [handleCellFlag])

  // 长按结束
  const handleTouchEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }, [longPressTimer])

  // 检查胜利条件
  useEffect(() => {
    if (gameState === 'playing' && board.length > 0 && board[0] && board[0].length > 0) {
      let hiddenCount = 0
      
      for (let row = 0; row < config.rows; row++) {
        for (let col = 0; col < config.cols; col++) {
          const cell = board[row]?.[col]
          if (cell && cell.state === 'hidden') {
            hiddenCount++
          }
        }
      }
      
      // 胜利条件：所有非地雷格子都被揭示
      if (hiddenCount + flagCount === config.mines) {
        setGameState('won')
        updateStats(difficulty, true, timer)
        toast.success('恭喜！你赢了！')
      }
    }
  }, [board, gameState, flagCount, config.mines, config.rows, config.cols, difficulty, timer, updateStats])

  // 计时器
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (gameStarted && gameState === 'playing') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [gameStarted, gameState])

  // 初始化
  useEffect(() => {
    resetGame()
  }, [resetGame])

  // 当难度改变时重置游戏
  useEffect(() => {
    resetGame()
  }, [difficulty, resetGame])

  // 获取格子显示内容
  const getCellContent = (cell: Cell) => {
    if (!cell || cell.state === undefined) return ''
    if (cell.state === 'flagged') return '🚩'
    if (cell.state === 'hidden') return ''
    if (cell.isMine) return '💣'
    if (cell.neighborCount === 0) return ''
    return cell.neighborCount.toString()
  }

  // 获取格子样式
  const getCellStyle = (cell: Cell) => {
    const baseStyle = "w-8 h-8 border border-gray-400 flex items-center justify-center text-sm font-bold cursor-pointer select-none"
    
    if (!cell || cell.state === undefined) {
      return `${baseStyle} bg-gray-300 dark:bg-gray-600`
    }
    
    if (cell.state === 'hidden') {
      return `${baseStyle} bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500`
    }
    
    if (cell.state === 'flagged') {
      return `${baseStyle} bg-yellow-200 dark:bg-yellow-700`
    }
    
    if (cell.isMine) {
      return `${baseStyle} bg-red-500 text-white`
    }
    
    const numberColors = [
      '', // 0
      'text-blue-600', // 1
      'text-green-600', // 2
      'text-red-600', // 3
      'text-purple-600', // 4
      'text-yellow-600', // 5
      'text-pink-600', // 6
      'text-gray-600', // 7
      'text-black', // 8
    ]
    
    return `${baseStyle} bg-gray-100 dark:bg-gray-700 ${numberColors[cell.neighborCount] || ''}`
  }

  return (
    <div 
      className="container py-4 px-4 max-w-4xl mx-auto"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">扫雷</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          找出所有地雷，避免踩雷！
        </p>
        
        {/* 难度选择 */}
        <div className="flex justify-center space-x-2 mb-4">
          {Object.entries(DIFFICULTIES).map(([key, value]) => (
            <Button
              key={key}
              variant={difficulty === key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDifficulty(key as Difficulty)
              }}
            >
              {key === 'easy' ? '简单' : key === 'medium' ? '中等' : '困难'}
              <span className="ml-1 text-xs">
                ({value.rows}×{value.cols}, {value.mines}雷)
              </span>
            </Button>
          ))}
        </div>
        
        {/* 游戏信息 */}
        <div className="flex justify-center items-center space-x-6 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">剩余地雷</div>
            <div className="text-xl font-bold">{mineCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">时间</div>
            <div className="text-xl font-bold">{timer}s</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">状态</div>
            <div className="text-xl">
              {gameState === 'playing' ? '🙂' : gameState === 'won' ? '😎' : '😵'}
            </div>
          </div>
        </div>
        
                 <div className="flex justify-center space-x-2 mb-4">
           <Button 
             onClick={() => setFlagMode(!flagMode)} 
             variant={flagMode ? "default" : "outline"} 
             size="sm"
           >
             {flagMode ? '🚩 标记模式' : '👆 点击模式'}
           </Button>
           <Button onClick={resetGame} variant="outline" size="sm">
             重新开始
           </Button>
         </div>
         
         {/* 统计信息 */}
         <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
           <div className="grid grid-cols-3 gap-2 text-center">
             <div>
               <div>游戏: {stats[difficulty].gamesPlayed}</div>
               <div>胜利: {stats[difficulty].gamesWon}</div>
             </div>
             <div>
               <div>胜率: {stats[difficulty].gamesPlayed > 0 ? Math.round((stats[difficulty].gamesWon / stats[difficulty].gamesPlayed) * 100) : 0}%</div>
             </div>
             <div>
               <div>最佳: {stats[difficulty].bestTime > 0 ? `${stats[difficulty].bestTime}s` : '-'}</div>
             </div>
           </div>
         </div>
      </div>

      <Card className="p-4 mb-4 overflow-auto">
        {board.length > 0 && board[0] && board[0].length > 0 ? (
          <div 
            className="grid gap-0 mx-auto"
            style={{ 
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
              maxWidth: `${config.cols * 32}px`,
              touchAction: 'none'
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={getCellStyle(cell)}
                  onClick={() => handleCellClick(rowIndex, colIndex)}
                  onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
                  onTouchStart={() => handleTouchStart(rowIndex, colIndex)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                >
                  {getCellContent(cell)}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">正在初始化游戏...</div>
          </div>
        )}
      </Card>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="mb-2 font-medium text-blue-800 dark:text-blue-200">游戏说明</p>
          <p className="mb-1">💣 找出所有地雷位置</p>
          <p className="mb-1">🚩 右键标记可疑位置</p>
          <p className="mb-1">🔢 数字表示周围地雷数量</p>
          <p>⚠️ 点到地雷就失败了</p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="font-medium mb-1">桌面端</div>
            <div className="flex flex-col space-y-1">
              <div>👆 左键揭示</div>
              <div>👆 右键标记</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium mb-1">手机端</div>
            <div className="flex flex-col space-y-1">
              <div>👆 点击揭示</div>
              <div>⏰ 长按标记</div>
              <div>🚩 标记模式</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 