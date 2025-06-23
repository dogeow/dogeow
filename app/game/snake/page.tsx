"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSnakeGameStore } from "./store"
import { GameRulesDialog } from "@/components/ui/game-rules-dialog"

type Position = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const BOARD_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_FOOD = { x: 15, y: 15 }
const GAME_SPEED = 150
const MIN_SWIPE_DISTANCE = 30

// 方向映射
const DIRECTION_MAP = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
} as const

// 相反方向映射
const OPPOSITE_DIRECTIONS = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
} as const

// 键盘映射
const KEY_DIRECTION_MAP = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT'
} as const

export default function SnakeGame() {
  const { bestScore, setBestScore, incrementGamesPlayed, addFoodEaten } = useSnakeGameStore()
  
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Position>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const touchStartRef = useRef({ x: 0, y: 0 })
  
  // 使用 ref 存储最新的状态值，避免闭包问题
  const directionRef = useRef<Direction>('RIGHT')
  const foodRef = useRef<Position>(INITIAL_FOOD)
  const gameOverRef = useRef(false)
  const gameStartedRef = useRef(false)
  const directionQueueRef = useRef<Direction[]>([])
  
  // 同步 ref 值
  useEffect(() => {
    directionRef.current = direction
  }, [direction])
  
  useEffect(() => {
    foodRef.current = food
  }, [food])
  
  useEffect(() => {
    gameOverRef.current = gameOver
  }, [gameOver])
  
  useEffect(() => {
    gameStartedRef.current = gameStarted
  }, [gameStarted])

  // 生成随机食物位置
  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      }
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y))
    return newFood
  }, [])

  // 检查碰撞
  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // 撞墙
    if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
      return true
    }
    // 撞自己
    return body.some(segment => segment.x === head.x && segment.y === head.y)
  }, [])

  // 游戏主循环
  const gameLoop = useCallback(() => {
    setSnake(currentSnake => {
      if (gameOverRef.current || !gameStartedRef.current) return currentSnake

      // 处理方向队列
      if (directionQueueRef.current.length > 0) {
        const nextDirection = directionQueueRef.current.shift()!
        // 防止反向移动
        if (OPPOSITE_DIRECTIONS[directionRef.current] !== nextDirection) {
          directionRef.current = nextDirection
          setDirection(nextDirection)
        }
      }

      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }
      const movement = DIRECTION_MAP[directionRef.current]
      
      head.x += movement.x
      head.y += movement.y

      // 检查碰撞
      if (checkCollision(head, newSnake)) {
        setGameOver(true)
        setGameStarted(false)
        // 使用 setTimeout 将状态更新延迟到下一个事件循环
        setTimeout(() => {
          incrementGamesPlayed()
        }, 0)
        toast.error('游戏结束！')
        return currentSnake
      }

      newSnake.unshift(head)

      // 检查是否吃到食物
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(prev => prev + 10)
        // 使用 setTimeout 将状态更新延迟到下一个事件循环
        setTimeout(() => {
          addFoodEaten(1)
        }, 0)
        setFood(generateFood(newSnake))
        toast.success('吃到食物！+10分')
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [checkCollision, generateFood, addFoodEaten, incrementGamesPlayed])

  // 方向控制
  const changeDirection = useCallback((newDirection: Direction) => {
    if (!gameStarted || gameOver) return
    
    setDirection(prev => {
      // 防止反向移动
      if (OPPOSITE_DIRECTIONS[prev] === newDirection) {
        return prev
      }
      return newDirection
    })
  }, [gameStarted, gameOver])

  // 游戏循环
  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(gameLoop, GAME_SPEED)
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameLoop, gameStarted, gameOver])

  // 键盘控制
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key in KEY_DIRECTION_MAP) {
        e.preventDefault()
        changeDirection(KEY_DIRECTION_MAP[e.key as keyof typeof KEY_DIRECTION_MAP] as Direction)
      } else if (e.key === ' ') {
        e.preventDefault()
        if (gameOver) {
          resetGame()
        } else {
          setGameStarted(prev => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [changeDirection, gameOver])

  // 触摸控制
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gameStarted || gameOver) return
      
      const { x: startX, y: startY } = touchStartRef.current
      if (!startX || !startY) return

      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY

      const diffX = startX - endX
      const diffY = startY - endY

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > MIN_SWIPE_DISTANCE) {
          changeDirection(diffX > 0 ? 'LEFT' : 'RIGHT')
        }
      } else {
        if (Math.abs(diffY) > MIN_SWIPE_DISTANCE) {
          changeDirection(diffY > 0 ? 'UP' : 'DOWN')
        }
      }

      touchStartRef.current = { x: 0, y: 0 }
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [changeDirection, gameStarted, gameOver])

  // 更新最高分
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score)
    }
  }, [score, bestScore, setBestScore])

  // 重置游戏
  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection('RIGHT')
    setGameOver(false)
    setGameStarted(false)
    setScore(0)
  }, [])

  // 开始/暂停游戏
  const toggleGame = useCallback(() => {
    if (gameOver) {
      resetGame()
    } else {
      setGameStarted(prev => !prev)
    }
  }, [gameOver, resetGame])

  // 渲染游戏格子
  const renderGameCell = useCallback((index: number) => {
    const x = index % BOARD_SIZE
    const y = Math.floor(index / BOARD_SIZE)
    
    const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y
    const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y)
    const isFood = food.x === x && food.y === y
    
    let cellClass = 'aspect-square rounded-sm transition-all duration-100 '
    
    if (isSnakeHead) {
      cellClass += 'bg-green-500 shadow-lg'
    } else if (isSnakeBody) {
      cellClass += 'bg-green-400'
    } else if (isFood) {
      cellClass += 'bg-red-500'
    } else {
      cellClass += 'bg-gray-100 dark:bg-gray-800'
    }
    
    return (
      <div key={index} className={cellClass}>
        {isFood && (
          <div className="w-full h-full flex items-center justify-center text-xs">
            🍎
          </div>
        )}
        {isSnakeHead && (
          <div className="w-full h-full flex items-center justify-center text-xs">
            🐍
          </div>
        )}
      </div>
    )
  }, [snake, food])

  // 渲染控制按钮
  const renderControlButton = useCallback((direction: Direction, emoji: string, className?: string) => (
    <Button
      variant="outline"
      size="sm"
      onClick={() => changeDirection(direction)}
      disabled={!gameStarted || gameOver}
      className={`w-12 h-12 ${className || ''}`}
    >
      {emoji}
    </Button>
  ), [changeDirection, gameStarted, gameOver])

  return (
    <div 
      className="container py-4 px-4 max-w-md mx-auto"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h1 className="text-3xl font-bold">贪吃蛇</h1>
          <GameRulesDialog
            title="贪吃蛇游戏规则"
            rules={[
              "控制蛇移动吃食物",
              "每个食物+10分",
              "不能撞墙或撞自己",
              "使用方向键或滑动控制",
              "按空格键暂停/开始游戏",
              "游戏结束后可以重新开始"
            ]}
          />
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          控制蛇吃食物，避免撞墙和撞自己！
        </p>
        
        <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">当前分数</div>
            <div className="text-xl font-bold">{score}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">最高分</div>
            <div className="text-xl font-bold">{bestScore}</div>
          </div>
        </div>
        
        <div className="flex justify-center space-x-2 mb-4">
          <Button onClick={toggleGame} variant="outline" size="sm">
            {gameOver ? '重新开始' : gameStarted ? '暂停' : '开始'}
          </Button>
          <Button onClick={resetGame} variant="outline" size="sm">
            重置
          </Button>
        </div>
      </div>

      <Card className="p-2 mb-4">
        <div 
          className="grid gap-0 bg-gray-50 dark:bg-gray-900 rounded-lg p-2"
          style={{ 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            aspectRatio: '1',
            touchAction: 'none'
          }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => renderGameCell(index))}
        </div>
      </Card>

      {/* 移动端控制按钮 */}
      <div className="mb-4">
        <div className="flex justify-center mb-2">
          {renderControlButton('UP', '⬆️')}
        </div>
        <div className="flex justify-center space-x-4 mb-2">
          {renderControlButton('LEFT', '⬅️')}
          {renderControlButton('RIGHT', '➡️')}
        </div>
        <div className="flex justify-center">
          {renderControlButton('DOWN', '⬇️')}
        </div>
      </div>
    </div>
  )
}