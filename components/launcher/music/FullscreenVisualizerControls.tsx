'use client'

import React from 'react'
import { X, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/helpers'
import type { PlayMode } from '@/stores/musicStore'
import { RepeatModeButton } from './RepeatModeButton'
import type { VisualizerType } from './visualizer'

export const VISUALIZER_TYPES: { type: VisualizerType; label: string }[] = [
  { type: 'spectrum', label: '频谱' },
  { type: 'bars6', label: '宽柱' },
  { type: 'particles', label: '星空' },
  { type: 'silk', label: '雨' },
]

interface FullscreenVisualizerControlsProps {
  showControls: boolean
  resolvedPanel: 'lyrics' | 'playlist'
  isLandscape: boolean
  canShowPlaylist: boolean
  vizType: VisualizerType
  setVizType: (type: VisualizerType) => void
  trackName: string
  onClose: () => void
  isMuted: boolean
  onToggleMute: () => void
  onPrevTrack: () => void
  onTogglePlay: () => void
  isPlaying: boolean
  onNextTrack: () => void
  onSetPlayMode?: (mode: PlayMode) => void
  playMode: PlayMode
  onPlayModeMenuOpenChange: (open: boolean) => void
  currentTime: number
  duration: number
  handleProgressChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  formatTime: (time: number) => string
}

function PlaylistTabs() {
  return (
    <TabsList className="h-8 bg-white/10 text-white/55 backdrop-blur-sm">
      <TabsTrigger
        value="playlist"
        className="min-w-24 border-0 px-3 text-xs text-white/60 data-[state=active]:bg-white/20 data-[state=active]:text-white"
      >
        歌曲列表
      </TabsTrigger>
      <TabsTrigger
        value="lyrics"
        className="min-w-20 border-0 px-3 text-xs text-white/60 data-[state=active]:bg-white/20 data-[state=active]:text-white"
      >
        歌词
      </TabsTrigger>
    </TabsList>
  )
}

function VisualizerButtons({
  vizType,
  setVizType,
  isLandscape,
}: {
  vizType: VisualizerType
  setVizType: (type: VisualizerType) => void
  isLandscape: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {VISUALIZER_TYPES.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => setVizType(type)}
          type="button"
          className={cn(
            isLandscape
              ? 'rounded-full px-3 py-1.5 text-[11px] font-medium transition-all'
              : 'rounded-full px-4 py-1.5 text-xs font-medium transition-all',
            vizType === type
              ? 'bg-white/25 text-white backdrop-blur-sm'
              : isLandscape
                ? 'bg-white/8 text-white/65 hover:bg-white/16 hover:text-white'
                : 'text-white/60 hover:text-white/90'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function FullscreenVisualizerControls({
  showControls,
  resolvedPanel,
  isLandscape,
  canShowPlaylist,
  vizType,
  setVizType,
  trackName,
  onClose,
  isMuted,
  onToggleMute,
  onPrevTrack,
  onTogglePlay,
  isPlaying,
  onNextTrack,
  onSetPlayMode,
  playMode,
  onPlayModeMenuOpenChange,
  currentTime,
  duration,
  handleProgressChange,
  formatTime,
}: FullscreenVisualizerControlsProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-20',
        showControls || resolvedPanel === 'playlist' ? 'opacity-100' : 'opacity-0'
      )}
    >
      <div
        className={cn(
          'pointer-events-auto absolute inset-x-0 top-0 flex flex-col gap-2 bg-gradient-to-b from-black/60 to-transparent',
          isLandscape ? 'px-3 pt-3 pb-4' : 'p-4 pb-12'
        )}
      >
        {isLandscape ? (
          <div className="relative grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
            <div className="flex justify-center">
              <VisualizerButtons vizType={vizType} setVizType={setVizType} isLandscape={true} />
            </div>
            {canShowPlaylist && (
              <div className="flex justify-center">
                <PlaylistTabs />
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <h2 className="min-w-0 max-w-full truncate text-center text-lg font-medium text-white drop-shadow-lg">
                {trackName}
              </h2>
            </div>
            <div className="absolute right-0 flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="关闭全屏"
                title="关闭全屏"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <h2 className="min-w-0 px-12 text-center text-lg font-medium text-white drop-shadow-lg">
                {trackName}
              </h2>
              <button
                onClick={onClose}
                className="absolute right-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
                aria-label="关闭全屏"
                title="关闭全屏"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
            <VisualizerButtons vizType={vizType} setVizType={setVizType} isLandscape={false} />
          </>
        )}
      </div>

      <div
        className={cn(
          'pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent',
          isLandscape ? 'space-y-2 px-3 pb-4' : 'space-y-6 pb-12'
        )}
      >
        {canShowPlaylist && !isLandscape && (
          <div className="flex justify-center">
            <PlaylistTabs />
          </div>
        )}

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
                onOpenChange={onPlayModeMenuOpenChange}
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
              <div className="absolute inset-0 rounded-full bg-white/20" />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/80 transition-all duration-100"
                style={{ width: `${((currentTime / duration) * 100).toFixed(2)}%` }}
              />
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
  )
}
