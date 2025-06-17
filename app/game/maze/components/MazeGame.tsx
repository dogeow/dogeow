"use client"

import { useEffect } from 'react'
import { useMazeStore } from '../store'
import { MazeCanvas } from './MazeCanvas'
import { GameControls } from './GameControls'
import { GameStats } from './GameStats'
import { GyroPermissionDialog } from './GyroPermissionDialog'

export function MazeGame() {
  const {
    isPlaying,
    isPaused,
    gameWon,
    moveBall,
    updateTilt,
    gyroSupported,
    gyroPermission,
    requestGyroPermission
  } = useMazeStore()

  // 不再需要游戏循环，因为改为直接移动模式
  // const animationFrameRef = useRef<number | undefined>(undefined)
  // const lastTimeRef = useRef<number>(0)

  // 键盘控制
  useEffect(() => {
    console.log('设置键盘监听器，当前状态:', { isPlaying, isPaused })
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // 总是输出按键信息进行调试
      console.log('🎮 按键事件:', {
        key: event.key,
        code: event.code,
        target: event.target,
        游戏状态: { isPlaying, isPaused }
      })
      
      if (!isPlaying || isPaused) {
        console.log('❌ 游戏未开始或已暂停，忽略按键')
        return
      }

      const force = 2 // 增加移动距离，让移动更明显
      const key = event.key.toLowerCase()
      const code = event.code.toLowerCase()
      
      console.log('🔍 处理按键:', { key, code })
      
      // 使用 if-else 替代 switch 以支持多种按键检测方式
      if (key === 'w' || code === 'keyw' || key === 'arrowup') {
        event.preventDefault()
        console.log('⬆️ 向上移动')
        moveBall(0, -force)
      } else if (key === 's' || code === 'keys' || key === 'arrowdown') {
        event.preventDefault()
        console.log('⬇️ 向下移动')
        moveBall(0, force)
      } else if (key === 'a' || code === 'keya' || key === 'arrowleft') {
        event.preventDefault()
        console.log('⬅️ 向左移动')
        moveBall(-force, 0)
      } else if (key === 'd' || code === 'keyd' || key === 'arrowright') {
        event.preventDefault()
        console.log('➡️ 向右移动')
        moveBall(force, 0)
      } else if (key === ' ' || code === 'space') {
        event.preventDefault()
        console.log('⏸️ 空格键 - 暂停/继续')
        // 空格键暂停/继续
        if (isPaused) {
          useMazeStore.getState().resumeGame()
        } else {
          useMazeStore.getState().pauseGame()
        }
      } else {
        console.log('🚫 未识别的按键:', { key, code })
      }
    }

    // 测试事件监听器是否正常工作
    const testHandler = () => {
      console.log('✅ 键盘事件监听器已设置')
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keydown', testHandler, { once: true })
    
    return () => {
      console.log('🧹 清理键盘监听器')
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPlaying, isPaused, moveBall])

  // 陀螺仪控制
  useEffect(() => {
    if (!gyroSupported || !gyroPermission) return

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (!isPlaying || isPaused) return

      // 获取设备倾斜角度
      const beta = event.beta || 0  // 前后倾斜 (-180 到 180)
      const gamma = event.gamma || 0 // 左右倾斜 (-90 到 90)

      // 将角度转换为标准化的力值
      const tiltX = Math.max(-1, Math.min(1, gamma / 30)) // 限制在-1到1之间
      const tiltY = Math.max(-1, Math.min(1, beta / 30))

      updateTilt(tiltX, tiltY)
    }

    window.addEventListener('deviceorientation', handleDeviceOrientation)
    return () => window.removeEventListener('deviceorientation', handleDeviceOrientation)
  }, [gyroSupported, gyroPermission, isPlaying, isPaused, updateTilt])

  // 检测陀螺仪支持
  useEffect(() => {
    const detectGyroSupport = async () => {
      console.log('🔍 检测陀螺仪支持...')
      
      if (typeof window === 'undefined') {
        console.log('❌ 非浏览器环境')
        return
      }

      // 检查基本的 DeviceOrientationEvent 支持
      if (!('DeviceOrientationEvent' in window)) {
        console.log('❌ 设备不支持 DeviceOrientationEvent')
        useMazeStore.setState({ gyroSupported: false })
        return
      }

      console.log('✅ DeviceOrientationEvent 存在')

      // 检查是否是iOS设备并且需要权限
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
      
      console.log('📱 设备检测:', { 
        isIOS, 
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        maxTouchPoints: navigator.maxTouchPoints
      })

      if (isIOS && 'requestPermission' in DeviceOrientationEvent) {
        console.log('🍎 iOS设备，需要权限请求')
        useMazeStore.setState({ 
          gyroSupported: true, 
          gyroPermission: false 
        })
      } else {
        console.log('✅ 非iOS设备或旧版本，直接支持')
        useMazeStore.setState({ 
          gyroSupported: true, 
          gyroPermission: true 
        })
      }

      // 初始化设置
      useMazeStore.getState().setSensitivity(0.3)
    }

    detectGyroSupport()
  }, [])

  return (
    <div className="flex flex-col items-center space-y-6">
      <GameStats />
      
      <div className="relative">
        <MazeCanvas />
        
        {/* 游戏暂停遮罩 */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
            <div className="text-white text-2xl font-bold">游戏暂停</div>
          </div>
        )}
        
        {/* 胜利遮罩 */}
        {gameWon && (
          <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center rounded-lg">
            <div className="text-center text-white">
              <div className="text-3xl font-bold mb-2">🎉 恭喜通关！</div>
              <div className="text-lg">准备挑战下一关吗？</div>
            </div>
          </div>
        )}
      </div>

      <GameControls />
      
      {/* 陀螺仪权限对话框 */}
      {gyroSupported && !gyroPermission && (
        <GyroPermissionDialog 
          onRequestPermission={requestGyroPermission}
        />
      )}

      {/* 调试测试按钮 */}
      {isPlaying && (
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm text-slate-500">调试测试（点击测试移动）</div>
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <button 
              onClick={() => {
                console.log('🧪 测试向上移动')
                moveBall(0, -1)
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              ↑
            </button>
            <div></div>
            
            <button 
              onClick={() => {
                console.log('🧪 测试向左移动')
                moveBall(-1, 0)
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              ←
            </button>
            <div></div>
            <button 
              onClick={() => {
                console.log('🧪 测试向右移动')
                moveBall(1, 0)
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              →
            </button>
            
            <div></div>
            <button 
              onClick={() => {
                console.log('🧪 测试向下移动')
                moveBall(0, 1)
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              ↓
            </button>
            <div></div>
          </div>
        </div>
      )}

      {/* 控制说明 */}
      <div className="text-center text-sm text-slate-400 max-w-md">
        <p className="mb-2">
          <strong>PC端：</strong> 使用 WASD 或方向键控制小球移动
        </p>
        <p className="mb-2">
          <strong>手机端：</strong> 倾斜设备控制小球滚动方向
        </p>
        <p>
          <strong>目标：</strong> 将蓝色小球滚动到右下角的绿色终点
        </p>
        <p className="text-xs mt-2">
          如果键盘无响应，请尝试点击页面任意位置获得焦点，然后再按键
        </p>
      </div>
    </div>
  )
} 