'use client'

import { useEffect, useRef, useState } from 'react'
import { useBowlingStore } from '../store'
import { BowlingCanvas } from './BowlingCanvas'
import { GameStats } from './GameStats'

export function BowlingGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const {
    gameStarted,
    gyroSupported,
    gyroPermission,
    startGame,
    detectGyroSupport,
    requestGyroPermission,
  } = useBowlingStore()

  const [isMounted, setIsMounted] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 客户端挂载检测
    setIsMounted(true)
  }, [])

  // 自动检测陀螺仪支持并启动游戏
  useEffect(() => {
    const init = async () => {
      await detectGyroSupport()
      if (!gameStarted) {
        startGame()
      }
    }
    init()
  }, [detectGyroSupport, gameStarted, startGame])

  // 检查是否需要显示权限对话框
  useEffect(() => {
    if (isMounted && gyroSupported && !gyroPermission) {
      // 检测是否为移动设备
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

      if (isMobile || isIOS) {
        console.log('📱 检测到移动设备，立即显示权限对话框')
        // 稍微延迟显示，让页面完全加载
        setTimeout(() => {
          setShowPermissionDialog(true)
        }, 500)
      }
    }
  }, [isMounted, gyroSupported, gyroPermission])

  // 处理权限请求
  const handleRequestPermission = async () => {
    console.log('🔐 用户点击申请权限')
    await requestGyroPermission()
    setShowPermissionDialog(false)
  }

  // 陀螺仪监听
  useEffect(() => {
    if (!isMounted || !gyroSupported || !gyroPermission) {
      console.log('⚠️ 陀螺仪不可用:', { isMounted, gyroSupported, gyroPermission })
      return
    }

    console.log('🎯 启动陀螺仪监听')

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event
      if (beta !== null && gamma !== null) {
        // beta: 前后倾斜 (-180 到 180)
        // gamma: 左右倾斜 (-90 到 90)
        const normalizedX = Math.max(-1, Math.min(1, gamma / 45)) // 左右倾斜
        const normalizedY = Math.max(-1, Math.min(1, beta / 45)) // 前后倾斜

        useBowlingStore.getState().updateTilt(normalizedX, normalizedY)
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)
    console.log('✅ 陀螺仪监听器已添加')

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation)
      console.log('🔄 陀螺仪监听器已移除')
    }
  }, [gyroSupported, gyroPermission, isMounted])

  return (
    <div ref={gameRef} className="flex flex-col items-center space-y-6">
      {/* 权限请求对话框 */}
      {showPermissionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border-2 border-blue-100 bg-white p-8 text-center shadow-2xl">
            <div className="mb-6 animate-bounce text-8xl">🎳</div>
            <h3 className="mb-3 text-xl font-bold text-gray-800">🔓 启用陀螺仪控制</h3>
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
              <p className="text-sm leading-relaxed text-gray-700">
                保龄球游戏使用<span className="font-semibold text-blue-600">陀螺仪</span>
                来控制投球方向
                <br />
                <span className="text-lg">📱➡️🎯</span>
                <br />
                <span className="font-medium">左右倾斜手机来瞄准球瓶！</span>
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleRequestPermission}
                className="transform rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-blue-700"
              >
                🚀 立即启用
              </button>
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="rounded-xl px-6 py-3 text-sm text-gray-500 transition-colors hover:text-gray-700"
              >
                稍后再说
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 游戏画布 */}
      <div className="relative">
        <BowlingCanvas />
      </div>

      {/* 游戏统计 */}
      <GameStats />
    </div>
  )
}
