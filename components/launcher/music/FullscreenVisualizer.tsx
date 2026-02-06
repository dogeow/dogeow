'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, SkipBack, SkipForward, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { AudioVisualizer, type VisualizerType } from './AudioVisualizer'
import { cn } from '@/lib/helpers'

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
}: FullscreenVisualizerProps) {
  const [vizType, setVizType] = useState<VisualizerType>('spectrum')
  const [showControls, setShowControls] = useState(true)
  const [hideTimer, setHideTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

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
        <div className="space-y-6 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
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
            <div className="w-10" />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
