"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useTetrisStore } from "@/stores/tetrisStore"

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
type Position = { x: number; y: number }
type Board = (string | null)[][]

interface Tetromino {
  type: TetrominoType
  shape: number[][]
  position: Position
  color: string
}

const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20

// 方块形状定义
const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ]
}

// 方块颜色
const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00f0f0',
  O: '#f0f000',
  T: '#a000f0',
  S: '#00f000',
  Z: '#f00000',
  J: '#0000f0',
  L: '#f0a000'
}

// 创建空棋盘
function createEmptyBoard(): Board {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
}

// 生成随机方块
function generateRandomTetromino(): Tetromino {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
  const type = types[Math.floor(Math.random() * types.length)]
  
  return {
    type,
    shape: TETROMINO_SHAPES[type],
    position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(TETROMINO_SHAPES[type][0].length / 2), y: 0 },
    color: TETROMINO_COLORS[type]
  }
}

// 旋转方块
function rotateTetromino(tetromino: Tetromino): Tetromino {
  const rotated = tetromino.shape[0].map((_, index) =>
    tetromino.shape.map(row => row[index]).reverse()
  )
  
  return {
    ...tetromino,
    shape: rotated
  }
}

// 检查位置是否有效
function isValidPosition(board: Board, tetromino: Tetromino, position: Position): boolean {
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const newX = position.x + x
        const newY = position.y + y
        
        if (
          newX < 0 || 
          newX >= BOARD_WIDTH || 
          newY >= BOARD_HEIGHT ||
          (newY >= 0 && board[newY][newX])
        ) {
          return false
        }
      }
    }
  }
  return true
}

// 将方块放置到棋盘上
function placeTetromino(board: Board, tetromino: Tetromino): Board {
  const newBoard = board.map(row => [...row])
  
  for (let y = 0; y < tetromino.shape.length; y++) {
    for (let x = 0; x < tetromino.shape[y].length; x++) {
      if (tetromino.shape[y][x]) {
        const boardY = tetromino.position.y + y
        const boardX = tetromino.position.x + x
        if (boardY >= 0) {
          newBoard[boardY][boardX] = tetromino.color
        }
      }
    }
  }
  
  return newBoard
}

// 清除完整的行
function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  const newBoard = board.filter(row => row.some(cell => cell === null))
  const linesCleared = BOARD_HEIGHT - newBoard.length
  
  // 在顶部添加空行
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null))
  }
  
  return { newBoard, linesCleared }
}

// 计算得分
function calculateScore(linesCleared: number, level: number): number {
  const baseScores = [0, 40, 100, 300, 1200]
  return baseScores[linesCleared] * (level + 1)
}

// 计算等级
function calculateLevel(totalLines: number): number {
  return Math.floor(totalLines / 10) + 1
}

// 计算下落速度（毫秒）
function getDropSpeed(level: number): number {
  return Math.max(50, 1000 - (level - 1) * 50)
}

export default function TetrisGame() {
  const { bestScore, setBestScore, incrementGamesPlayed, addLinesCleared, gamesPlayed, totalLinesCleared } = useTetrisStore()
  
  const [board, setBoard] = useState<Board>(() => createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState<Tetromino | null>(null)
  const [nextPiece, setNextPiece] = useState<Tetromino | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [paused, setPaused] = useState(false)
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const lastDropTime = useRef<number>(Date.now())
  const softDropRef = useRef<NodeJS.Timeout | null>(null)
  const [isSoftDropping, setIsSoftDropping] = useState(false)

  // 客户端挂载后初始化游戏
  useEffect(() => {
    setIsClient(true)
    setCurrentPiece(generateRandomTetromino())
    setNextPiece(generateRandomTetromino())
  }, [])

  // 确保 nextPiece 始终有值（仅在客户端）
  useEffect(() => {
    if (isClient && !nextPiece) {
      setNextPiece(generateRandomTetromino())
    }
  }, [isClient, nextPiece])

  // 游戏循环
  useEffect(() => {
    if (!isClient || gameOver || paused || !currentPiece) return

    const dropSpeed = getDropSpeed(level)
    
    const gameLoop = () => {
      const now = Date.now()
      if (now - lastDropTime.current >= dropSpeed) {
        if (!movePiece('down')) {
          // 方块无法下移，固定到棋盘上
          const newBoard = placeTetromino(board, currentPiece)
          const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard)
          
          setBoard(clearedBoard)
          
          if (linesCleared > 0) {
            const newScore = score + calculateScore(linesCleared, level)
            const newLines = lines + linesCleared
            const newLevel = calculateLevel(newLines)
            
            setScore(newScore)
            setLines(newLines)
            setLevel(newLevel)
            addLinesCleared(linesCleared)
            
            if (newScore > bestScore) {
              setBestScore(newScore)
            }
            
            toast.success(`消除了 ${linesCleared} 行！`)
          }
          
          // 生成新方块
          const newPiece = nextPiece || generateRandomTetromino()
          setCurrentPiece(newPiece)
          setNextPiece(generateRandomTetromino())
          
          // 检查游戏是否结束
          if (!isValidPosition(clearedBoard, newPiece, newPiece.position)) {
            setGameOver(true)
            incrementGamesPlayed()
            if (score > bestScore) {
              setBestScore(score)
            }
            toast.error('游戏结束！')
          }
        }
        lastDropTime.current = now
      }
    }

    gameLoopRef.current = setInterval(gameLoop, 16) // 60 FPS
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [isClient, board, currentPiece, nextPiece, gameOver, paused, level, score, lines, bestScore, setBestScore, incrementGamesPlayed, addLinesCleared])

  // 移动方块
  const movePiece = useCallback((direction: 'left' | 'right' | 'down'): boolean => {
    if (!currentPiece || gameOver || paused) return false

    let newPosition = { ...currentPiece.position }
    
    switch (direction) {
      case 'left':
        newPosition.x -= 1
        break
      case 'right':
        newPosition.x += 1
        break
      case 'down':
        newPosition.y += 1
        break
    }

    if (isValidPosition(board, currentPiece, newPosition)) {
      setCurrentPiece(prev => prev ? { ...prev, position: newPosition } : null)
      return true
    }
    
    return false
  }, [currentPiece, board, gameOver, paused])

  // 旋转方块
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || paused) return

    const rotated = rotateTetromino(currentPiece)
    
    if (isValidPosition(board, rotated, rotated.position)) {
      setCurrentPiece(rotated)
    }
  }, [currentPiece, board, gameOver, paused])

  // 硬降
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || paused) return

    let dropDistance = 0
    let newPosition = { ...currentPiece.position }
    
    while (isValidPosition(board, currentPiece, { ...newPosition, y: newPosition.y + 1 })) {
      newPosition.y += 1
      dropDistance += 1
    }
    
    if (dropDistance > 0) {
      setCurrentPiece(prev => prev ? { ...prev, position: newPosition } : null)
      setScore(prev => prev + dropDistance * 2) // 硬降奖励分数
    }
  }, [currentPiece, board, gameOver, paused])

  // 开始软降
  const startSoftDrop = useCallback(() => {
    if (isSoftDropping || gameOver || paused) return
    
    setIsSoftDropping(true)
    
    const softDropLoop = () => {
      if (movePiece('down')) {
        setScore(prev => prev + 1)
        softDropRef.current = setTimeout(softDropLoop, 50) // 快速下降
      } else {
        setIsSoftDropping(false)
      }
    }
    
    softDropLoop()
  }, [isSoftDropping, gameOver, paused, movePiece])

  // 停止软降
  const stopSoftDrop = useCallback(() => {
    if (softDropRef.current) {
      clearTimeout(softDropRef.current)
      softDropRef.current = null
    }
    setIsSoftDropping(false)
  }, [])

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return

      switch (e.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          e.preventDefault()
          movePiece('left')
          break
        case 'arrowright':
        case 'd':
          e.preventDefault()
          movePiece('right')
          break
        case 'arrowdown':
        case 's':
          e.preventDefault()
          if (movePiece('down')) {
            setScore(prev => prev + 1) // 软降奖励分数
          }
          break
        case 'arrowup':
        case 'w':
        case ' ':
          e.preventDefault()
          if (e.key === ' ') {
            hardDrop()
          } else {
            rotatePiece()
          }
          break
        case 'p':
          e.preventDefault()
          setPaused(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [movePiece, rotatePiece, hardDrop, gameOver])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (softDropRef.current) {
        clearTimeout(softDropRef.current)
      }
    }
  }, [])

  // 重置游戏
  const resetGame = () => {
    setBoard(createEmptyBoard())
    setCurrentPiece(generateRandomTetromino())
    setNextPiece(generateRandomTetromino())
    setScore(0)
    setLines(0)
    setLevel(1)
    setGameOver(false)
    setPaused(false)
    setIsSoftDropping(false)
    if (softDropRef.current) {
      clearTimeout(softDropRef.current)
      softDropRef.current = null
    }
    lastDropTime.current = Date.now()
  }

  // 渲染棋盘
  const renderBoard = () => {
    const displayBoard = board.map(row => [...row])
    
    // 绘制当前方块
    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPiece.position.y + y
            const boardX = currentPiece.position.x + x
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 border border-gray-300 transition-colors duration-150"
            style={{
              backgroundColor: cell || '#f8f9fa',
              borderColor: cell ? '#333' : '#ddd'
            }}
          />
        ))}
      </div>
    ))
  }

  // 渲染下一个方块
  const renderNextPiece = () => {
    if (!isClient || !nextPiece) {
      return (
        <div className="text-gray-400 text-sm">
          加载中...
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center gap-0">
        {nextPiece.shape.map((row, y) => (
          <div key={y} className="flex">
            {row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="w-4 h-4 sm:w-5 sm:h-5 border border-gray-300"
                style={{
                  backgroundColor: cell ? nextPiece.color : '#ffffff',
                  borderColor: cell ? '#000' : '#ccc'
                }}
              />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-7xl">
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold mb-2">俄罗斯方块</h1>
        <p className="text-gray-600 text-sm sm:text-base hidden sm:block">使用方向键移动和旋转，空格键硬降，P键暂停</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 sm:gap-6 justify-center items-start lg:items-stretch">
        {/* 游戏区域 */}
        <div className="flex flex-col items-center">
          {/* 游戏区域和右上角下一个方块 */}
          <div className="relative">
            <Card className="p-2 sm:p-4 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="flex flex-col items-center">
                <div className="border-2 border-gray-400 p-1 sm:p-2 bg-white rounded-lg shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-purple-50/30 pointer-events-none"></div>
                  <div className="relative">
                    {renderBoard()}
                  </div>
                </div>
              </div>
            </Card>
            
            {/* 右上角下一个方块 */}
            <div className="absolute top-2 -right-24 sm:top-4 sm:-right-32 md:-right-40 lg:-right-48">
              <Card className="p-2 sm:p-3 bg-white shadow-lg border-2">
                <div className="text-xs text-gray-600 mb-1 text-center">下一个</div>
                <div className="flex justify-center">
                  {renderNextPiece()}
                </div>
              </Card>
            </div>
          </div>
            
          {gameOver && (
            <div className="mt-4 text-center">
              <p className="text-xl font-bold text-red-600 mb-2">游戏结束！</p>
              <Button onClick={resetGame}>重新开始</Button>
            </div>
          )}
          
          {paused && !gameOver && (
            <div className="mt-4 text-center">
              <p className="text-xl font-bold text-blue-600">游戏暂停</p>
            </div>
          )}

          {/* 移动端控制按钮 */}
          <div className="mt-3 sm:mt-4 lg:hidden">
            <div className="grid grid-cols-3 gap-1 sm:gap-2 max-w-xs mx-auto">
              <div></div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-10 text-lg"
                onTouchStart={(e) => {
                  e.preventDefault()
                  rotatePiece()
                }}
                onClick={() => rotatePiece()}
              >
                ↻
              </Button>
              <div></div>
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-10 text-lg"
                onTouchStart={(e) => {
                  e.preventDefault()
                  movePiece('left')
                }}
                onClick={() => movePiece('left')}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-10 text-lg"
                onTouchStart={(e) => {
                  e.preventDefault()
                  hardDrop()
                }}
                onClick={() => hardDrop()}
              >
                ⬇
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-10 text-lg"
                onTouchStart={(e) => {
                  e.preventDefault()
                  movePiece('right')
                }}
                onClick={() => movePiece('right')}
              >
                →
              </Button>
            </div>
            
            <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 max-w-xs mx-auto">
              <Button
                variant="outline"
                className={`flex-1 h-8 sm:h-10 text-xs sm:text-sm ${isSoftDropping ? 'bg-blue-100' : ''}`}
                onTouchStart={(e) => {
                  e.preventDefault()
                  startSoftDrop()
                }}
                onTouchEnd={(e) => {
                  e.preventDefault()
                  stopSoftDrop()
                }}
                onMouseDown={() => startSoftDrop()}
                onMouseUp={() => stopSoftDrop()}
                onMouseLeave={() => stopSoftDrop()}
              >
                按住软降 ↓
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-8 sm:h-10 text-xs sm:text-sm"
                onClick={() => setPaused(prev => !prev)}
                disabled={gameOver}
              >
                {paused ? '▶️' : '⏸️'}
              </Button>
            </div>
          </div>
        </div>

        {/* 信息面板 */}
        <div className="flex flex-col gap-3 sm:gap-4 w-full lg:w-72">
          {/* 手机端紧凑信息显示 */}
          <div className="lg:hidden">
            <Card className="p-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">得分:</span>
                    <span className="font-bold text-blue-600">{score.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">行数:</span>
                    <span className="font-bold text-green-600">{lines}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">等级:</span>
                    <span className="font-bold text-purple-600">{level}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 桌面端详细信息显示 */}
          <div className="hidden lg:block">
            {/* 下一个方块 */}
            <Card className="p-4 mb-4">
              <h3 className="text-lg font-semibold mb-3 text-center">下一个方块</h3>
              <div className="flex flex-col items-center min-h-[80px] justify-center bg-gray-50 rounded-lg p-3">
                {renderNextPiece()}
              </div>
            </Card>

            {/* 游戏信息 */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">游戏信息</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">得分:</span>
                  <span className="font-bold text-lg text-blue-600">{score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">行数:</span>
                  <span className="font-bold text-lg text-green-600">{lines}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">等级:</span>
                  <span className="font-bold text-lg text-purple-600">{level}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">最高分:</span>
                  <span className="font-bold text-lg text-orange-600">{bestScore.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* 手机端控制按钮 */}
          <div className="lg:hidden">
            <Card className="p-3">
              <div className="flex gap-2">
                <Button 
                  onClick={() => setPaused(prev => !prev)}
                  disabled={gameOver}
                  className="flex-1 h-9"
                  variant={paused ? "default" : "secondary"}
                  size="sm"
                >
                  {paused ? '▶️ 继续' : '⏸️ 暂停'}
                </Button>
                <Button onClick={resetGame} variant="outline" className="flex-1 h-9" size="sm">
                  🔄 重新开始
                </Button>
              </div>
            </Card>
          </div>

          {/* 桌面端详细信息 */}
          <div className="hidden lg:block space-y-4">
            {/* 统计信息 */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">游戏次数:</span>
                  <span className="font-bold">{gamesPlayed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">总消除行数:</span>
                  <span className="font-bold">{totalLinesCleared}</span>
                </div>
              </div>
            </Card>

            {/* 控制按钮 */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">控制</h3>
              <div className="space-y-3">
                <Button 
                  onClick={() => setPaused(prev => !prev)}
                  disabled={gameOver}
                  className="w-full h-10"
                  variant={paused ? "default" : "secondary"}
                >
                  {paused ? '▶️ 继续' : '⏸️ 暂停'}
                </Button>
                <Button onClick={resetGame} variant="outline" className="w-full h-10">
                  🔄 重新开始
                </Button>
              </div>
            </Card>

            {/* 操作说明 */}
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-3">操作说明</h3>
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">← →</span>
                  <span>左右移动</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">↓</span>
                  <span>加速下降</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">↑</span>
                  <span>旋转方块</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">空格</span>
                  <span>硬降</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">P</span>
                  <span>暂停/继续</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 