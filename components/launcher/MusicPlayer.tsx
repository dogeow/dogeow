'use client'

import React, { useState, memo } from 'react'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, List } from 'lucide-react'
import { BackButton } from '@/components/ui/back-button'
import type { MusicPlayerProps } from './types'
import { PlaylistDialog } from './PlaylistDialog'
import { PlayerControlButton } from './music/PlayerControlButton'
import { TrackInfo } from './music/TrackInfo'
import { ProgressBar } from './music/ProgressBar'

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
