'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Play, Pause, Music, Shuffle, Repeat, Repeat1 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MusicTrack } from '@/stores/musicStore'
import { cn } from '@/lib/helpers'

interface PlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableTracks: MusicTrack[]
  currentTrack: string
  isPlaying: boolean
  onTrackSelect: (trackPath: string) => void
  onTogglePlay: () => void
  onShuffle: () => void
  onRepeat: () => void
  repeatMode: 'none' | 'all' | 'one'
}

// 播放模式按钮组件（避免三元嵌套写法）
function RepeatModeButton(props: {
  repeatMode: 'none' | 'all' | 'one'
  onShuffle: () => void
  onRepeat: () => void
}) {
  const { repeatMode, onShuffle, onRepeat } = props

  // 切换播放模式
  const handleClick = useCallback(() => {
    if (repeatMode === 'none') {
      onShuffle()
      onRepeat()
    } else {
      onRepeat()
    }
  }, [repeatMode, onShuffle, onRepeat])

  let icon = null
  let label = ''
  if (repeatMode === 'one') {
    icon = <Repeat1 className="mr-2 h-4 w-4" />
    label = '单曲循环'
  } else if (repeatMode === 'all') {
    icon = <Repeat className="mr-2 h-4 w-4" />
    label = '列表循环'
  } else {
    icon = <Shuffle className="mr-2 h-4 w-4" />
    label = '随机播放'
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="flex-1">
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
  onShuffle,
  onRepeat,
  repeatMode,
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
        iconNode = <Pause className="text-primary h-4 w-4" />
      } else if (isCurrentTrack) {
        iconNode = <Play className="text-primary h-4 w-4" />
      } else {
        iconNode = <span className="text-muted-foreground text-xs">{index + 1}</span>
      }

      return (
        <div
          key={track.path}
          className={cn(
            'hover:bg-accent flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors',
            isCurrentTrack && 'bg-accent/50 border-primary/20 border'
          )}
          onClick={() => onTrackSelect(track.path)}
        >
          {/* 播放状态图标 */}
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">{iconNode}</div>
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
              <div className="text-muted-foreground text-xs">{formatTime(track.duration)}</div>
            )}
          </div>
          {/* 当前播放指示器 */}
          {isCurrentTrack && (
            <div className="flex-shrink-0">
              <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
            </div>
          )}
        </div>
      )
    },
    [currentTrack, isPlaying, onTrackSelect]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            播放列表 ({availableTracks.length})
          </DialogTitle>
        </DialogHeader>

        {/* 控制按钮 */}
        <div className="mb-4 flex flex-shrink-0 items-center gap-2">
          <RepeatModeButton repeatMode={repeatMode} onShuffle={onShuffle} onRepeat={onRepeat} />
        </div>

        {/* 搜索框 */}
        <div className="mb-4 flex-shrink-0">
          <input
            type="text"
            placeholder="搜索歌曲..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
          />
        </div>

        {/* 播放列表 */}
        <div className="flex-1 space-y-1 overflow-y-auto">
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
          <Button onClick={onTogglePlay} disabled={availableTracks.length === 0} className="flex-1">
            {isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                暂停
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                播放
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
