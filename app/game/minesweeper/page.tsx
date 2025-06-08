"use client"

import { useState, useEffect, useCallback } from "react"

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

// 根据屏幕大小动态计算难度配置
const getDynamicDifficulties = () => {
  if (typeof window === 'undefined') {
    // 服务端渲染时的默认值
    return {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: { rows: 15, cols: 12, mines: 27 },
      hard: { rows: 20, cols: 15, mines: 48 }
    }
  }

  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  const isPortrait = screenHeight > screenWidth
  
  // 计算可用空间（考虑UI元素占用的空间）
  const availableWidth = Math.min(screenWidth - 32, 1000) // 减去padding，最大1000px以支持长方形
  const availableHeight = screenHeight - 400 // 减去头部UI占用的空间
  
  // 每个格子32px
  const maxCols = Math.floor(availableWidth / 32)
  const maxRows = Math.floor(availableHeight / 32)
  
  if (isPortrait || screenWidth < 768) {
    // 移动设备或竖屏 - 利用可滚动特性，支持长方形
    const mediumRows = Math.min(15, 20) // 允许更多行，因为可以滚动
    const mediumCols = Math.min(10, maxCols)
    const hardRows = Math.min(20, 25) // 允许更多行
    const hardCols = Math.min(12, maxCols)
    
    return {
      easy: { rows: 8, cols: 8, mines: 10 },
      medium: { 
        rows: mediumRows, 
        cols: mediumCols, 
        mines: Math.floor(mediumRows * mediumCols * 0.15) 
      },
      hard: { 
        rows: hardRows, 
        cols: hardCols, 
        mines: Math.floor(hardRows * hardCols * 0.17) 
      }
    }
  } else {
    // 桌面设备 - 可以使用长方形
    const mediumRows = Math.min(13, maxRows)
    const mediumCols = Math.min(15, maxCols)
    const hardRows = Math.min(16, maxRows)
    const hardCols = Math.min(30, maxCols)
    
    return {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: { 
        rows: mediumRows, 
        cols: mediumCols, 
        mines: Math.floor(mediumRows * mediumCols * 0.15) 
      },
      hard: { 
        rows: hardRows, 
        cols: hardCols, 
        mines: Math.floor(hardRows * hardCols * 0.16) 
      }
    }
  }
}

export default function MinesweeperGame() {
  const { stats, updateStats } = useMinesweeperStore()
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [difficulties, setDifficulties] = useState(getDynamicDifficulties())
  const [board, setBoard] = useState<Cell[][]>([])
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing')
  const [mineCount, setMineCount] = useState(difficulties.easy.mines)
  const [flagCount, setFlagCount] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const [timer, setTimer] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [flagMode, setFlagMode] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const config = difficulties[difficulty]

  // 监听屏幕大小变化
  useEffect(() => {
    const handleResize = () => {
      const newDifficulties = getDynamicDifficulties()
      setDifficulties(newDifficulties)
    }

    window.addEventListener('resize', handleResize)
    // 初始化时也调用一次
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 阻止整个页面的右键菜单
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

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
    e.stopPropagation()
    handleCellFlag(row, col)
    return false
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

  // 当难度配置改变时重置游戏
  useEffect(() => {
    resetGame()
  }, [difficulties, resetGame])

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
    <div className="container py-4 px-4 max-w-4xl mx-auto flex flex-col min-h-screen">
      {/* 头部区域 */}
      <div className="flex flex-col items-center text-center space-y-6">
        {/* 标题 */}
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-3xl font-bold">扫雷</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            找出所有地雷，避免踩雷！
          </p>
        </div>
        
        {/* 难度选择 */}
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(difficulties).map(([key]) => (
            <Button
              key={key}
              variant={difficulty === key ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setDifficulty(key as Difficulty)
              }}
              className="text-xs"
            >
              {key === 'easy' ? '简单' : key === 'medium' ? '中等' : '困难'}
            </Button>
          ))}
        </div>
        
        {/* 游戏信息 */}
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">时间</div>
            <div className="text-xl font-bold">{timer}s</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">地雷</div>
            <div className="text-xl font-bold">{mineCount}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">状态</div>
            <div className="text-xl">
              {gameState === 'playing' ? '🙂' : gameState === 'won' ? '😎' : '😵'}
            </div>
          </div>
        </div>
        
        {/* 控制按钮 */}
        <div className="flex flex-wrap justify-center gap-2">
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
      </div>

      {/* 游戏区域 */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 space-y-6">
        {board.length > 0 && board[0] && board[0].length > 0 ? (
          <div 
            className="grid gap-0"
            style={{ 
              gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
              maxWidth: `${config.cols * 32}px`,
              touchAction: 'none'
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              return false
            }}
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
                  onMouseDown={(e) => {
                    // 阻止鼠标中键和右键的默认行为
                    if (e.button === 1 || e.button === 2) {
                      e.preventDefault()
                    }
                  }}
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
        
        {/* 统计信息 */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <div>游戏: {stats[difficulty].gamesPlayed}</div>
              <div>胜利: {stats[difficulty].gamesWon}</div>
            </div>
            <div className="text-center">
              <div>胜率: {stats[difficulty].gamesPlayed > 0 ? Math.round((stats[difficulty].gamesWon / stats[difficulty].gamesPlayed) * 100) : 0}%</div>
            </div>
            <div className="text-center">
              <div>最佳: {stats[difficulty].bestTime > 0 ? `${stats[difficulty].bestTime}s` : '-'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部说明区域 */}
      <div className="flex flex-col items-center text-center text-sm text-gray-600 dark:text-gray-400 space-y-6">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="font-medium text-blue-800 dark:text-blue-200">游戏说明</p>
          <div className="flex flex-col space-y-1 mt-2">
            <p>💣 找出所有地雷位置</p>
            <p>🚩 右键标记可疑位置</p>
            <p>🔢 数字表示周围地雷数量</p>
            <p>⚠️ 点到地雷就失败了</p>
          </div>
        </div>
        
        <div className="flex justify-center space-x-8 text-xs">
          <div className="text-center">
            <div className="font-medium">桌面端</div>
            <div className="flex flex-col space-y-1 mt-1">
              <div>👆 左键揭示</div>
              <div>👆 右键标记</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-medium">手机端</div>
            <div className="flex flex-col space-y-1 mt-1">
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