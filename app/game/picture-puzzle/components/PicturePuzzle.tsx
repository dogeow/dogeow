'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useGameStats } from '../hooks/useGameStats'
import { useGameSounds } from '../hooks/useGameSounds'

// 计时器组件
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

// 移动次数组件
function MoveCounter({ moves }: { moves: number }) {
  return (
    <div className="text-center">
      <div className="text-sm text-gray-500">移动次数</div>
      <div className="font-semibold">{moves}</div>
    </div>
  )
}

// 图片拼图组件接口
interface PicturePuzzleProps {
  imageUrl: string
  size: 3 | 4 | 5
  onComplete: () => void
}

// 拼图块接口
interface PuzzlePiece {
  id: number
  currentIndex: number
  correctIndex: number
  isEmpty: boolean
  imageStyle: React.CSSProperties
}

export default function PicturePuzzle({ imageUrl, size, onComplete }: PicturePuzzleProps) {
  const [pieces, setPieces] = useState<PuzzlePiece[]>([])
  const [moves, setMoves] = useState(0)
  const [startTime, setStartTime] = useState(new Date())
  const [isComplete, setIsComplete] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { stats, updateStats } = useGameStats(size)
  const { playMoveSound, playCompleteSound } = useGameSounds()

  // 检查拼图是否有解
  const checkSolvable = useCallback((board: number[], boardSize: number) => {
    const emptyIndex = board.indexOf(0)
    const emptyRow = Math.floor(emptyIndex / boardSize)

    let inversions = 0
    for (let i = 0; i < board.length; i++) {
      if (board[i] === 0) continue

      for (let j = i + 1; j < board.length; j++) {
        if (board[j] === 0) continue
        if (board[i] > board[j]) inversions++
      }
    }

    if (boardSize % 2 === 1) {
      return inversions % 2 === 0
    } else {
      const emptyRowFromBottom = boardSize - 1 - emptyRow
      return (inversions + emptyRowFromBottom) % 2 === 1
    }
  }, [])

  // 随机打乱并确保有解
  const shuffleBoard = useCallback(
    (board: number[], boardSize: number) => {
      const shuffled = [...board]
      let attempts = 0

      do {
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }
        attempts++
      } while (
        attempts < 100 &&
        (!checkSolvable(shuffled, boardSize) ||
          shuffled.every(
            (num, index) => num === index || (index === shuffled.length - 1 && num === 0)
          ))
      )

      return shuffled
    },
    [checkSolvable]
  )

  // 初始化拼图
  const initializePuzzle = useCallback(() => {
    const totalPieces = size * size
    const puzzleSize = 320 // 拼图总大小
    const pieceSize = puzzleSize / size

    // 创建初始顺序
    const initialOrder = Array.from({ length: totalPieces }, (_, i) => i)

    // 打乱顺序
    const shuffledOrder = shuffleBoard(initialOrder, size)

    // 创建拼图块
    const newPieces: PuzzlePiece[] = shuffledOrder.map((pieceId, currentIndex) => {
      const isEmpty = pieceId === totalPieces - 1
      const correctRow = Math.floor(pieceId / size)
      const correctCol = pieceId % size

      return {
        id: pieceId,
        currentIndex,
        correctIndex: pieceId,
        isEmpty,
        imageStyle: isEmpty
          ? {}
          : {
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: `${puzzleSize}px ${puzzleSize}px`,
              backgroundPosition: `-${correctCol * pieceSize}px -${correctRow * pieceSize}px`,
              backgroundRepeat: 'no-repeat',
            },
      }
    })

    setPieces(newPieces)
    setMoves(0)
    setStartTime(new Date())
    setIsComplete(false)
  }, [imageUrl, size, shuffleBoard])

  // 图片加载完成后初始化拼图
  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image()
      img.onload = () => {
        setImageLoaded(true)
        setPreviewImage(imageUrl)
        initializePuzzle()
      }
      img.onerror = () => {
        console.error('图片加载失败')
        setImageLoaded(false)
      }
      img.src = imageUrl
    }
  }, [imageUrl, initializePuzzle])

  // 移动拼图块
  const movePiece = useCallback(
    (clickedIndex: number) => {
      if (isComplete) return

      const emptyPiece = pieces.find(p => p.isEmpty)
      if (!emptyPiece) return

      const emptyIndex = emptyPiece.currentIndex

      // 检查是否可移动（与空白块相邻）
      const isValidMove =
        // 同一行相邻
        (Math.floor(clickedIndex / size) === Math.floor(emptyIndex / size) &&
          Math.abs(clickedIndex - emptyIndex) === 1) ||
        // 同一列相邻
        (clickedIndex % size === emptyIndex % size && Math.abs(clickedIndex - emptyIndex) === size)

      if (!isValidMove) return

      // 交换位置
      const newPieces = pieces.map(piece => {
        if (piece.currentIndex === clickedIndex) {
          return { ...piece, currentIndex: emptyIndex }
        } else if (piece.currentIndex === emptyIndex) {
          return { ...piece, currentIndex: clickedIndex }
        }
        return piece
      })

      setPieces(newPieces)
      setMoves(prev => prev + 1)

      // 播放移动音效
      playMoveSound()

      // 检查是否完成
      const completed = newPieces.every(piece =>
        piece.isEmpty
          ? piece.currentIndex === size * size - 1
          : piece.currentIndex === piece.correctIndex
      )

      if (completed) {
        setIsComplete(true)
        const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
        updateStats(completionTime, moves + 1) // +1 因为这是最后一步移动
        playCompleteSound()
        onComplete()
      }
    },
    [
      pieces,
      isComplete,
      size,
      onComplete,
      moves,
      playCompleteSound,
      startTime,
      updateStats,
      setPieces,
      setMoves,
      setIsComplete,
      playMoveSound,
    ]
  )

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isComplete || !imageLoaded) return

      const emptyPiece = pieces.find(p => p.isEmpty)
      if (!emptyPiece) return

      const emptyIndex = emptyPiece.currentIndex
      let targetIndex = -1

      switch (e.key) {
        case 'ArrowUp':
          if (emptyIndex < pieces.length - size) {
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
        movePiece(targetIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pieces, isComplete, imageLoaded, size, movePiece])

  // 重新开始游戏
  const resetGame = () => {
    initializePuzzle()
  }

  if (!imageLoaded) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-pulse">
          <div className="mx-auto mb-4 h-64 w-64 rounded-lg bg-gray-200"></div>
          <p>加载图片中...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex flex-col items-center">
      {/* 游戏信息 */}
      <Card className="mb-4 w-full p-4">
        <div className="flex items-center justify-between">
          <MoveCounter moves={moves} />
          <div className="text-center">
            <Timer startTime={startTime} />
          </div>
          <Button variant="outline" size="sm" onClick={resetGame}>
            重新开始
          </Button>
        </div>
      </Card>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        {/* 拼图游戏区域 */}
        <div className="flex flex-col items-center">
          <div
            className="grid gap-1 rounded-xl border-2 border-gray-300 bg-white p-2 shadow-lg"
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              width: '340px',
              height: '340px',
            }}
          >
            {Array.from({ length: size * size }).map((_, index) => {
              const piece = pieces.find(p => p.currentIndex === index)

              return (
                <div
                  key={index}
                  onClick={() => movePiece(index)}
                  className={`relative rounded-md border-2 select-none ${
                    piece?.isEmpty
                      ? 'border-dashed border-gray-300 bg-gray-50/50'
                      : 'hover:border-primary cursor-pointer border-gray-300 bg-white shadow-sm hover:shadow-lg'
                  } ${isComplete ? 'border-green-400 shadow-green-200' : ''} `}
                  style={{
                    width: `${320 / size - 2}px`,
                    height: `${320 / size - 2}px`,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    ...(!piece?.isEmpty ? piece?.imageStyle : {}),
                  }}
                >
                  {isComplete && piece?.isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-green-600">
                      ✓
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {isComplete && (
            <div className="mt-6 animate-bounce text-center">
              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 shadow-lg">
                <p className="mb-2 text-xl font-bold text-green-600">🎉 恭喜完成！</p>
                <div className="mb-3 text-sm text-gray-600">
                  <p>
                    用时 {Math.floor((new Date().getTime() - startTime.getTime()) / 1000)} 秒，移动{' '}
                    {moves} 次
                  </p>
                  {stats.gamesPlayed > 1 && (
                    <div className="mt-2 space-y-1">
                      {stats.bestTime ===
                        Math.floor((new Date().getTime() - startTime.getTime()) / 1000) && (
                        <p className="font-medium text-green-600">⚡ 新的最佳时间记录！</p>
                      )}
                      {stats.bestMoves === moves && (
                        <p className="font-medium text-green-600">🎯 新的最少移动记录！</p>
                      )}
                    </div>
                  )}
                </div>
                <Button onClick={resetGame} className="mt-2" size="sm">
                  再玩一次
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="flex flex-col items-center space-y-4">
          {stats.gamesPlayed > 0 && (
            <Card className="w-48 p-3">
              <h4 className="mb-2 text-sm font-medium text-gray-600">个人记录</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">最佳时间:</span>
                  <span className="font-mono">
                    {stats.bestTime
                      ? `${Math.floor(stats.bestTime / 60)}:${(stats.bestTime % 60).toString().padStart(2, '0')}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">最少移动:</span>
                  <span className="font-mono">{stats.bestMoves || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">完成次数:</span>
                  <span className="font-mono">{stats.gamesPlayed}</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
