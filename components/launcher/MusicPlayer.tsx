'use client'

import React, { memo } from 'react'
import { Maximize2, Pause, Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import type { MusicPlayerProps } from './types'
import { PlayerControlButton } from './music/PlayerControlButton'
import { TrackInfo } from './music/TrackInfo'
import { ProgressBar } from './music/ProgressBar'
import { LogoButton } from './common/LogoButton'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'

// 图标尺寸常量
const ICON_SIZE = 'h-4 w-4'

// 主播放器组件
export const MusicPlayer = memo(
  ({
    isPlaying,
    audioError,
    currentTime,
    duration,
    availableTracks,
    currentTrack,
    handleProgressChange,
    getCurrentTrackName,
    currentLyric,
    formatTime,
    togglePlay,
    toggleDisplayMode,
    onOpenFullscreen,
  }: MusicPlayerProps) => {
    const router = useRouter()
    const { clearFilters } = useFilterPersistenceStore()
    const isEmptyState = !currentTrack || availableTracks.length === 0
    const handleBackToApps = () => toggleDisplayMode('apps')

    const handleLogoClick = () => {
      clearFilters()
      router.push('/')
    }

    return (
      <div className="relative flex h-full w-full min-w-0 flex-col justify-center overflow-hidden">
        <div className="relative flex w-full min-w-0 items-center gap-2 overflow-hidden">
          <div className="relative z-10 flex shrink-0 items-center gap-3">
            <LogoButton onClick={handleLogoClick} className="h-10 w-10" />
            <BackButton onClick={handleBackToApps} title="返回启动台" className="h-7 w-7" />
            {!isEmptyState && (
              <PlayerControlButton
                onClick={togglePlay}
                title={isPlaying ? '暂停' : '播放'}
                icon={isPlaying ? <Pause className={ICON_SIZE} /> : <Play className={ICON_SIZE} />}
              />
            )}
          </div>

          <div className="relative z-10 min-w-0 flex-1 overflow-hidden">
            <TrackInfo
              isPlaying={isPlaying}
              getCurrentTrackName={getCurrentTrackName}
              currentLyric={currentLyric}
            />
          </div>

          {audioError && !isEmptyState && (
            <div className="relative z-10 shrink-0 truncate rounded bg-amber-50 px-2 py-1 text-xs text-amber-600">
              {audioError.includes('播放列表为空') ? '🎵 暂无音乐' : audioError}
            </div>
          )}

          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2 overflow-hidden">
            {!isEmptyState && (
              <div className="shrink-0 text-xs font-medium text-foreground/80 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            )}
            {onOpenFullscreen && (
              <PlayerControlButton
                onClick={onOpenFullscreen}
                title="全屏"
                icon={<Maximize2 className={ICON_SIZE} />}
              />
            )}
          </div>
        </div>

        {!isEmptyState && (
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            handleProgressChange={handleProgressChange}
          />
        )}
      </div>
    )
  }
)
MusicPlayer.displayName = 'MusicPlayer'
