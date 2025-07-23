import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useTetrisStore } from '../store'
import { GameState, Position } from '../types'
import {
  createEmptyBoard,
  generateRandomTetromino,
  isValidPosition,
  rotateTetromino,
  placeTetromino,
  clearLines,
  calculateScore,
  calculateLevel,
  getDropSpeed,
  calculateHardDropDistance,
} from '../utils'
import { SCORING, GAME_SPEED } from '../constants'

export function useTetrisGame() {
  const { bestScore, setBestScore, incrementGamesPlayed, addLinesCleared } = useTetrisStore()

  const [gameState, setGameState] = useState<GameState>(() => ({
    board: createEmptyBoard(),
    currentPiece: null,
    nextPiece: null,
    score: 0,
    lines: 0,
    level: 1,
    gameOver: false,
    paused: false,
    isClient: false,
  }))

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const lastDropTime = useRef<number>(Date.now())
  const softDropRef = useRef<NodeJS.Timeout | null>(null)
  const [isSoftDropping, setIsSoftDropping] = useState(false)

  // 客户端挂载后初始化游戏
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      isClient: true,
      currentPiece: generateRandomTetromino(),
      nextPiece: generateRandomTetromino(),
    }))
  }, [])

  // 确保 nextPiece 始终有值（仅在客户端）
  useEffect(() => {
    if (gameState.isClient && !gameState.nextPiece) {
      setGameState(prev => ({
        ...prev,
        nextPiece: generateRandomTetromino(),
      }))
    }
  }, [gameState.isClient, gameState.nextPiece])

  // 移动方块
  const movePiece = useCallback(
    (direction: 'left' | 'right' | 'down'): boolean => {
      if (!gameState.currentPiece || gameState.gameOver || gameState.paused) return false

      const newPosition: Position = { ...gameState.currentPiece.position }

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

      if (isValidPosition(gameState.board, gameState.currentPiece, newPosition)) {
        setGameState(prev => ({
          ...prev,
          currentPiece: prev.currentPiece ? { ...prev.currentPiece, position: newPosition } : null,
        }))
        return true
      }

      return false
    },
    [gameState.currentPiece, gameState.board, gameState.gameOver, gameState.paused]
  )

  // 旋转方块
  const rotatePiece = useCallback(() => {
    if (!gameState.currentPiece || gameState.gameOver || gameState.paused) return

    const rotated = rotateTetromino(gameState.currentPiece)

    if (isValidPosition(gameState.board, rotated, rotated.position)) {
      setGameState(prev => ({
        ...prev,
        currentPiece: rotated,
      }))
    }
  }, [gameState.currentPiece, gameState.board, gameState.gameOver, gameState.paused])

  // 硬降
  const hardDrop = useCallback(() => {
    if (!gameState.currentPiece || gameState.gameOver || gameState.paused) return

    const dropDistance = calculateHardDropDistance(gameState.board, gameState.currentPiece)

    if (dropDistance > 0) {
      const newPosition = {
        ...gameState.currentPiece.position,
        y: gameState.currentPiece.position.y + dropDistance,
      }

      setGameState(prev => ({
        ...prev,
        currentPiece: prev.currentPiece ? { ...prev.currentPiece, position: newPosition } : null,
        score: prev.score + dropDistance * SCORING.HARD_DROP_BONUS,
      }))
    }
  }, [gameState.currentPiece, gameState.board, gameState.gameOver, gameState.paused])

  // 开始软降
  const startSoftDrop = useCallback(() => {
    if (isSoftDropping || gameState.gameOver || gameState.paused) return

    setIsSoftDropping(true)

    const softDropLoop = () => {
      if (!gameState.currentPiece || gameState.gameOver || gameState.paused) return

      const newPosition = { ...gameState.currentPiece.position }
      newPosition.y += 1

      if (isValidPosition(gameState.board, gameState.currentPiece, newPosition)) {
        setGameState(prev => ({
          ...prev,
          currentPiece: prev.currentPiece ? { ...prev.currentPiece, position: newPosition } : null,
          score: prev.score + SCORING.SOFT_DROP_BONUS,
        }))
        softDropRef.current = setTimeout(softDropLoop, GAME_SPEED.SOFT_DROP)
      } else {
        setIsSoftDropping(false)
      }
    }

    softDropLoop()
  }, [
    isSoftDropping,
    gameState.gameOver,
    gameState.paused,
    gameState.currentPiece,
    gameState.board,
  ])

  // 停止软降
  const stopSoftDrop = useCallback(() => {
    if (softDropRef.current) {
      clearTimeout(softDropRef.current)
      softDropRef.current = null
    }
    setIsSoftDropping(false)
  }, [])

  // 游戏循环
  useEffect(() => {
    if (!gameState.isClient || gameState.gameOver || gameState.paused || !gameState.currentPiece)
      return

    const dropSpeed = getDropSpeed(gameState.level)

    const gameLoop = () => {
      const now = Date.now()
      if (now - lastDropTime.current >= dropSpeed) {
        if (!movePiece('down')) {
          // 方块无法下移，固定到棋盘上
          const newBoard = placeTetromino(gameState.board, gameState.currentPiece!)
          const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard)

          let newScore = gameState.score
          let newLines = gameState.lines
          let newLevel = gameState.level

          if (linesCleared > 0) {
            newScore += calculateScore(linesCleared, gameState.level)
            newLines += linesCleared
            newLevel = calculateLevel(newLines)
            addLinesCleared(linesCleared)

            if (newScore > bestScore) {
              setBestScore(newScore)
            }

            toast.success(`消除了 ${linesCleared} 行！`)
          }

          // 生成新方块
          const newPiece = gameState.nextPiece || generateRandomTetromino()
          const nextNewPiece = generateRandomTetromino()

          // 检查游戏是否结束
          if (!isValidPosition(clearedBoard, newPiece, newPiece.position)) {
            setGameState(prev => ({
              ...prev,
              gameOver: true,
              score: newScore,
            }))
            incrementGamesPlayed()
            if (newScore > bestScore) {
              setBestScore(newScore)
            }
            toast.error('游戏结束！')
          } else {
            setGameState(prev => ({
              ...prev,
              board: clearedBoard,
              currentPiece: newPiece,
              nextPiece: nextNewPiece,
              score: newScore,
              lines: newLines,
              level: newLevel,
            }))
          }
        }
        lastDropTime.current = now
      }
    }

    gameLoopRef.current = setInterval(gameLoop, GAME_SPEED.NORMAL_DROP)

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [gameState, movePiece, bestScore, setBestScore, incrementGamesPlayed, addLinesCleared])

  // 重置游戏
  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: createEmptyBoard(),
      currentPiece: generateRandomTetromino(),
      nextPiece: generateRandomTetromino(),
      score: 0,
      lines: 0,
      level: 1,
      gameOver: false,
      paused: false,
    }))
    setIsSoftDropping(false)
    if (softDropRef.current) {
      clearTimeout(softDropRef.current)
      softDropRef.current = null
    }
    lastDropTime.current = Date.now()
  }, [])

  // 暂停/继续游戏
  const togglePause = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      paused: !prev.paused,
    }))
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (softDropRef.current) {
        clearTimeout(softDropRef.current)
      }
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current)
      }
    }
  }, [])

  return {
    gameState,
    isSoftDropping,
    movePiece,
    rotatePiece,
    hardDrop,
    startSoftDrop,
    stopSoftDrop,
    resetGame,
    togglePause,
    bestScore,
  }
}
