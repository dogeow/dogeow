import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import type { MusicPlayerProps } from '../types'

// 歌曲信息显示组件
export const TrackInfo = memo(
  ({
    isPlaying,
    getCurrentTrackName,
    currentLyric,
  }: Pick<MusicPlayerProps, 'isPlaying' | 'getCurrentTrackName' | 'currentLyric'>) => {
    const trackName = getCurrentTrackName() ?? '没有选择音乐'
    const isEmptyState = trackName === '没有选择音乐' || trackName === '播放列表为空'
    const normalizedTrackName = trackName?.trim()
    const normalizedLyric = currentLyric?.trim()
    const displayLyric =
      normalizedTrackName && normalizedLyric && normalizedTrackName !== normalizedLyric
        ? normalizedLyric
        : ''
    const canToggleText = isPlaying && !isEmptyState && Boolean(displayLyric)
    const [viewState, setViewState] = useState({ trackName: '', showLyric: false })
    const [textWidth, setTextWidth] = useState(0)
    const [containerWidth, setContainerWidth] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const [scrollKey, setScrollKey] = useState('')
    const textRef = useRef<HTMLSpanElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)
    const didDrag = useRef(false)
    const startX = useRef(0)
    const startScrollLeft = useRef(0)
    const showLyric = viewState.trackName === trackName && viewState.showLyric && canToggleText

    const visibleText = isEmptyState
      ? '暂无音乐'
      : showLyric && canToggleText
        ? displayLyric
        : trackName
    const primaryText = visibleText
    const activeScrollLeft = scrollKey === primaryText ? scrollLeft : 0

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
    }, [primaryText])

    const shouldShowDrag = textWidth > containerWidth

    // 拖拽事件
    const handleDragStart = useCallback(
      (clientX: number) => {
        didDrag.current = false
        if (!shouldShowDrag) return
        isDragging.current = true
        startX.current = clientX
        startScrollLeft.current = activeScrollLeft
        document.body.style.cursor = 'grabbing'
        document.body.style.userSelect = 'none'
      },
      [activeScrollLeft, shouldShowDrag]
    )

    const handleDragMove = useCallback(
      (clientX: number) => {
        if (!isDragging.current) return
        const deltaX = clientX - startX.current
        if (Math.abs(deltaX) > 4) {
          didDrag.current = true
        }
        const newScrollLeft = startScrollLeft.current - deltaX
        const maxScroll = textWidth - containerWidth
        setScrollLeft(Math.max(0, Math.min(maxScroll, newScrollLeft)))
        setScrollKey(primaryText)
      },
      [containerWidth, primaryText, textWidth]
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

    const handleToggleText = useCallback(() => {
      if (didDrag.current) {
        didDrag.current = false
        return
      }
      if (!canToggleText) return
      setScrollLeft(0)
      setScrollKey('')
      setViewState({ trackName, showLyric: !showLyric })
    }, [canToggleText, showLyric, trackName])

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        handleToggleText()
      },
      [handleToggleText]
    )

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
      <div className="mx-1 flex h-full w-full min-w-0 items-center overflow-hidden">
        <div
          className="relative w-full overflow-hidden"
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onClick={handleToggleText}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={handleKeyDown}
          role={canToggleText ? 'button' : undefined}
          tabIndex={canToggleText ? 0 : -1}
          title={canToggleText ? (showLyric ? '点击切换为歌曲名' : '点击切换为歌词') : undefined}
        >
          <div className="overflow-hidden whitespace-nowrap">
            <span
              ref={textRef}
              className="inline-block select-none text-sm font-medium leading-5"
              style={{
                transform: `translateX(-${activeScrollLeft}px)`,
                cursor: shouldShowDrag ? 'grab' : canToggleText ? 'pointer' : 'default',
              }}
            >
              {primaryText}
            </span>
          </div>
        </div>
      </div>
    )
  }
)

TrackInfo.displayName = 'TrackInfo'
