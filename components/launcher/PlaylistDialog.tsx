'use client'

import React, { useState, useMemo } from 'react'
import { Play, Pause, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  onTrackSelect: (trackPath: string) => void
  onTogglePlay: () => void
  onTogglePlayMode: () => void
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
  onTrackSelect,
  onTogglePlay,
  onTogglePlayMode,
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

        {/* 底部控制栏 */}
        <div className="flex flex-shrink-0 items-center gap-2 border-t pt-4">
          <RepeatModeButton playMode={playMode} onTogglePlayMode={onTogglePlayMode} />
          <Button onClick={onTogglePlay} disabled={availableTracks.length === 0} className="flex-1">
            {isPlaying ? (
              <>
                <Play className="mr-2 h-4 w-4" />
                播放
              </>
            ) : (
              <>
                <Pause className="mr-2 h-4 w-4" />
                暂停
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
