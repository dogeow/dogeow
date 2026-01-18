import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import type { MusicPlayerProps } from '../types'

// 歌曲信息显示组件
export const TrackInfo = memo(
  ({
    isPlaying,
    getCurrentTrackName,
    currentTime,
    duration,
    formatTime,
  }: Pick<
    MusicPlayerProps,
    'isPlaying' | 'getCurrentTrackName' | 'currentTime' | 'duration' | 'formatTime'
  >) => {
    const [textWidth, setTextWidth] = useState(0)
    const [containerWidth, setContainerWidth] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const textRef = useRef<HTMLSpanElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const startX = useRef(0)
    const startScrollLeft = useRef(0)

    // 计算文本和容器宽度
    useEffect(() => {
      if (textRef.current && containerRef.current) {
        const text = textRef.current
        const container = containerRef.current
        text.style.position = 'absolute'
        text.style.visibility = 'hidden'
        text.style.whiteSpace = 'nowrap'
        const textW = text.scrollWidth
        const containerW = container.clientWidth
        text.style.position = ''
        text.style.visibility = ''
        setTextWidth(textW)
        setContainerWidth(containerW)
      }
    }, [getCurrentTrackName, currentTime, duration])

    const shouldShowDrag = textWidth > containerWidth

    // 拖拽事件
    const handleDragStart = useCallback(
      (clientX: number) => {
        if (!shouldShowDrag) return
        isDragging.current = true
        startX.current = clientX
        startScrollLeft.current = scrollLeft
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
      },
      [shouldShowDrag, scrollLeft]
    )

    const handleDragMove = useCallback(
      (clientX: number) => {
        if (!isDragging.current) return
        const deltaX = clientX - startX.current
        const newScrollLeft = startScrollLeft.current - deltaX
        const maxScroll = textWidth - containerWidth
        setScrollLeft(Math.max(0, Math.min(maxScroll, newScrollLeft)))
      },
      [containerWidth, textWidth]
    )

    const handleDragEnd = useCallback(() => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }, [])

    // 鼠标事件
    const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
    const handleMouseMove = useCallback(
      (e: MouseEvent) => handleDragMove(e.clientX),
      [handleDragMove]
    )
    const handleMouseUp = handleDragEnd

    // 触摸事件
    const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
    const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX)
    const handleTouchEnd = handleDragEnd

    // 事件监听
    useEffect(() => {
      if (!shouldShowDrag) return
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }, [shouldShowDrag, handleMouseMove, handleMouseUp])

    return (
      <div className="mx-1 flex-1 overflow-hidden">
        <div
          className="relative overflow-hidden"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden whitespace-nowrap">
            <span
              ref={textRef}
              className="inline-block text-sm font-medium select-none"
              style={{
                transform: isPlaying ? `translateX(-${scrollLeft}px)` : 'translateX(0)',
                cursor: isPlaying && shouldShowDrag ? 'grab' : 'default',
              }}
            >
              {getCurrentTrackName()} - {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    )
  }
)

TrackInfo.displayName = 'TrackInfo'
