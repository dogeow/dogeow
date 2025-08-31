'use client'

import React, { useState } from 'react'
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

  // 过滤播放列表
  const filteredTracks = availableTracks.filter(track =>
    track.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 获取重复模式图标
  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <Repeat1 className="h-4 w-4" />
      case 'all':
        return <Repeat className="h-4 w-4" />
      default:
        return <Repeat className="h-4 w-4" />
    }
  }

  // 获取重复模式颜色
  const getRepeatColor = () => {
    switch (repeatMode) {
      case 'one':
        return 'text-blue-500'
      case 'all':
        return 'text-green-500'
      default:
        return 'text-muted-foreground'
    }
  }

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
          <Button variant="outline" size="sm" onClick={onShuffle} className="flex-1">
            <Shuffle className="mr-2 h-4 w-4" />
            随机播放
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRepeat}
            className={cn('flex-1', getRepeatColor())}
          >
            {getRepeatIcon()}
            <span className="ml-2">
              {repeatMode === 'one' ? '单曲循环' : repeatMode === 'all' ? '列表循环' : '不循环'}
            </span>
          </Button>
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
            filteredTracks.map((track, index) => {
              const isCurrentTrack = track.path === currentTrack
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
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                    {isCurrentTrack && isPlaying ? (
                      <Pause className="text-primary h-4 w-4" />
                    ) : isCurrentTrack ? (
                      <Play className="text-primary h-4 w-4" />
                    ) : (
                      <span className="text-muted-foreground text-xs">{index + 1}</span>
                    )}
                  </div>

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
                      <div className="text-muted-foreground text-xs">
                        {formatTime(track.duration)}
                      </div>
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
            })
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
