import { useState, useEffect } from 'react'

// 简化的键盘检测
export function useKeyboardStatus() {
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 只在移动设备上检测键盘
    const isMobile =
      window.innerWidth <= 768 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (!isMobile) {
      // 使用 requestAnimationFrame 避免同步 setState
      requestAnimationFrame(() => {
        setKeyboardOpen(false)
      })
      return
    }

    const handleResize = () => {
      const visualViewport = window.visualViewport
      if (visualViewport) {
        const heightDiff = window.innerHeight - visualViewport.height
        setKeyboardOpen(heightDiff > 150)
      } else {
        // 备用检测方法
        setKeyboardOpen(window.innerHeight < 500)
      }
    }

    // 使用 requestAnimationFrame 延迟初始调用
    requestAnimationFrame(handleResize)

    const visualViewport = window.visualViewport
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize)
      return () => {
        visualViewport.removeEventListener('resize', handleResize)
      }
    } else {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  return keyboardOpen
}
