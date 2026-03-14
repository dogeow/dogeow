'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AudioVisualizer, type VisualizerType } from './visualizer'
import { cn } from '@/lib/helpers'
import { Tabs } from '@/components/ui/tabs'
import type { MusicTrack, PlayMode } from '@/stores/musicStore'
import type { LyricLine } from './lyrics'
import type { LyricsState } from './useTrackLyrics'
import { FullscreenVisualizerControls } from './FullscreenVisualizerControls'
import { FullscreenVisualizerContent } from './FullscreenVisualizerContent'

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
  activePanel?: 'lyrics' | 'playlist'
  onActivePanelChange?: (panel: 'lyrics' | 'playlist') => void
}

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
  activePanel: controlledPanel,
  onActivePanelChange,
}: FullscreenVisualizerProps) {
  const [vizType, setVizType] = useState<VisualizerType>('spectrum')
  const [showControls, setShowControls] = useState(true)
  const [activePanel, setActivePanel] = useState<'lyrics' | 'playlist'>(
    controlledPanel ?? 'playlist'
  )
  const [isPlayModeMenuOpen, setIsPlayModeMenuOpen] = useState(false)
  const [showRemainingTime, setShowRemainingTime] = useState(false)
  const [isLandscape, setIsLandscape] = useState(false)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const canShowPlaylist = Boolean((onTrackPlay || onTrackSelect) && availableTracks.length > 0)
  const resolvedPanel = canShowPlaylist ? (controlledPanel ?? activePanel) : 'lyrics'

  useEffect(() => {
    if (controlledPanel) {
      setActivePanel(controlledPanel)
    }
  }, [controlledPanel])

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
      onValueChange={value => {
        const nextPanel = value as 'lyrics' | 'playlist'
        setActivePanel(nextPanel)
        onActivePanelChange?.(nextPanel)
      }}
      className="safe-area-top safe-area-right safe-area-bottom safe-area-left fixed inset-0 z-[100] flex flex-col gap-0 bg-black text-white"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      {/* 可视化背景 - 全屏 */}
      <div className="absolute inset-0 bg-black">
        {analyserNode && (
          <AudioVisualizer
            analyserNode={analyserNode}
            isPlaying={isPlaying}
            type={vizType}
            barCount={64}
            showGradient={true}
            className="h-full w-full bg-black"
          />
        )}
      </div>

      <div
        className={cn(
          'absolute inset-x-0 z-10 flex justify-center px-4 sm:px-8 lg:px-16',
          isLandscape ? 'top-28 bottom-24 items-stretch' : 'top-1/2 -translate-y-1/2'
        )}
      >
        <FullscreenVisualizerContent
          canShowPlaylist={canShowPlaylist}
          availableTracks={availableTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          duration={duration}
          currentTime={currentTime}
          showRemainingTime={showRemainingTime}
          setShowRemainingTime={setShowRemainingTime}
          formatTime={formatTime}
          onTrackPlay={onTrackPlay}
          lyrics={lyrics}
          activeLyricIndex={activeLyricIndex}
          lyricsStatus={lyricsStatus}
          resolvedPanel={resolvedPanel}
          isLandscape={isLandscape}
        />
      </div>

      <FullscreenVisualizerControls
        showControls={showControls}
        resolvedPanel={resolvedPanel}
        isLandscape={isLandscape}
        canShowPlaylist={canShowPlaylist}
        vizType={vizType}
        setVizType={setVizType}
        trackName={trackName}
        onClose={onClose}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        onPrevTrack={onPrevTrack}
        onTogglePlay={onTogglePlay}
        isPlaying={isPlaying}
        onNextTrack={onNextTrack}
        onSetPlayMode={onSetPlayMode}
        playMode={playMode}
        onPlayModeMenuOpenChange={open => {
          setIsPlayModeMenuOpen(open)
          if (open) {
            setShowControls(true)
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
          } else {
            resetHideTimer()
          }
        }}
        currentTime={currentTime}
        duration={duration}
        handleProgressChange={handleProgressChange}
        formatTime={formatTime}
      />
    </Tabs>,
    document.body
  )
}
