'use client'

import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { BackButton } from '@/components/ui/back-button'
import { MusicPlayerProps, PlayerControlButtonProps } from './types'
import { PlaylistDialog } from './PlaylistDialog'

// 图标尺寸常量
const ICON_SIZE = 'h-4 w-4'
const PLAY_BUTTON_SIZE = 'h-8 w-8'

// 控制按钮组件
const PlayerControlButton = memo(
  ({ onClick, disabled, title, icon, className = 'h-7 w-7' }: PlayerControlButtonProps) => (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={onClick}
        disabled={disabled}
        title={title}
      >
        {icon}
        <span className="sr-only">{title}</span>
      </Button>
    </motion.div>
  )
)
PlayerControlButton.displayName = 'PlayerControlButton'

// 歌曲信息显示组件
const TrackInfo = memo(
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
          {isPlaying ? (
            <div className="overflow-hidden whitespace-nowrap">
              <span
                ref={textRef}
                className="inline-block text-sm font-medium select-none"
                style={{
                  transform: `translateX(-${scrollLeft}px)`,
                  cursor: shouldShowDrag ? 'grab' : 'default',
                }}
              >
                {getCurrentTrackName()} - {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          ) : (
            <span className="block truncate text-sm font-medium">
              {getCurrentTrackName()} - {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          )}
        </div>
      </div>
    )
  }
)
TrackInfo.displayName = 'TrackInfo'

// 进度条组件
const ProgressBar = memo(
  ({
    currentTime,
    duration,
    handleProgressChange,
  }: Pick<MusicPlayerProps, 'currentTime' | 'duration' | 'handleProgressChange'>) => {
    const progressPercentage = ((currentTime / (duration || 1)) * 100).toFixed(2)
    return (
      <>
        <div className="bg-primary/30 absolute bottom-0 left-0 h-1 w-full">
          <div
            className="bg-primary h-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleProgressChange}
          className="absolute bottom-0 left-0 h-1 w-full cursor-pointer opacity-0"
        />
      </>
    )
  }
)
ProgressBar.displayName = 'ProgressBar'

// 主播放器组件
export const MusicPlayer = memo(
  ({
    isPlaying,
    audioError,
    currentTime,
    duration,
    isMuted,
    availableTracks,
    currentTrack,
    playMode,
    toggleMute,
    switchToPrevTrack,
    switchToNextTrack,
    togglePlay,
    handleProgressChange,
    getCurrentTrackName,
    formatTime,
    toggleDisplayMode,
    onTrackSelect,
    onTogglePlayMode,
  }: MusicPlayerProps) => {
    const [playlistOpen, setPlaylistOpen] = useState(false)

    return (
      <>
        <div className="flex w-full items-center justify-between">
          <div className="flex shrink-0 items-center">
            <BackButton onClick={() => toggleDisplayMode('apps')} title="返回启动台" />
          </div>

          <TrackInfo
            isPlaying={isPlaying}
            getCurrentTrackName={getCurrentTrackName}
            currentTime={currentTime}
            duration={duration}
            formatTime={formatTime}
          />

          {audioError && (
            <div className="truncate rounded bg-amber-50 px-2 py-1 text-xs text-amber-600">
              {audioError.includes('播放列表为空') ? '🎵 暂无音乐' : audioError}
            </div>
          )}

          <div className="ml-2 flex shrink-0 items-center gap-1">
            <PlayerControlButton
              onClick={toggleMute}
              title={isMuted ? '取消静音' : '静音'}
              icon={isMuted ? <VolumeX className={ICON_SIZE} /> : <Volume2 className={ICON_SIZE} />}
            />
            <PlayerControlButton
              onClick={switchToPrevTrack}
              title="上一首"
              icon={<SkipBack className={ICON_SIZE} />}
            />
            <PlayerControlButton
              onClick={togglePlay}
              title={isPlaying ? '暂停' : '播放'}
              icon={isPlaying ? <Pause className={ICON_SIZE} /> : <Play className={ICON_SIZE} />}
              className={PLAY_BUTTON_SIZE}
            />
            <PlayerControlButton
              onClick={switchToNextTrack}
              title="下一首"
              icon={<SkipForward className={ICON_SIZE} />}
            />
            <PlayerControlButton
              onClick={() => setPlaylistOpen(true)}
              title="播放列表"
              icon={<List className={ICON_SIZE} />}
            />
          </div>
        </div>

        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          handleProgressChange={handleProgressChange}
        />

        {/* 播放列表弹窗 */}
        <PlaylistDialog
          open={playlistOpen}
          onOpenChange={setPlaylistOpen}
          availableTracks={availableTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onTrackSelect={onTrackSelect}
          onTogglePlay={togglePlay}
          onTogglePlayMode={onTogglePlayMode}
          playMode={playMode}
        />
      </>
    )
  }
)
MusicPlayer.displayName = 'MusicPlayer'
