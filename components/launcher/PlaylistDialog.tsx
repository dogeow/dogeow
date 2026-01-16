'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Play, Pause, Music, Shuffle, Repeat, Repeat1, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MusicTrack, PlayMode } from '@/stores/musicStore'
import { cn } from '@/lib/helpers'

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

// 播放模式按钮组件（简化逻辑）
function RepeatModeButton(props: { playMode: PlayMode; onTogglePlayMode: () => void }) {
  const { playMode, onTogglePlayMode } = props

  // 切换播放模式
  const handleClick = useCallback(() => {
    onTogglePlayMode()
  }, [onTogglePlayMode])

  let icon = null
  let label = ''

  switch (playMode) {
    case 'shuffle':
      icon = <Shuffle className="mr-2 h-4 w-4" />
      label = '随机播放'
      break
    case 'one':
      icon = <Repeat1 className="mr-2 h-4 w-4" />
      label = '单曲循环'
      break
    case 'all':
      icon = <Repeat className="mr-2 h-4 w-4" />
      label = '列表循环'
      break
    default:
      icon = <Ban className="mr-2 h-4 w-4" />
      label = '不循环'
      break
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      {icon}
      <span className="ml-2">{label}</span>
    </Button>
  )
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

  // 渲染单个歌曲项
  const renderTrackItem = useCallback(
    (track: MusicTrack, index: number) => {
      const isCurrentTrack = track.path === currentTrack
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
          key={track.path}
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
    },
    [currentTrack, isPlaying, onTrackSelect]
  )

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
            filteredTracks.map(renderTrackItem)
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
