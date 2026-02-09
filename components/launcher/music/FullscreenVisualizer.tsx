'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX, List } from 'lucide-react'
import { AudioVisualizer, type VisualizerType } from './AudioVisualizer'
import { cn } from '@/lib/helpers'
import { PlaylistDialog } from '../PlaylistDialog'
import type { MusicTrack, PlayMode } from '@/stores/musicStore'

interface FullscreenVisualizerProps {
  analyserNode: AnalyserNode | null
  isPlaying: boolean
  isMuted: boolean
  trackName: string
  onClose: () => void
  onTogglePlay: () => void
  onToggleMute: () => void
  onPrevTrack: () => void
  onNextTrack: () => void
  availableTracks?: MusicTrack[]
  currentTrack?: string
  onTrackSelect?: (trackPath: string) => void
  playMode?: PlayMode
  onTogglePlayMode?: () => void
  currentTime?: number
  duration?: number
  handleProgressChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  formatTime?: (time: number) => string
}

const VISUALIZER_TYPES: { type: VisualizerType; label: string }[] = [
  { type: 'spectrum', label: '频谱' },
  { type: 'bars6', label: '宽柱' },
  { type: 'particles', label: '星空' },
  { type: 'silk', label: '雨' },
]

export function FullscreenVisualizer({
  analyserNode,
  isPlaying,
  isMuted,
  trackName,
  onClose,
  onTogglePlay,
  onToggleMute,
  onPrevTrack,
  onNextTrack,
  availableTracks = [],
  currentTrack = '',
  onTrackSelect,
  playMode = 'list',
  onTogglePlayMode,
  currentTime = 0,
  duration = 0,
  handleProgressChange,
  formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  },
}: FullscreenVisualizerProps) {
  const [vizType, setVizType] = useState<VisualizerType>('spectrum')
  const [showControls, setShowControls] = useState(true)
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [playlistOpen, setPlaylistOpen] = useState(false)

  // 自动隐藏控件
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimer) clearTimeout(hideTimer)
    const timer = setTimeout(() => setShowControls(false), 3000)
    setHideTimer(timer)
  }, [hideTimer])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideTimer) clearTimeout(hideTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ESC 退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') {
        e.preventDefault()
        onTogglePlay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onTogglePlay])

  return createPortal(
    <div
      className="bg-background fixed inset-0 z-[100] flex flex-col"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* 可视化背景 - 全屏 */}
      <div className="absolute inset-0">
        {analyserNode && (
          <AudioVisualizer
            analyserNode={analyserNode}
            isPlaying={isPlaying}
            type={vizType}
            barCount={64}
            showGradient={true}
            className="h-full w-full"
          />
        )}
      </div>

      {/* 控制层 */}
      <div
        className={cn(
          'relative z-10 flex h-full flex-col justify-between transition-opacity duration-500',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* 顶部：关闭 + 曲名 */}
        <div className="flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent p-4 pb-12">
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="关闭全屏"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          <h2 className="max-w-[60%] truncate text-lg font-medium text-white drop-shadow-lg">
            {trackName}
          </h2>
          <div className="w-10" />
        </div>

        {/* 底部：可视化类型切换 + 播放控件 */}
        <div className="space-y-6 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12 pb-20">
          {/* 可视化类型切换 */}
          <div className="flex justify-center gap-2">
            {VISUALIZER_TYPES.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => setVizType(type)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                  vizType === type
                    ? 'bg-white/25 text-white backdrop-blur-sm'
                    : 'text-white/60 hover:text-white/90'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 播放控件 */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={onToggleMute}
              className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
              aria-label={isMuted ? '取消静音' : '静音'}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <button
              onClick={onPrevTrack}
              className="flex h-12 w-12 items-center justify-center text-white/80 transition-colors hover:text-white"
              aria-label="上一首"
            >
              <SkipBack className="h-6 w-6" />
            </button>
            <button
              onClick={onTogglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
            </button>
            <button
              onClick={onNextTrack}
              className="flex h-12 w-12 items-center justify-center text-white/80 transition-colors hover:text-white"
              aria-label="下一首"
            >
              <SkipForward className="h-6 w-6" />
            </button>
            <button
              onClick={() => setPlaylistOpen(true)}
              className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
              aria-label="播放列表"
            >
              <List className="h-5 w-5" />
            </button>
          </div>

          {/* 进度条和时间显示 */}
          {handleProgressChange && duration > 0 && (
            <div className="flex items-center justify-center gap-2 px-2 sm:px-4 md:px-6 lg:px-8">
              <span className="min-w-[2.5rem] text-right text-sm font-medium text-white/80 tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div className="group relative h-1.5 max-w-6xl flex-1 cursor-pointer">
                {/* 进度条背景 */}
                <div className="absolute inset-0 rounded-full bg-white/20" />
                {/* 已播放进度 */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/80 transition-all duration-100"
                  style={{ width: `${((currentTime / duration) * 100).toFixed(2)}%` }}
                />
                {/* 可拖动的滑块 */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleProgressChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="播放进度"
                />
                {/* 悬停时显示的滑块圆点 */}
                <div
                  className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                  style={{ left: `calc(${((currentTime / duration) * 100).toFixed(2)}% - 8px)` }}
                />
              </div>
              <span className="min-w-[2.5rem] text-sm font-medium text-white/80 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 播放列表弹窗 */}
      {onTrackSelect && (
        <PlaylistDialog
          open={playlistOpen}
          onOpenChange={setPlaylistOpen}
          availableTracks={availableTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTrackSelect={onTrackSelect}
          onTogglePlay={onTogglePlay}
          onTogglePlayMode={onTogglePlayMode}
          onToggleMute={onToggleMute}
          onPrevTrack={onPrevTrack}
          onNextTrack={onNextTrack}
          playMode={playMode}
        />
      )}
    </div>,
    document.body
  )
}
