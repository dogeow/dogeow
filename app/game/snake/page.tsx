"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSnakeGameStore } from "@/stores/snakeGameStore"

type Position = { x: number; y: number }
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

const BOARD_SIZE = 20
const INITIAL_SNAKE = [{ x: 10, y: 10 }]
const INITIAL_FOOD = { x: 15, y: 15 }
const GAME_SPEED = 150

// 初始化棋盘
function initializeGame() {
  return {
    snake: INITIAL_SNAKE,
    food: INITIAL_FOOD
  }
}

export default function SnakeGame() {
  const { bestScore, setBestScore, incrementGamesPlayed, addFoodEaten } = useSnakeGameStore()
  const [snake, setSnake] = useState<Position[]>(() => initializeGame().snake)
  const [food, setFood] = useState<Position>(INITIAL_FOOD)
  const [direction, setDirection] = useState<Direction>('RIGHT')
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)

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
      if (gameOver || !gameStarted) return currentSnake

      const newSnake = [...currentSnake]
      const head = { ...newSnake[0] }

      // 根据方向移动蛇头
      switch (direction) {
        case 'UP':
          head.y -= 1
          break
        case 'DOWN':
          head.y += 1
          break
        case 'LEFT':
          head.x -= 1
          break
        case 'RIGHT':
          head.x += 1
          break
      }

      // 检查碰撞
      if (checkCollision(head, newSnake)) {
        setGameOver(true)
        setGameStarted(false)
        incrementGamesPlayed()
        toast.error('游戏结束！')
        return currentSnake
      }

      newSnake.unshift(head)

      // 检查是否吃到食物
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10)
        addFoodEaten(1)
        setFood(generateFood(newSnake))
        toast.success('吃到食物！+10分')
      } else {
        newSnake.pop()
      }

      return newSnake
    })
  }, [direction, food, gameOver, gameStarted, checkCollision, generateFood, addFoodEaten, incrementGamesPlayed])

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
      if (!gameStarted || gameOver) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          setDirection(prev => prev !== 'DOWN' ? 'UP' : prev)
          break
        case 'ArrowDown':
          e.preventDefault()
          setDirection(prev => prev !== 'UP' ? 'DOWN' : prev)
          break
        case 'ArrowLeft':
          e.preventDefault()
          setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev)
          break
        case 'ArrowRight':
          e.preventDefault()
          setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev)
          break
        case ' ':
          e.preventDefault()
          if (gameOver) {
            resetGame()
          } else {
            setGameStarted(prev => !prev)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [gameStarted, gameOver])

  // 触摸控制
  useEffect(() => {
    let startX = 0
    let startY = 0

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gameStarted || gameOver) return
      if (!startX || !startY) return

      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY

      const diffX = startX - endX
      const diffY = startY - endY

      const minSwipeDistance = 30

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipeDistance) {
          if (diffX > 0) {
            setDirection(prev => prev !== 'RIGHT' ? 'LEFT' : prev)
          } else {
            setDirection(prev => prev !== 'LEFT' ? 'RIGHT' : prev)
          }
        }
      } else {
        if (Math.abs(diffY) > minSwipeDistance) {
          if (diffY > 0) {
            setDirection(prev => prev !== 'DOWN' ? 'UP' : prev)
          } else {
            setDirection(prev => prev !== 'UP' ? 'DOWN' : prev)
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
  }, [gameStarted, gameOver])

  // 更新最高分
  useEffect(() => {
    if (score > 0) {
      setBestScore(score)
    }
  }, [score, setBestScore])

  // 重置游戏
  const resetGame = () => {
    setSnake(INITIAL_SNAKE)
    setFood(INITIAL_FOOD)
    setDirection('RIGHT')
    setGameOver(false)
    setGameStarted(false)
    setScore(0)
  }

  // 开始/暂停游戏
  const toggleGame = () => {
    if (gameOver) {
      resetGame()
    } else {
      setGameStarted(prev => !prev)
    }
  }

  // 方向控制按钮
  const handleDirectionChange = (newDirection: Direction) => {
    if (!gameStarted || gameOver) return
    
    setDirection(prev => {
      if (
        (prev === 'UP' && newDirection === 'DOWN') ||
        (prev === 'DOWN' && newDirection === 'UP') ||
        (prev === 'LEFT' && newDirection === 'RIGHT') ||
        (prev === 'RIGHT' && newDirection === 'LEFT')
      ) {
        return prev
      }
      return newDirection
    })
  }

  return (
    <div 
      className="container py-4 px-4 max-w-md mx-auto"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">贪吃蛇</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          控制蛇吃食物，避免撞墙和撞自己！
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
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
            const x = index % BOARD_SIZE
            const y = Math.floor(index / BOARD_SIZE)
            
            const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y
            const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y)
            const isFood = food.x === x && food.y === y
            
            return (
              <div
                key={index}
                className={`
                  aspect-square rounded-sm transition-all duration-100
                  ${isSnakeHead ? 'bg-green-500 shadow-lg' : ''}
                  ${isSnakeBody ? 'bg-green-400' : ''}
                  ${isFood ? 'bg-red-500' : ''}
                  ${!isSnakeHead && !isSnakeBody && !isFood ? 'bg-gray-100 dark:bg-gray-800' : ''}
                `}
              >
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
          })}
        </div>
      </Card>

      {/* 移动端控制按钮 */}
      <div className="mb-4">
        <div className="flex justify-center mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDirectionChange('UP')}
            disabled={!gameStarted || gameOver}
            className="w-12 h-12"
          >
            ⬆️
          </Button>
        </div>
        <div className="flex justify-center space-x-4 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDirectionChange('LEFT')}
            disabled={!gameStarted || gameOver}
            className="w-12 h-12"
          >
            ⬅️
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDirectionChange('RIGHT')}
            disabled={!gameStarted || gameOver}
            className="w-12 h-12"
          >
            ➡️
          </Button>
        </div>
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDirectionChange('DOWN')}
            disabled={!gameStarted || gameOver}
            className="w-12 h-12"
          >
            ⬇️
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="mb-2 font-medium text-blue-800 dark:text-blue-200">游戏说明</p>
          <p className="mb-1">🐍 控制蛇移动吃食物</p>
          <p className="mb-1">🍎 每个食物+10分</p>
          <p className="mb-1">⚠️ 不能撞墙或撞自己</p>
          <p>🎮 使用方向键或滑动控制</p>
        </div>
        
        <div className="flex justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <span>⬆️⬇️⬅️➡️</span>
            <span>方向键</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>📱</span>
            <span>滑动手势</span>
          </div>
          <div className="flex items-center space-x-1">
            <span>空格</span>
            <span>暂停/开始</span>
          </div>
        </div>
      </div>
    </div>
  )
} 