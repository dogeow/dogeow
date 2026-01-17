import { useEffect, RefObject } from 'react'

interface UseAutoScrollProps {
  trigger: string | null
  elementRef: RefObject<HTMLDivElement>
  delay?: number
}

export const useAutoScroll = ({ trigger, elementRef, delay = 300 }: UseAutoScrollProps) => {
  useEffect(() => {
    if (!trigger || !elementRef.current) return

    const timer = setTimeout(() => {
      const element = elementRef.current
      if (!element) return

      const scrollContainer = document.getElementById('main-container')
      const headerHeight = 50
      const padding = 20

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const elementTop = elementRect.top - containerRect.top + scrollContainer.scrollTop

        const isVisible =
          elementRect.top >= containerRect.top + headerHeight &&
          elementRect.bottom <= containerRect.bottom

        if (!isVisible) {
          scrollContainer.scrollTo({
            top: elementTop - headerHeight - padding,
            behavior: 'smooth',
          })
        }
      } else {
        const rect = element.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const isVisible = rect.top >= headerHeight && rect.bottom <= viewportHeight

        if (!isVisible) {
          const scrollY = window.scrollY + rect.top - headerHeight - padding
          window.scrollTo({
            top: Math.max(0, scrollY),
            behavior: 'smooth',
          })
        }
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [trigger, elementRef, delay])
}
