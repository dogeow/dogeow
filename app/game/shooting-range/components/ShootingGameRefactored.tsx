'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Button } from '@/components/ui/button'
import { GameScene } from './game/GameScene'
import { GameUI } from './game/GameUI'
import { Crosshair } from './game/Crosshair'

interface ShootingGameProps {
  difficulty: 'easy' | 'medium' | 'hard'
  setGameStarted?: (started: boolean) => void
}

/**
 * 射击游戏主组件（重构版）
 * 拆分后的轻量级主文件
 */
export default function ShootingGame({ difficulty, setGameStarted }: ShootingGameProps) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [gameOver, setGameOver] = useState(false)
  const [gameStarted, setGameStartedState] = useState(false)
  const [showStartOverlay, setShowStartOverlay] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 错误状态处理
  const [pointerLockError, setPointerLockError] = useState<string | null>(null)

  // 浏览器兼容性
  const [browserSupport, setBrowserSupport] = useState({
    supported: true,
    message: '',
    useFallback: false,
  })

  // 防止空格键引起页面滚动
  useEffect(() => {
    const preventSpacebarScroll = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', preventSpacebarScroll, { passive: false })
    return () => window.removeEventListener('keydown', preventSpacebarScroll)
  }, [])

  // 处理得分
  const handleScore = () => {
    setScore(prev => prev + 10)
  }

  // 倒计时
  useEffect(() => {
    if (!gameStarted || gameOver) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer)
          setGameOver(true)
          return 0
        }
        return prev - 0.1
      })
    }, 100)

    return () => clearInterval(timer)
  }, [gameStarted, gameOver])

  // 重新开始游戏
  const handleRestart = () => {
    setScore(0)
    setTimeLeft(60)
    setGameOver(false)
  }

  // 统一处理游戏开始
  const startGame = useCallback(() => {
    setShowStartOverlay(false)
    setGameStartedState(true)
    if (setGameStarted) setGameStarted(true)

    setTimeout(() => {
      if (!browserSupport.useFallback && canvasRef.current) {
        try {
          if (canvasRef.current.requestPointerLock) {
            canvasRef.current.requestPointerLock()
          }
        } catch (e) {
          console.error('锁定指针失败:', e)
          setBrowserSupport(prev => ({ ...prev, useFallback: true }))
        }
      }
    }, 300)
  }, [browserSupport.useFallback, setGameStarted, canvasRef])

  // 检查浏览器兼容性
  useEffect(() => {
    const checkBrowserSupport = () => {
      if (
        !('pointerLockElement' in document) &&
        !('mozPointerLockElement' in document) &&
        !('webkitPointerLockElement' in document)
      ) {
        setBrowserSupport({
          supported: false,
          message: '您的浏览器不支持Pointer Lock API，游戏将以有限功能模式运行。',
          useFallback: true,
        })
        return
      }

      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      ) {
        setBrowserSupport({
          supported: false,
          message: '射击游戏需要使用鼠标控制，不支持移动设备。',
          useFallback: false,
        })
        return
      }
    }

    checkBrowserSupport()

    const handlePointerLockError = () => {
      setPointerLockError('浏览器拒绝了指针锁定请求')
      setBrowserSupport(prev => ({
        ...prev,
        useFallback: true,
      }))
    }

    document.addEventListener('pointerlockerror', handlePointerLockError)
    document.addEventListener('mozpointerlockerror', handlePointerLockError)
    document.addEventListener('webkitpointerlockerror', handlePointerLockError)

    return () => {
      document.removeEventListener('pointerlockerror', handlePointerLockError)
      document.removeEventListener('mozpointerlockerror', handlePointerLockError)
      document.removeEventListener('webkitpointerlockerror', handlePointerLockError)
    }
  }, [])

  // 键盘启动游戏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && !gameStarted && !gameOver) {
        e.preventDefault()
        startGame()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameStarted, gameOver, startGame])

  // 点击Canvas启动游戏
  const handleCanvasClick = useCallback(() => {
    if (!gameStarted && !gameOver) {
      startGame()
    }
  }, [gameStarted, gameOver, startGame])

  // 清除错误并重试
  const handleRetry = () => {
    setPointerLockError(null)

    try {
      if (document.pointerLockElement) {
        document.exitPointerLock()
      }
    } catch (e) {
      console.error('释放指针锁失败:', e)
    }

    setGameStartedState(false)
    if (setGameStarted) setGameStarted(false)
    setGameOver(false)
    setShowStartOverlay(true)
  }

  // 返回设置
  const handleBackToSettings = useCallback(() => {
    try {
      if (document.pointerLockElement) {
        document.exitPointerLock()
      }
    } catch (e) {
      console.error('释放指针锁失败:', e)
    }

    setGameStartedState(false)
    setShowStartOverlay(true)

    if (setGameStarted) setTimeout(() => setGameStarted(false), 100)
  }, [setGameStarted])

  if (!browserSupport.supported && !browserSupport.useFallback) {
    return (
      <div className="flex h-full items-center justify-center bg-black/10 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6">
          <h2 className="mb-4 text-xl font-bold">浏览器兼容性问题</h2>
          <p className="mb-4">{browserSupport.message}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: '100%',
          cursor: gameStarted ? 'none' : 'pointer',
          position: 'relative',
        }}
      >
        <Canvas
          shadows
          ref={canvasRef}
          camera={{ fov: 65, position: [0, 1.6, 0], rotation: [0, 0, 0] }}
          onCreated={({ gl, camera }) => {
            gl.setClearColor('#020617')
            camera.rotation.set(0, 0, 0)
          }}
          style={{ touchAction: 'none' }}
          className="outline-none"
        >
          <GameScene
            difficulty={difficulty}
            onScore={handleScore}
            gameStarted={gameStarted && !gameOver}
            setGameStarted={setGameStartedState}
            useFallbackControls={browserSupport.useFallback}
            onError={setPointerLockError}
          />
        </Canvas>

        {gameStarted && !gameOver && <Crosshair />}
      </div>

      {gameStarted && (
        <Button
          className="fixed top-16 left-4 z-50 rounded-lg border border-white/20 bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-black/90"
          onClick={handleBackToSettings}
        >
          返回设置
        </Button>
      )}

      <GameUI score={score} timeLeft={timeLeft} gameOver={gameOver} onRestart={handleRestart} />

      {showStartOverlay && !gameOver && !pointerLockError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 text-center">
            <h2 className="mb-2 text-xl font-bold">准备就绪</h2>
            <p className="mb-4">点击按钮开始游戏</p>
            {browserSupport.useFallback ? (
              <p className="mb-2 text-sm text-red-500">
                您的浏览器不完全支持此游戏的控制方式，正在使用有限功能模式运行。
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                <strong>注意:</strong> 游戏将请求锁定您的鼠标指针。按ESC键可随时退出。
              </p>
            )}
            <Button className="mt-4 w-full" onClick={startGame}>
              开始游戏
            </Button>
          </div>
        </div>
      )}

      {pointerLockError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-2 text-xl font-bold text-red-600">指针锁定错误</h2>
            <p className="mb-4">{pointerLockError}</p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleRetry}>
                重试
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setPointerLockError(null)
                  setBrowserSupport(prev => ({ ...prev, useFallback: true }))
                }}
              >
                继续（使用备用控制）
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
