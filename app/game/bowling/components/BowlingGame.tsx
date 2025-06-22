"use client"

import { useEffect, useRef, useState } from "react"
import { useBowlingStore } from "../store"
import { BowlingCanvas } from "./BowlingCanvas"
import { GameStats } from "./GameStats"

export function BowlingGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const {
    gameStarted,
    gyroSupported,
    gyroPermission,
    startGame,
    detectGyroSupport,
    requestGyroPermission
  } = useBowlingStore()

  const [isMounted, setIsMounted] = useState(false)
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)

  useEffect(() => {
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
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
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

  // 物理更新现在由 BowlingCanvas 组件中的 Three.js 处理

  return (
    <div ref={gameRef} className="flex flex-col items-center space-y-6">
      {/* 权限请求对话框 */}
      {showPermissionDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl border-2 border-blue-100">
            <div className="text-8xl mb-6 animate-bounce">🎳</div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">🔓 启用陀螺仪控制</h3>
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700 text-sm leading-relaxed">
                保龄球游戏使用<span className="font-semibold text-blue-600">陀螺仪</span>来控制投球方向
                <br />
                <span className="text-lg">📱➡️🎯</span>
                <br />
                <span className="font-medium">左右倾斜手机来瞄准球瓶！</span>
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleRequestPermission}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                🚀 立即启用
              </button>
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="text-gray-500 hover:text-gray-700 px-6 py-3 rounded-xl transition-colors text-sm"
              >
                稍后再说
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              💡 提示：需要允许访问设备方向
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