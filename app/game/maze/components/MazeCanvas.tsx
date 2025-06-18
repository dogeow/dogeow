"use client"

import { useEffect, useRef, forwardRef } from 'react'
import { useMazeStore } from '../store'

const MazeCanvas = forwardRef<HTMLCanvasElement>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const initRef = useRef(false)
  const { 
    initThreeJS, 
    cleanup 
  } = useMazeStore()

  // 合并内部ref和外部ref
  const setRef = (element: HTMLCanvasElement | null) => {
    canvasRef.current = element
    if (typeof ref === 'function') {
      ref(element)
    } else if (ref) {
      ref.current = element
    }
  }

  useEffect(() => {
    if (!canvasRef.current || initRef.current) return

    // 标记为已初始化
    initRef.current = true
    
    // 初始化Three.js
    initThreeJS(canvasRef.current)

    // 清理函数
    return () => {
      cleanup()
      initRef.current = false
    }
  }, [initThreeJS, cleanup]) // 添加依赖

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const state = useMazeStore.getState()
      if (canvasRef.current && state.camera && state.renderer) {
        const { clientWidth, clientHeight } = canvasRef.current
        state.camera.aspect = clientWidth / clientHeight
        state.camera.updateProjectionMatrix()
        state.renderer.setSize(clientWidth, clientHeight)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden">
      <canvas
        ref={setRef}
        className="w-full h-full cursor-pointer"
        style={{ display: 'block' }}
      />
    </div>
  )
})

MazeCanvas.displayName = 'MazeCanvas'

export default MazeCanvas 