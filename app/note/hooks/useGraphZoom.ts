import { useRef, useCallback } from 'react'
import type { ForceGraphInstance } from '../types/graph'

export function useGraphZoom() {
  const lastZoomRef = useRef<number>(1)
  const lastTransformRef = useRef<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 })
  const lastCenterRef = useRef<{ x: number; y: number } | null>(null)
  const allowInternalZoomRef = useRef<boolean>(false)

  const restoreView = useCallback(
    (
      fgRef: React.RefObject<ForceGraphInstance | null>,
      options: { zoom?: boolean; center?: boolean } = { zoom: true, center: true }
    ) => {
      if (!fgRef.current) return
      allowInternalZoomRef.current = true
      const { zoom = true, center = true } = options

      if (zoom) {
        fgRef.current.zoom(lastZoomRef.current)
      }

      if (center && lastCenterRef.current) {
        const { x, y } = lastCenterRef.current
        fgRef.current.centerAt(x, y, 0)
      }

      allowInternalZoomRef.current = false
    },
    []
  )

  const handleZoom = useCallback(
    (
      fgRef: React.RefObject<ForceGraphInstance | null>,
      transform: { x: number; y: number; k: number }
    ) => {
      lastZoomRef.current = transform.k
      lastTransformRef.current = { x: transform.x, y: transform.y, k: transform.k }

      if (fgRef.current?.screen2GraphCoords) {
        const width = fgRef.current.width?.() ?? fgRef.current.clientWidth ?? window.innerWidth
        const height = fgRef.current.height?.() ?? fgRef.current.clientHeight ?? window.innerHeight
        const center = fgRef.current.screen2GraphCoords(width / 2, height / 2)
        if (center) {
          lastCenterRef.current = center
        }
      }
    },
    []
  )

  return {
    lastZoomRef,
    lastTransformRef,
    lastCenterRef,
    allowInternalZoomRef,
    restoreView,
    handleZoom,
  }
}
