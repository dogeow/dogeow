'use client'

import { useEffect } from 'react'

export function PWARegister() {
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

          // 监听 Service Worker 更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 有新版本可用，提示用户刷新
                  console.log('有新版本可用，请刷新页面')
                }
              })
            }
          })
        })
        .catch(error => {
          console.error('Service Worker 注册失败:', error)
        })

      // 监听 Service Worker 消息
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('收到 Service Worker 消息:', event.data)
      })

      // 监听 Service Worker 错误
      navigator.serviceWorker.addEventListener('error', error => {
        console.error('Service Worker 错误:', error)
      })
    } else {
      console.log('浏览器不支持 Service Worker')
    }
  }, [])

  return null // 这个组件不渲染任何内容
}
