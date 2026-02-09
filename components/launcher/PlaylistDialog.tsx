'use client'

import React, { useState, useMemo } from 'react'
import { Play, Pause, Music, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MusicTrack, PlayMode } from '@/stores/musicStore'
import { RepeatModeButton } from './music/RepeatModeButton'
import { PlaylistTrackItem } from './music/PlaylistTrackItem'

interface PlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTracks: MusicTrack[]
  currentTrack: string
  isPlaying: boolean
  isMuted?: boolean
  onTrackSelect: (trackPath: string) => void
  onTogglePlay: () => void
  onTogglePlayMode: () => void
  onToggleMute?: () => void
  onPrevTrack?: () => void
  onNextTrack?: () => void
  playMode: PlayMode
}

// 歌曲时间格式化
function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function PlaylistDialog({
  open,
  onOpenChange,
  availableTracks,
  currentTrack,
  isPlaying,
  isMuted,
  onTrackSelect,
  onTogglePlay,
  onTogglePlayMode,
  onToggleMute,
  onPrevTrack,
  onNextTrack,
  playMode,
}: PlaylistDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTracks = useMemo(() => {
    return availableTracks.filter(track =>
      track.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableTracks, searchTerm])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[80vh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden sm:w-full sm:max-w-md"
        onOpenAutoFocus={event => event.preventDefault()}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            播放列表 ({availableTracks.length})
          </DialogTitle>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="mb-3 flex-shrink-0">
          <input
            type="text"
            placeholder="搜索歌曲..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-1.5 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
          />
        </div>

        {/* 播放列表 */}
        <div
          className="flex-1 space-y-0.5 overflow-y-auto pr-2"
          style={{ scrollbarGutter: 'stable' }}
        >
          {filteredTracks.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {searchTerm ? '没有找到匹配的歌曲' : '播放列表为空'}
            </div>
          ) : (
            filteredTracks.map((track, index) => (
              <PlaylistTrackItem
                key={track.path}
                track={track}
                index={index}
                isCurrentTrack={track.path === currentTrack}
                isPlaying={isPlaying}
                onTrackSelect={onTrackSelect}
                formatTime={formatTime}
              />
            ))
          )}
        </div>

        {/* 底部控制栏：分两行布局，第一行为循环和静音，第二行为播放/暂停和上下首 */}
        <div className="flex flex-shrink-0 flex-col border-t pt-4">
          {/* 第一行：循环和静音 - 分别靠两边 */}
          <div className="mb-2 flex items-center justify-between">
            <RepeatModeButton playMode={playMode} onTogglePlayMode={onTogglePlayMode} />
            {onToggleMute && (
              <button
                onClick={onToggleMute}
                className="flex h-9 w-9 shrink-0 items-center justify-center transition-opacity hover:opacity-80"
                aria-label={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* 第二行：播放/暂停和上下首 - 样式与全屏可视化一致 */}
          <div className="flex items-center justify-center gap-6">
            {onPrevTrack && (
              <button
                onClick={onPrevTrack}
                className="text-foreground/80 hover:text-foreground flex h-12 w-12 items-center justify-center transition-colors"
                aria-label="上一首"
              >
                <SkipBack className="h-6 w-6" />
              </button>
            )}
            <button
              onClick={onTogglePlay}
              disabled={availableTracks.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex h-16 w-16 items-center justify-center rounded-full transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              aria-label={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
            </button>
            {onNextTrack && (
              <button
                onClick={onNextTrack}
                className="text-foreground/80 hover:text-foreground flex h-12 w-12 items-center justify-center transition-colors"
                aria-label="下一首"
              >
                <SkipForward className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
