'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { AudioVisualizer, type VisualizerType } from './visualizer'
import { cn } from '@/lib/helpers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MusicTrack, PlayMode } from '@/stores/musicStore'
import type { LyricLine } from './lyrics'
import type { LyricsState } from './useTrackLyrics'
import { LyricsDisplayPanel } from './LyricsDisplayPanel'
import { RepeatModeButton } from './RepeatModeButton'

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
  onTrackPlay?: (trackPath: string) => void
  onTrackSelect?: (trackPath: string) => void
  playMode?: PlayMode
  onSetPlayMode?: (mode: PlayMode) => void
  currentTime?: number
  duration?: number
  handleProgressChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  formatTime?: (time: number) => string
  lyrics?: LyricLine[]
  activeLyricIndex?: number
  lyricsStatus?: LyricsState
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
  onTrackPlay,
  onTrackSelect,
  playMode = 'all',
  onSetPlayMode,
  currentTime = 0,
  duration = 0,
  handleProgressChange,
  formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  },
  lyrics = [],
  activeLyricIndex = -1,
  lyricsStatus = 'idle',
}: FullscreenVisualizerProps) {
  const [vizType, setVizType] = useState<VisualizerType>('spectrum')
  const [showControls, setShowControls] = useState(true)
  const [activePanel, setActivePanel] = useState<'lyrics' | 'playlist'>('playlist')
  const [isPlayModeMenuOpen, setIsPlayModeMenuOpen] = useState(false)
  const [showRemainingTime, setShowRemainingTime] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canShowPlaylist = Boolean((onTrackPlay || onTrackSelect) && availableTracks.length > 0)
  const resolvedPanel = canShowPlaylist ? activePanel : 'lyrics'

  // 自动隐藏控件
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (resolvedPanel === 'playlist' || isPlayModeMenuOpen) {
      return
    }
    const timer = setTimeout(() => setShowControls(false), 3000)
    hideTimerRef.current = timer
  }, [isPlayModeMenuOpen, resolvedPanel])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [resetHideTimer])

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
    <Tabs
      value={resolvedPanel}
      onValueChange={value => setActivePanel(value as 'lyrics' | 'playlist')}
      className="bg-background fixed inset-0 z-[100] flex flex-col gap-0"
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

      <div className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center px-4 sm:px-8 lg:px-16">
        {canShowPlaylist && (
          <TabsContent value="playlist" className="m-0 w-full max-w-3xl">
            <div className="max-h-[52vh] overflow-y-auto px-2 py-6 sm:px-6">
              <div className="space-y-2">
                {availableTracks.map(track => {
                  const isCurrentTrack = track.path === currentTrack
                  const resolvedTrackDuration =
                    isCurrentTrack && duration > 0 ? duration : track.duration
                  const iconNode =
                    isCurrentTrack && isPlaying ? (
                      <Pause className="h-4 w-4 text-white" />
                    ) : (
                      <Play className="h-4 w-4 text-white" />
                    )
                  const handleTrackAction = () => onTrackPlay?.(track.path)
                  const timeLabel =
                    isCurrentTrack && showRemainingTime
                      ? `-${formatTime(Math.max(0, resolvedTrackDuration - currentTime))}`
                      : formatTime(resolvedTrackDuration)

                  return (
                    <div
                      key={track.path}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors',
                        isCurrentTrack
                          ? 'bg-white/14 text-white'
                          : 'text-white/75 hover:bg-white/8 hover:text-white'
                      )}
                    >
                      <button
                        type="button"
                        onClick={handleTrackAction}
                        title={isCurrentTrack && isPlaying ? '暂停' : '播放'}
                        aria-label={`${isCurrentTrack && isPlaying ? '暂停' : '播放'} ${track.name}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-transparent text-white/80 transition-colors hover:bg-transparent hover:text-white"
                      >
                        {iconNode}
                      </button>
                      <button
                        type="button"
                        onClick={handleTrackAction}
                        className="min-w-0 flex-1 text-left"
                        aria-label={`${isCurrentTrack && isPlaying ? '暂停' : '播放'} ${track.name}`}
                      >
                        <div className="truncate text-sm font-medium">{track.name}</div>
                      </button>
                      {resolvedTrackDuration > 0 &&
                        (isCurrentTrack ? (
                          <button
                            type="button"
                            onClick={() => setShowRemainingTime(prev => !prev)}
                            className="shrink-0 text-xs font-medium text-white/45 tabular-nums transition-colors hover:text-white/80"
                            aria-label={showRemainingTime ? '显示总时长' : '显示剩余时间'}
                            title={showRemainingTime ? '显示总时长' : '显示剩余时间'}
                          >
                            {timeLabel}
                          </button>
                        ) : (
                          <span className="shrink-0 text-xs font-medium text-white/45 tabular-nums">
                            {timeLabel}
                          </span>
                        ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="lyrics" className="m-0 w-full max-w-4xl">
          <div className="pointer-events-none">
            <LyricsDisplayPanel
              lyrics={lyrics}
              activeLyricIndex={activeLyricIndex}
              status={lyricsStatus}
              className="h-[min(52vh,480px)] w-full border-0 bg-transparent p-0 shadow-none"
              bodyClassName="px-2 py-8 sm:px-6"
              lineClassName="text-lg leading-9 text-white/40"
              activeLineClassName="text-2xl font-semibold text-white"
              emptyClassName="text-white/65"
            />
          </div>
        </TabsContent>
      </div>

      {/* 控制层 */}
      <div
        className={cn(
          'pointer-events-none relative z-20 flex h-full flex-col justify-between transition-opacity duration-500',
          showControls || resolvedPanel === 'playlist' ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* 顶部：关闭 + 曲名 */}
        <div className="pointer-events-auto flex flex-col gap-2 bg-gradient-to-b from-black/60 to-transparent p-4 pb-12">
          <div className="flex items-center justify-between gap-4">
            <h2 className="min-w-0 flex-1 truncate text-left text-lg font-medium text-white drop-shadow-lg">
              {trackName}
            </h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
              aria-label="关闭全屏"
              title="关闭全屏"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          {canShowPlaylist && (
            <div className="flex justify-center">
              <TabsList className="h-8 bg-white/10 text-white/55 backdrop-blur-sm">
                <TabsTrigger
                  value="playlist"
                  className="min-w-24 border-0 px-3 text-xs text-white/60 data-[state=active]:bg-white/20 data-[state=active]:text-white dark:data-[state=active]:bg-white/20 dark:data-[state=active]:text-white"
                >
                  歌曲列表
                </TabsTrigger>
                <TabsTrigger
                  value="lyrics"
                  className="min-w-20 border-0 px-3 text-xs text-white/60 data-[state=active]:bg-white/20 data-[state=active]:text-white dark:data-[state=active]:bg-white/20 dark:data-[state=active]:text-white"
                >
                  歌词
                </TabsTrigger>
              </TabsList>
            </div>
          )}
        </div>

        {/* 底部：可视化类型切换 + 播放控件 */}
        <div className="pointer-events-auto space-y-6 bg-gradient-to-t from-black/60 to-transparent pb-12">
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
          <div className="mx-auto grid w-full max-w-4xl grid-cols-5 items-center">
            <div className="flex justify-center">
              <button
                onClick={onToggleMute}
                className="flex h-10 w-10 items-center justify-center text-white/70 transition-colors hover:text-white"
                aria-label={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={onPrevTrack}
                className="flex h-12 w-12 items-center justify-center text-white/80 transition-colors hover:text-white"
                aria-label="上一首"
              >
                <SkipBack className="h-6 w-6" />
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={onTogglePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30"
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={onNextTrack}
                className="flex h-12 w-12 items-center justify-center text-white/80 transition-colors hover:text-white"
                aria-label="下一首"
              >
                <SkipForward className="h-6 w-6" />
              </button>
            </div>
            <div className="flex justify-center">
              {onSetPlayMode && (
                <RepeatModeButton
                  playMode={playMode}
                  onSetPlayMode={onSetPlayMode}
                  onOpenChange={open => {
                    setIsPlayModeMenuOpen(open)
                    if (open) {
                      setShowControls(true)
                      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
                    } else {
                      resetHideTimer()
                    }
                  }}
                  align="end"
                  iconOnly={true}
                  hideChevron={true}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent p-0 text-white/80 hover:bg-transparent hover:text-white"
                  itemClassName="text-sm"
                />
              )}
            </div>
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
    </Tabs>,
    document.body
  )
}
