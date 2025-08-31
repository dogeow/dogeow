'use client'

import { useEffect, useState } from 'react'

export function PWARegister() {
  const [hasUpdate, setHasUpdate] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // 检查浏览器是否支持 Service Worker
    if ('serviceWorker' in navigator) {
      // 注册 Service Worker
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then(registration => {
          console.log('Service Worker 注册成功:', registration)

          // 检查是否有等待中的更新
          if (registration.waiting) {
            console.log('检测到等待中的更新')
            setHasUpdate(true)
          }

          // 监听 Service Worker 更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                  // 只有当新worker等待激活且当前有controller时才提示更新
                  if (registration.waiting && navigator.serviceWorker.controller) {
                    console.log('检测到新版本，等待激活')
                    setHasUpdate(true)
                  }
                }
              })
            }
          })

          // 监听controllerchange事件
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker 控制器已更改')
            setHasUpdate(false)
          })
        })
        .catch(error => {
          console.error('Service Worker 注册失败:', error)
        })

      // 监听 Service Worker 消息
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('收到 Service Worker 消息:', event.data)

        // 处理Service Worker激活消息
        if (event.data && event.data.type === 'SW_ACTIVATED') {
          console.log('Service Worker 已激活，清除更新状态')
          setHasUpdate(false)
          setIsChecking(false)
        }
      })

      // 监听 Service Worker 错误
      navigator.serviceWorker.addEventListener('error', error => {
        console.error('Service Worker 错误:', error)
      })
    } else {
      console.log('浏览器不支持 Service Worker')
    }
  }, [])

  // 处理更新
  const handleUpdate = async () => {
    if (isChecking) return // 防止重复点击

    try {
      setIsChecking(true)

      if (navigator.serviceWorker.controller) {
        console.log('发送跳过等待请求...')

        // 发送消息给Service Worker，请求跳过等待
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })

        // 等待一小段时间让Service Worker处理
        await new Promise(resolve => setTimeout(resolve, 100))

        // 检查Service Worker状态
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration && registration.waiting) {
          console.log('Service Worker 仍在等待，尝试强制激活')
          // 如果还在等待，尝试强制激活
          await registration.update()
        }

        // 清除更新状态
        setHasUpdate(false)

        // 延迟刷新页面
        setTimeout(() => {
          console.log('刷新页面以应用更新')
          window.location.reload()
        }, 200)
      } else {
        console.log('没有活跃的Service Worker控制器')
        setIsChecking(false)
      }
    } catch (error) {
      console.error('更新处理失败:', error)
      // 即使失败也要清除更新状态
      setHasUpdate(false)
      setIsChecking(false)
    }
  }

  return (
    <>
      {hasUpdate && (
        <div className="fixed right-4 bottom-4 z-50 rounded-lg bg-blue-500 px-4 py-2 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <span>有新版本可用</span>
            <button
              onClick={handleUpdate}
              disabled={isChecking}
              className={`rounded px-2 py-1 text-sm transition-colors ${
                isChecking
                  ? 'cursor-not-allowed bg-gray-300 text-gray-600'
                  : 'bg-white text-blue-500 hover:bg-gray-100'
              }`}
            >
              {isChecking ? '更新中...' : '立即更新'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
