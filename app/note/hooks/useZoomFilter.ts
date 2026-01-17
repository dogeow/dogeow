import { useEffect } from 'react'
import type { ForceGraphInstance } from '../types/graph'

export function useZoomFilter(fgRef: React.RefObject<ForceGraphInstance | null>) {
  // 禁用点击/双击触发的默认 zoom（仅保留滚轮缩放）
  useEffect(() => {
    const graph = fgRef.current
    if (!graph) return

    let attempts = 0
    const MAX_ATTEMPTS = 20
    let cleanup: (() => void) | null = null

    const applyZoomFilter = () => {
      const graph = fgRef.current
      const zoom = graph?.d3Zoom?.()

      if (!zoom || typeof zoom.filter !== 'function') {
        return false
      }

      const originalFilter = zoom.filter()
      let originalFilterFn: ((event: Event) => boolean) | null = null
      if (originalFilter && typeof originalFilter === 'function') {
        originalFilterFn = originalFilter as (event: Event) => boolean
      }
      const safeFilter = (event: Event | null) => {
        const eventType = event?.type

        // 程序化缩放（无事件对象）直接通过
        if (!eventType) {
          return true
        }

        // 禁止 click / dblclick 触发 D3 的 scaleBy，保留滚轮/触摸缩放
        if (eventType === 'click' || eventType === 'dblclick') {
          return false
        }

        if (!originalFilterFn) {
          return true
        }

        try {
          return originalFilterFn(event)
        } catch (error) {
          console.warn('D3 zoom filter 执行失败，已回退默认允许:', error)
          return true
        }
      }

      zoom.filter(safeFilter)
      cleanup = () => {
        if (originalFilterFn) {
          zoom.filter(originalFilterFn)
        } else {
          zoom.filter(undefined)
        }
      }
      return true
    }

    const intervalId = window.setInterval(() => {
      attempts += 1
      if (applyZoomFilter() || attempts >= MAX_ATTEMPTS) {
        window.clearInterval(intervalId)
      }
    }, 300)

    return () => {
      window.clearInterval(intervalId)
      if (cleanup) cleanup()
    }
  }, [fgRef])
}
