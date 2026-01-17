import React, { memo } from 'react'
import { Play, Pause } from 'lucide-react'
import { cn } from '@/lib/helpers'
import type { MusicTrack } from '@/stores/musicStore'

interface PlaylistTrackItemProps {
  track: MusicTrack
  index: number
  isCurrentTrack: boolean
  isPlaying: boolean
  onTrackSelect: (trackPath: string) => void
  formatTime: (seconds: number) => string
}

// 渲染单个歌曲项
export const PlaylistTrackItem = memo(
  ({
    track,
    index,
    isCurrentTrack,
    isPlaying,
    onTrackSelect,
    formatTime,
  }: PlaylistTrackItemProps) => {
    let iconNode = null
    if (isCurrentTrack && isPlaying) {
      iconNode = <Play className="text-primary h-4 w-4" />
    } else if (isCurrentTrack) {
      iconNode = <Pause className="text-primary h-4 w-4" />
    } else {
      iconNode = (
        <span className="text-muted-foreground inline-block w-4 text-center text-xs tabular-nums">
          {index + 1}
        </span>
      )
    }

    return (
      <div
        className={cn(
          'hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 transition-colors',
          isCurrentTrack ? 'bg-accent/50 border-primary/20' : 'border-transparent'
        )}
        onClick={() => onTrackSelect(track.path)}
      >
        {/* 播放状态图标 - 固定宽度避免文字移位 */}
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center">{iconNode}</div>
        {/* 歌曲信息 */}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate text-sm font-medium',
              isCurrentTrack ? 'text-primary' : 'text-foreground'
            )}
          >
            {track.name}
          </div>
          {track.duration > 0 && (
            <div className="text-muted-foreground text-[11px]">{formatTime(track.duration)}</div>
          )}
        </div>
      </div>
    )
  }
)

PlaylistTrackItem.displayName = 'PlaylistTrackItem'
