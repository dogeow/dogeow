import { useCallback, useEffect, useRef } from 'react'

interface UseMessageScrollParams {
  roomId: number
  messageCount: number
  hasSearchQuery: boolean
  getScrollContainer: () => HTMLDivElement | null
}

/**
 * 处理消息列表滚动与自动滚动逻辑
 */
export function useMessageScroll({
  roomId,
  messageCount,
  hasSearchQuery,
  getScrollContainer,
}: UseMessageScrollParams) {
  const previousMessageCountRef = useRef(0)
  const isUserScrollingRef = useRef(false)
  const lastScrollTopRef = useRef(0)

  // 房间切换时重置滚动与计数状态
  useEffect(() => {
    previousMessageCountRef.current = 0
    isUserScrollingRef.current = false
    lastScrollTopRef.current = 0
  }, [roomId])

  const handleScroll = useCallback((scrollContainer: HTMLDivElement) => {
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50

    if (scrollTop < lastScrollTopRef.current) {
      isUserScrollingRef.current = true
    } else if (isNearBottom) {
      isUserScrollingRef.current = false
    }
    lastScrollTopRef.current = scrollTop
  }, [])

  useEffect(() => {
    const scrollContainer = getScrollContainer()
    if (!scrollContainer) return

    const onScroll = () => handleScroll(scrollContainer)
    scrollContainer.addEventListener('scroll', onScroll, { passive: true })

    const currentCount = messageCount
    const prevCount = previousMessageCountRef.current

    if (currentCount > prevCount && !isUserScrollingRef.current && !hasSearchQuery) {
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
          if (process.env.NODE_ENV === 'development') {
            console.log('🔥 MessageList: auto scroll to bottom', scrollContainer.scrollHeight)
          }
        }
      })
    }

    previousMessageCountRef.current = currentCount
    return () => scrollContainer.removeEventListener('scroll', onScroll)
  }, [getScrollContainer, handleScroll, hasSearchQuery, messageCount])
}
