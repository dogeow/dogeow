'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SlidersHorizontal,
} from 'lucide-react'
import { AudioVisualizer, type VisualizerType } from './visualizer'
import { cn } from '@/lib/helpers'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { MusicTrack, PlayMode } from '@/stores/musicStore'
import type { LyricLine } from './lyrics'
import type { LyricsState } from './useTrackLyrics'
import { LyricsDisplayPanel } from './LyricsDisplayPanel'
import { RepeatModeButton } from './RepeatModeButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  const [isVisualizerMenuOpen, setIsVisualizerMenuOpen] = useState(false)
  const [showRemainingTime, setShowRemainingTime] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canShowPlaylist = Boolean((onTrackPlay || onTrackSelect) && availableTracks.length > 0)
  const resolvedPanel = canShowPlaylist ? activePanel : 'lyrics'

  // 自动隐藏控件
  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    if (resolvedPanel === 'playlist' || isPlayModeMenuOpen || isVisualizerMenuOpen) {
      return
    }
    const timer = setTimeout(() => setShowControls(false), 3000)
    hideTimerRef.current = timer
  }, [isPlayModeMenuOpen, isVisualizerMenuOpen, resolvedPanel])

  useEffect(() => {
    resetHideTimer()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [resetHideTimer])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(orientation: landscape)')
    const syncOrientation = () => setIsLandscape(mediaQuery.matches)

    syncOrientation()
    mediaQuery.addEventListener('change', syncOrientation)

    return () => mediaQuery.removeEventListener('change', syncOrientation)
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
    <Tabs
      value={resolvedPanel}
      onValueChange={value => setActivePanel(value as 'lyrics' | 'playlist')}
      className="bg-background safe-area-top safe-area-right safe-area-bottom safe-area-left fixed inset-0 z-[100] flex flex-col gap-0"
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

      <div
        className={cn(
          'absolute inset-x-0 z-10 flex justify-center px-4 sm:px-8 lg:px-16',
          isLandscape ? 'top-16 bottom-24 items-stretch' : 'top-1/2 -translate-y-1/2'
        )}
      >
        {canShowPlaylist && (
          <TabsContent value="playlist" className="m-0 w-full max-w-3xl">
            <div
              className={cn(
                'overflow-y-auto px-2 sm:px-6',
                isLandscape ? 'max-h-full py-2 sm:px-4' : 'max-h-[52vh] py-6'
              )}
            >
              <div className="space-y-1.5">
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
                        'flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left transition-colors',
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
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-transparent text-white/80 transition-colors hover:bg-transparent hover:text-white"
                      >
                        {iconNode}
                      </button>
                      <button
                        type="button"
                        onClick={handleTrackAction}
                        className="min-w-0 flex-1 text-left"
                        aria-label={`${isCurrentTrack && isPlaying ? '暂停' : '播放'} ${track.name}`}
                      >
                        <div className="truncate text-[13px] font-medium">{track.name}</div>
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

        <TabsContent value="lyrics" className="m-0 min-h-0 h-full w-full max-w-4xl self-stretch">
          <div className="pointer-events-none h-full min-h-0">
            <LyricsDisplayPanel
              lyrics={lyrics}
              activeLyricIndex={activeLyricIndex}
              status={lyricsStatus}
              className={cn(
                'w-full border-0 bg-transparent p-0 shadow-none',
                isLandscape ? 'h-full' : 'h-[min(52vh,480px)]'
              )}
              bodyClassName={cn('px-2 sm:px-6', isLandscape ? 'py-0' : 'py-2')}
              lineClassName={cn(
                'text-white/40',
                isLandscape ? 'text-sm leading-7' : 'text-lg leading-9'
              )}
              activeLineClassName={cn(
                'font-semibold text-white',
                isLandscape ? 'text-lg' : 'text-2xl'
              )}
              emptyClassName="text-white/65"
              syncKey={`${resolvedPanel}-${currentTrack}-${activeLyricIndex}-${isLandscape}`}
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
        <div
          className={cn(
            'pointer-events-auto flex flex-col gap-2 bg-gradient-to-b from-black/60 to-transparent',
            isLandscape ? 'px-3 pt-3 pb-4' : 'p-4 pb-12'
          )}
        >
          <div className="relative flex items-center gap-4">
            <h2 className="min-w-0 flex-1 truncate text-left text-lg font-medium text-white drop-shadow-lg">
              {trackName}
            </h2>
            {canShowPlaylist && isLandscape && (
              <div className="absolute left-1/2 flex -translate-x-1/2 justify-center">
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
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {isLandscape && (
                <DropdownMenu
                  onOpenChange={open => {
                    setIsVisualizerMenuOpen(open)
                    if (open) {
                      setShowControls(true)
                      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
                    } else {
                      resetHideTimer()
                    }
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 items-center gap-2 rounded-full bg-white/12 px-3 text-[11px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
                      aria-label="切换音乐效果"
                      title="切换音乐效果"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span>
                        {VISUALIZER_TYPES.find(item => item.type === vizType)?.label ?? '频谱'}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="min-w-28 bg-black/85 text-white backdrop-blur-md"
                  >
                    {VISUALIZER_TYPES.map(({ type, label }) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => setVizType(type)}
                        className={cn(
                          'cursor-pointer text-sm text-white/80 focus:bg-white/15 focus:text-white',
                          vizType === type && 'bg-white/12 text-white'
                        )}
                      >
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="关闭全屏"
                title="关闭全屏"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          {canShowPlaylist && !isLandscape && (
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
        <div
          className={cn(
            'pointer-events-auto bg-gradient-to-t from-black/60 to-transparent',
            isLandscape ? 'space-y-2 px-3 pb-4' : 'space-y-6 pb-12'
          )}
        >
          {/* 可视化类型切换 */}
          {!isLandscape && (
            <div className="flex justify-center gap-2">
              {VISUALIZER_TYPES.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => setVizType(type)}
                  className={cn(
                    'rounded-full font-medium transition-all',
                    'px-4 py-1.5 text-xs',
                    vizType === type
                      ? 'bg-white/25 text-white backdrop-blur-sm'
                      : 'text-white/60 hover:text-white/90'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* 播放控件 */}
          <div className="mx-auto grid w-full max-w-4xl grid-cols-5 items-center">
            <div className="flex justify-center">
              <button
                onClick={onToggleMute}
                className={cn(
                  'flex items-center justify-center text-white/70 transition-colors hover:text-white',
                  isLandscape ? 'h-9 w-9' : 'h-10 w-10'
                )}
                aria-label={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? (
                  <VolumeX className={cn(isLandscape ? 'h-[18px] w-[18px]' : 'h-5 w-5')} />
                ) : (
                  <Volume2 className={cn(isLandscape ? 'h-[18px] w-[18px]' : 'h-5 w-5')} />
                )}
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={onPrevTrack}
                className={cn(
                  'flex items-center justify-center text-white/80 transition-colors hover:text-white',
                  isLandscape ? 'h-10 w-10' : 'h-12 w-12'
                )}
                aria-label="上一首"
              >
                <SkipBack className={cn(isLandscape ? 'h-5 w-5' : 'h-6 w-6')} />
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={onTogglePlay}
                className={cn(
                  'flex items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-white/30',
                  isLandscape ? 'h-12 w-12' : 'h-16 w-16'
                )}
                aria-label={isPlaying ? '暂停' : '播放'}
              >
                {isPlaying ? (
                  <Pause className={cn(isLandscape ? 'h-6 w-6' : 'h-8 w-8')} />
                ) : (
                  <Play className={cn('ml-1', isLandscape ? 'h-6 w-6' : 'h-8 w-8')} />
                )}
              </button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={onNextTrack}
                className={cn(
                  'flex items-center justify-center text-white/80 transition-colors hover:text-white',
                  isLandscape ? 'h-10 w-10' : 'h-12 w-12'
                )}
                aria-label="下一首"
              >
                <SkipForward className={cn(isLandscape ? 'h-5 w-5' : 'h-6 w-6')} />
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
                  className={cn(
                    'flex items-center justify-center rounded-full bg-transparent p-0 text-white/80 hover:bg-transparent hover:text-white',
                    isLandscape ? 'h-9 w-9' : 'h-10 w-10'
                  )}
                  itemClassName="text-sm"
                />
              )}
            </div>
          </div>

          {/* 进度条和时间显示 */}
          {handleProgressChange && duration > 0 && (
            <div
              className={cn(
                'flex items-center justify-center gap-2 px-2 sm:px-4 md:px-6 lg:px-8',
                isLandscape && 'gap-1.5'
              )}
            >
              <span
                className={cn(
                  'min-w-[2.5rem] text-right font-medium text-white/80 tabular-nums',
                  isLandscape ? 'text-xs' : 'text-sm'
                )}
              >
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
              <span
                className={cn(
                  'min-w-[2.5rem] font-medium text-white/80 tabular-nums',
                  isLandscape ? 'text-xs' : 'text-sm'
                )}
              >
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
