import { useState, useRef, useEffect, useCallback } from 'react'

interface UseMessageInteractionsParams {
  onOpenMenu?: () => void
  onCloseMenu?: () => void
}

/**
 * 抽离消息交互中的长按/菜单控制逻辑
 */
export function useMessageInteractions({
  onOpenMenu,
  onCloseMenu,
}: UseMessageInteractionsParams = {}) {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const openMenu = useCallback(() => {
    setShowMobileMenu(true)
    onOpenMenu?.()
  }, [onOpenMenu])

  const closeMenu = useCallback(() => {
    setShowMobileMenu(false)
    onCloseMenu?.()
  }, [onCloseMenu])

  // Long press handlers for mobile
  const handleTouchStart = useCallback(() => {
    if (window.innerWidth > 768) return // Only on mobile

    longPressTimer.current = setTimeout(() => {
      openMenu()
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500) // 500ms long press
  }, [openMenu])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    clearLongPressTimer()
  }, [clearLongPressTimer])

  const handleTouchMove = useCallback(() => {
    clearLongPressTimer()
  }, [clearLongPressTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer()
    }
  }, [clearLongPressTimer])

  return {
    showMobileMenu,
    openMenu,
    closeMenu,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
  }
}
