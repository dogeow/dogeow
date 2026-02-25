'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useGame2048Store } from './store'
import { GameRulesDialog } from '@/components/ui/game-rules-dialog'
import Link from 'next/link'
import { GameBoard } from './components/GameBoard'
import { DirectionControls } from './components/DirectionControls'
import {
  type Board,
  type Direction,
  initializeBoard,
  addRandomTile,
  isGameOver,
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
} from './utils/gameEngine'

type SpeedOption = { value: number; label: string }

const MIN_SWIPE_DISTANCE = 30
const MOVE_THROTTLE = 200
const RANDOM_DIRECTION_DISPLAY_TIME = 500
const GYRO_THRESHOLD = 25

const SPEED_OPTIONS: SpeedOption[] = [
  { value: 1, label: '不能再快了' },
  { value: 200, label: '快' },
  { value: 500, label: '正常' },
  { value: 1000, label: '慢' },
]

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left']
const getNextDirection = (dir: Direction, clockwise: boolean): Direction => {
  const idx = DIRECTIONS.indexOf(dir)
  return DIRECTIONS[(idx + (clockwise ? 1 : 3)) % 4]
}

const getRandomDirection = (): Direction => DIRECTIONS[Math.floor(Math.random() * 4)]

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

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
    2048: 'bg-green-500 text-white dark:bg-green-400 shadow-lg shadow-green-500/50',
  }
  return (
    colorMap[value] || 'bg-purple-500 text-white dark:bg-purple-400 shadow-lg shadow-purple-500/50'
  )
}

export default function Game2048() {
  const { bestScore, setBestScore, incrementGamesPlayed, incrementGamesWon } = useGame2048Store()
  const [board, setBoard] = useState<Board>(initializeBoard)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [history, setHistory] = useState<{ board: Board; score: number }[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [isDirectionalRunning, setIsDirectionalRunning] = useState(false)
  const [currentDirection, setCurrentDirection] = useState<Direction>('down')
  const [isClockwise, setIsClockwise] = useState(true)
  const [speed, setSpeed] = useState(500)
  const [showRandomDirection, setShowRandomDirection] = useState<Direction | null>(null)
  const [isGyroEnabled, setIsGyroEnabled] = useState(false)
  const [isGyroSupported, setIsGyroSupported] = useState(
    () => isMobileDevice() && typeof DeviceOrientationEvent !== 'undefined'
  )
  const [isMobile] = useState(() => isMobileDevice())

  // refs
  const autoRunIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const directionalRunIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const randomDirectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastGyroMoveTime = useRef<number>(0)
  const moveAudioContextRef = useRef<AudioContext | null>(null)

  const initMoveAudioContext = useCallback(() => {
    if (moveAudioContextRef.current || typeof window === 'undefined') return
    const AudioContextCtor =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextCtor) return
    try {
      moveAudioContextRef.current = new AudioContextCtor()
    } catch (err) {
      // ignore
    }
  }, [])

  const unlockMoveAudio = useCallback(() => {
    initMoveAudioContext()
    const ctx = moveAudioContextRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
  }, [initMoveAudioContext])

  const playMoveSound = useCallback(() => {
    initMoveAudioContext()
    const ctx = moveAudioContextRef.current
    if (!ctx) return
    const play = () => {
      try {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(700, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.02, ctx.currentTime + 0.12)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.12)
      } catch {}
    }
    if (ctx.state === 'suspended') {
      void ctx.resume().then(() => {
        if (ctx.state === 'running') play()
      })
      return
    }
    play()
  }, [initMoveAudioContext])

  const moveHandlers = useMemo(
    () => ({
      left: moveLeft,
      right: moveRight,
      up: moveUp,
      down: moveDown,
    }),
    []
  )

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

  // 主要移动逻辑
  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver) return
      setBoard(curBoard => {
        const result = moveHandlers[direction](curBoard)
        if (result.moved) {
          playMoveSound()
          const newBoard = [...result.newBoard]
          addRandomTile(newBoard)
          // check 2048
          if (!gameWon && newBoard.some(row => row.includes(2048))) {
            setGameWon(true)
            incrementGamesWon()
          }
          setScore(curScore => {
            setHistory(hist => [...hist.slice(-4), { board: [...curBoard], score: curScore }])
            return curScore + result.scoreGained
          })
          setCanUndo(true)
          if (isGameOver(newBoard)) {
            stopAutoRun()
            stopDirectionalRun()
            setIsAutoRunning(false)
            setIsDirectionalRunning(false)
            setGameOver(true)
            incrementGamesPlayed()
            toast.error('游戏结束！')
          }
          return newBoard
        }
        return curBoard
      })
    },
    [
      gameOver,
      gameWon,
      incrementGamesPlayed,
      incrementGamesWon,
      moveHandlers,
      stopAutoRun,
      stopDirectionalRun,
      playMoveSound,
    ]
  )

  // 自动/顺时针/逆时针运行
  const startAutoRun = useCallback(() => {
    autoRunIntervalRef.current = setInterval(() => {
      handleMove(getRandomDirection())
    }, speed)
  }, [handleMove, speed])

  const startDirectionalRun = useCallback(
    (clockwise: boolean) => {
      directionalRunIntervalRef.current = setInterval(() => {
        setCurrentDirection(prev => {
          const nextDir = getNextDirection(prev, clockwise)
          handleMove(nextDir)
          return nextDir
        })
      }, speed)
    },
    [handleMove, speed]
  )

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

  const toggleClockwiseRun = useCallback(() => {
    if (isDirectionalRunning && isClockwise) {
      stopDirectionalRun()
      setIsDirectionalRunning(false)
      return
    }
    if (isDirectionalRunning) stopDirectionalRun()
    setIsClockwise(true)
    setIsDirectionalRunning(true)
    startDirectionalRun(true)
  }, [isDirectionalRunning, isClockwise, startDirectionalRun, stopDirectionalRun])

  const toggleCounterClockwiseRun = useCallback(() => {
    if (isDirectionalRunning && !isClockwise) {
      stopDirectionalRun()
      setIsDirectionalRunning(false)
      return
    }
    if (isDirectionalRunning) stopDirectionalRun()
    setIsClockwise(false)
    setIsDirectionalRunning(true)
    startDirectionalRun(false)
  }, [isDirectionalRunning, isClockwise, startDirectionalRun, stopDirectionalRun])

  const changeSpeed = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed)
      if (isAutoRunning) {
        stopAutoRun()
        setTimeout(startAutoRun, 0)
      }
      if (isDirectionalRunning) {
        stopDirectionalRun()
        setTimeout(() => startDirectionalRun(isClockwise), 0)
      }
    },
    [
      isAutoRunning,
      isDirectionalRunning,
      startAutoRun,
      startDirectionalRun,
      stopAutoRun,
      stopDirectionalRun,
      isClockwise,
    ]
  )

  const randomMoveOnce = useCallback(() => {
    if (gameOver || isAutoRunning || isDirectionalRunning) return
    const d = getRandomDirection()
    setShowRandomDirection(d)
    handleMove(d)
    if (randomDirectionTimeoutRef.current) clearTimeout(randomDirectionTimeoutRef.current)
    randomDirectionTimeoutRef.current = setTimeout(
      () => setShowRandomDirection(null),
      RANDOM_DIRECTION_DISPLAY_TIME
    )
  }, [gameOver, isAutoRunning, isDirectionalRunning, handleMove])

  // 陀螺仪
  const requestGyroPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setIsGyroSupported(false)
      return false
    }
    const devOrientation = DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof devOrientation.requestPermission === 'function') {
      try {
        const permission = await devOrientation.requestPermission()
        if (permission === 'granted') {
          setIsGyroSupported(true)
          return true
        } else {
          toast.error('陀螺仪权限被拒绝')
          setIsGyroSupported(false)
          return false
        }
      } catch {
        toast.error('请求陀螺仪权限失败')
        setIsGyroSupported(false)
        return false
      }
    }
    setIsGyroSupported(true)
    return true
  }, [])

  const toggleGyro = useCallback(async () => {
    if (!isGyroEnabled) {
      if (await requestGyroPermission()) setIsGyroEnabled(true)
    } else setIsGyroEnabled(false)
  }, [isGyroEnabled, requestGyroPermission])

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
    if (history.length && canUndo) {
      const last = history[history.length - 1]
      setBoard(last.board)
      setScore(last.score)
      setHistory(prev => prev.slice(0, -1))
      setCanUndo(history.length > 1)
      setGameOver(false)
      playMoveSound()
    }
  }, [history, canUndo, playMoveSound])

  // 键盘
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const dir: Record<string, Direction> = {
        ArrowLeft: 'left',
        ArrowRight: 'right',
        ArrowUp: 'up',
        ArrowDown: 'down',
      }
      const direction = dir[e.key]
      if (direction) {
        e.preventDefault()
        handleMove(direction)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleMove])

  // 触摸
  useEffect(() => {
    if (isGyroEnabled) return
    let startX = 0,
      startY = 0,
      lastMoveTime = 0,
      touching = false
    const onStart = (e: TouchEvent) => {
      const t = e.target as HTMLElement
      touching = !!t.closest('[data-game-board]')
      if (touching) {
        startX = e.touches[0].clientX
        startY = e.touches[0].clientY
      }
    }
    const onMove = (e: TouchEvent) => {
      if (!touching || !startX || !startY) return
      const now = Date.now()
      if (now - lastMoveTime < MOVE_THROTTLE) return
      const [x, y] = [e.touches[0].clientX, e.touches[0].clientY]
      const [diffX, diffY] = [startX - x, startY - y]
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > MIN_SWIPE_DISTANCE) {
          handleMove(diffX > 0 ? 'left' : 'right')
          startX = x
          startY = y
          lastMoveTime = now
        }
      } else if (Math.abs(diffY) > MIN_SWIPE_DISTANCE) {
        handleMove(diffY > 0 ? 'up' : 'down')
        startX = x
        startY = y
        lastMoveTime = now
      }
    }
    const onEnd = () => {
      startX = 0
      startY = 0
      lastMoveTime = 0
      touching = false
    }
    document.addEventListener('touchstart', onStart)
    document.addEventListener('touchmove', onMove)
    document.addEventListener('touchend', onEnd)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [handleMove, isGyroEnabled])

  // 陀螺仪
  useEffect(() => {
    if (!isGyroEnabled) return
    const handleOrientation = (event: DeviceOrientationEvent) => {
      const now = Date.now()
      if (now - lastGyroMoveTime.current < MOVE_THROTTLE) return
      const { beta, gamma } = event
      if (beta == null || gamma == null) return
      let dir: Direction | null = null
      if (Math.abs(gamma) > Math.abs(beta)) {
        if (gamma > GYRO_THRESHOLD) dir = 'right'
        else if (gamma < -GYRO_THRESHOLD) dir = 'left'
      } else {
        if (beta > GYRO_THRESHOLD) dir = 'down'
        else if (beta < -GYRO_THRESHOLD) dir = 'up'
      }
      if (dir) {
        handleMove(dir)
        lastGyroMoveTime.current = now
      }
    }
    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [isGyroEnabled, handleMove])

  // 自动运行重启和清理
  useEffect(() => {
    if (isAutoRunning && !autoRunIntervalRef.current) startAutoRun()
  }, [isAutoRunning, startAutoRun])
  useEffect(() => {
    if (isDirectionalRunning && !directionalRunIntervalRef.current) startDirectionalRun(isClockwise)
  }, [isDirectionalRunning, isClockwise, startDirectionalRun])
  useEffect(() => {
    if (score > 0) setBestScore(score)
  }, [score, setBestScore])
  useEffect(() => {
    if (typeof window === 'undefined') return
    const unlock = () => unlockMoveAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [unlockMoveAudio])
  useEffect(
    () => () => {
      stopAutoRun()
      stopDirectionalRun()
      if (randomDirectionTimeoutRef.current) clearTimeout(randomDirectionTimeoutRef.current)
    },
    [stopAutoRun, stopDirectionalRun]
  )

  // 展示组件
  const GameStats = useMemo(
    () => (
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">当前分数</div>
          <div className="text-xl font-bold">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">最高分</div>
          <div className="text-xl font-bold">{bestScore}</div>
        </div>
      </div>
    ),
    [score, bestScore]
  )

  const GameBoardView = useMemo(
    () => <GameBoard board={board} getTileColor={getTileColor} />,
    [board]
  )

  const DirectionControlsView = useMemo(
    () => (
      <DirectionControls
        onMove={handleMove}
        onRandomMove={randomMoveOnce}
        disabled={gameOver || isAutoRunning || isDirectionalRunning}
        showRandomDirection={showRandomDirection}
      />
    ),
    [gameOver, isAutoRunning, isDirectionalRunning, showRandomDirection, handleMove, randomMoveOnce]
  )

  const AutoRunControls = useMemo(() => {
    const speedIndex = Math.max(
      0,
      SPEED_OPTIONS.findIndex(opt => opt.value === speed)
    )
    return (
      <div className="mb-6 space-y-3">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant={isAutoRunning ? 'default' : 'outline'}
              size="icon"
              onClick={toggleAutoRun}
              disabled={gameOver || isDirectionalRunning}
              className="h-10 w-10 text-lg"
            >
              🎲
            </Button>
            <Button
              variant={isDirectionalRunning && isClockwise ? 'default' : 'outline'}
              size="icon"
              onClick={toggleClockwiseRun}
              disabled={gameOver || isAutoRunning}
              className="h-10 w-10 text-lg"
            >
              ↻
            </Button>
            <Button
              variant={isDirectionalRunning && !isClockwise ? 'default' : 'outline'}
              size="icon"
              onClick={toggleCounterClockwiseRun}
              disabled={gameOver || isAutoRunning}
              className="h-10 w-10 text-lg"
            >
              ↺
            </Button>
          </div>
          <div className="mt-3">
            <div className="mx-auto w-full max-w-xs">
              <input
                type="range"
                min={0}
                max={SPEED_OPTIONS.length - 1}
                step={1}
                value={speedIndex}
                onInput={event => {
                  const idx = Number(event.currentTarget.value)
                  changeSpeed(SPEED_OPTIONS[idx]?.value ?? speed)
                }}
                disabled={gameOver}
                className="w-full"
              />
              <div className="mt-2 grid grid-cols-4 text-xs text-gray-500 dark:text-gray-400">
                {SPEED_OPTIONS.map((option, idx) => (
                  <span
                    key={option.value}
                    className={`text-center ${idx === speedIndex ? 'text-foreground font-medium' : ''}`}
                  >
                    {option.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }, [
    speed,
    gameOver,
    isAutoRunning,
    isDirectionalRunning,
    isClockwise,
    changeSpeed,
    toggleAutoRun,
    toggleClockwiseRun,
    toggleCounterClockwiseRun,
  ])

  const GyroControls = useMemo(
    () =>
      isMobile && isGyroSupported ? (
        <Button
          variant={isGyroEnabled ? 'default' : 'outline'}
          size="sm"
          onClick={toggleGyro}
          disabled={gameOver}
          className={isGyroEnabled ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
        >
          {isGyroEnabled ? '陀螺仪已启用' : '陀螺仪'}
        </Button>
      ) : null,
    [isMobile, isGyroSupported, isGyroEnabled, gameOver, toggleGyro]
  )

  return (
    <div className="container mx-auto max-w-md px-4 py-4" onContextMenu={e => e.preventDefault()}>
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            <Link href="/game" className="hover:text-foreground transition-colors">
              游戏中心
            </Link>
            <span className="mx-1">{'>'}</span>
            <span className="text-foreground font-medium">2048</span>
          </div>
          <GameRulesDialog
            title="2048游戏规则"
            rules={[
              '滑动屏幕或使用方向键移动方块',
              '移动设备可启用陀螺仪，倾斜设备来控制',
              '相同数字的方块会合并成更大的数字',
              '目标：合并出2048方块！',
              '可使用按钮手动控制或自动运行',
              '支持撤销上一步操作',
              '游戏结束条件：棋盘填满且无法合并',
            ]}
          />
        </div>
        <div className="text-center">
          {GameStats}
          <div className="mb-4 flex items-center justify-end space-x-2">
            {GyroControls}
            <Button onClick={undoMove} variant="outline" size="sm" disabled={!canUndo}>
              撤销
            </Button>
            <Button onClick={resetGame} variant="outline" size="sm">
              重新开始
            </Button>
          </div>
        </div>
      </div>
      {GameBoardView}
      {gameWon && (
        <div className="mb-4 rounded-lg bg-green-100 p-4 text-center dark:bg-green-900/20">
          <div className="font-bold text-green-800 dark:text-green-200">
            🎉 恭喜！你达到了2048！
          </div>
          <div className="text-sm text-green-600 dark:text-green-300">继续游戏挑战更高分数</div>
        </div>
      )}
      {gameOver && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-center dark:bg-red-900/20">
          <div className="font-bold text-red-800 dark:text-red-200">游戏结束</div>
          <div className="text-sm text-red-600 dark:text-red-300">最终分数: {score}</div>
        </div>
      )}
      {DirectionControlsView}
      <div className="bg-border my-6 h-px w-full" />
      {AutoRunControls}
    </div>
  )
}
