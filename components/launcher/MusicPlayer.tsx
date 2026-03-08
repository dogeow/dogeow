'use client'

import React, { useState, memo } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, List } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { BackButton } from '@/components/ui/back-button'
import type { MusicPlayerProps } from './types'
import { PlaylistDialog } from './PlaylistDialog'
import { PlayerControlButton } from './music/PlayerControlButton'
import { TrackInfo } from './music/TrackInfo'
import { ProgressBar } from './music/ProgressBar'
import { LogoButton } from './common/LogoButton'
import { useFilterPersistenceStore } from '@/app/thing/stores/filterPersistenceStore'

// 图标尺寸常量
const ICON_SIZE = 'h-4 w-4'
const PLAY_BUTTON_SIZE = 'h-8 w-8'

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
    analyserNode,
    toggleMute,
    switchToPrevTrack,
    switchToNextTrack,
    togglePlay,
    handleProgressChange,
    getCurrentTrackName,
    formatTime,
    toggleDisplayMode,
    onTrackSelect,
    onSetPlayMode,
    onOpenFullscreen,
  }: MusicPlayerProps) => {
    const router = useRouter()
    const { clearFilters } = useFilterPersistenceStore()
    const [playlistOpen, setPlaylistOpen] = useState(false)
    const isEmptyState = !currentTrack || availableTracks.length === 0
    const handleBackToApps = () => toggleDisplayMode('apps')

    const handleLogoClick = () => {
      clearFilters()
      router.push('/')
    }

    React.useEffect(() => {
      const handleOpenPlaylist = () => {
        setPlaylistOpen(true)
      }

      window.addEventListener('music-player:open-playlist', handleOpenPlaylist)
      return () => window.removeEventListener('music-player:open-playlist', handleOpenPlaylist)
    }, [])

    return (
      <>
        <div className="relative flex w-full min-w-0 items-center gap-2 overflow-hidden">
          {/* 内容层 - 控制按钮和文本 */}
          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <LogoButton onClick={handleLogoClick} className="h-10 w-10" />
            <BackButton onClick={handleBackToApps} title="返回启动台" className="mr-0" />
          </div>

          <div className="relative z-10 min-w-0 flex-1 overflow-hidden">
            <TrackInfo
              isPlaying={isPlaying}
              getCurrentTrackName={getCurrentTrackName}
              currentTime={currentTime}
              duration={duration}
              formatTime={formatTime}
            />
          </div>

          {audioError && !isEmptyState && (
            <div className="relative z-10 shrink-0 truncate rounded bg-amber-50 px-2 py-1 text-xs text-amber-600">
              {audioError.includes('播放列表为空') ? '🎵 暂无音乐' : audioError}
            </div>
          )}

          <div className="relative z-10 ml-auto flex shrink-0 items-center gap-1">
            <PlayerControlButton
              onClick={toggleMute}
              title={isMuted ? '取消静音' : '静音'}
              icon={isMuted ? <VolumeX className={ICON_SIZE} /> : <Volume2 className={ICON_SIZE} />}
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

        {!isEmptyState && (
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            handleProgressChange={handleProgressChange}
          />
        )}

        {/* 播放列表弹窗 */}
        <PlaylistDialog
          open={playlistOpen}
          onOpenChange={setPlaylistOpen}
          availableTracks={availableTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isMuted={isMuted}
          onTrackSelect={onTrackSelect}
          onTogglePlay={togglePlay}
          onSetPlayMode={onSetPlayMode}
          onToggleMute={toggleMute}
          onPrevTrack={switchToPrevTrack}
          onNextTrack={switchToNextTrack}
          playMode={playMode}
          onOpenFullscreen={onOpenFullscreen}
        />
      </>
    )
  }
)
MusicPlayer.displayName = 'MusicPlayer'
