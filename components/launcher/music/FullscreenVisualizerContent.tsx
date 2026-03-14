'use client'

import React from 'react'
import { Play, Pause } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/helpers'
import type { MusicTrack } from '@/stores/musicStore'
import type { LyricLine } from './lyrics'
import type { LyricsState } from './useTrackLyrics'
import { LyricsDisplayPanel } from './LyricsDisplayPanel'

interface FullscreenVisualizerContentProps {
  canShowPlaylist: boolean
  availableTracks: MusicTrack[]
  currentTrack: string
  isPlaying: boolean
  duration: number
  currentTime: number
  showRemainingTime: boolean
  setShowRemainingTime: React.Dispatch<React.SetStateAction<boolean>>
  formatTime: (time: number) => string
  onTrackPlay?: (trackPath: string) => void
  lyrics: LyricLine[]
  activeLyricIndex: number
  lyricsStatus: LyricsState
  resolvedPanel: 'lyrics' | 'playlist'
  isLandscape: boolean
}

export function FullscreenVisualizerContent({
  canShowPlaylist,
  availableTracks,
  currentTrack,
  isPlaying,
  duration,
  currentTime,
  showRemainingTime,
  setShowRemainingTime,
  formatTime,
  onTrackPlay,
  lyrics,
  activeLyricIndex,
  lyricsStatus,
  resolvedPanel,
  isLandscape,
}: FullscreenVisualizerContentProps) {
  return (
    <>
      {canShowPlaylist && (
        <TabsContent value="playlist" className="m-0 w-full max-w-3xl">
          <div
            className={cn(
              'overflow-y-auto px-2 sm:px-6',
              isLandscape ? 'max-h-full py-2 sm:px-4' : 'max-h-[52vh] py-6'
            )}
          >
            <div className="space-y-1.5">
              {availableTracks.map(track => {
                const isCurrentTrack = track.path === currentTrack
                const resolvedTrackDuration =
                  isCurrentTrack && duration > 0 ? duration : track.duration
                const iconNode =
                  isCurrentTrack && isPlaying ? (
                    <Pause className="h-4 w-4 text-white" />
                  ) : (
                    <Play className="h-4 w-4 text-white" />
                  )
                const handleTrackAction = () => onTrackPlay?.(track.path)
                const timeLabel =
                  isCurrentTrack && showRemainingTime
                    ? `-${formatTime(Math.max(0, resolvedTrackDuration - currentTime))}`
                    : formatTime(resolvedTrackDuration)

                return (
                  <div
                    key={track.path}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-left transition-colors',
                      isCurrentTrack
                        ? 'bg-white/14 text-white'
                        : 'text-white/75 hover:bg-white/8 hover:text-white'
                    )}
                  >
                    <button
                      type="button"
                      onClick={handleTrackAction}
                      title={isCurrentTrack && isPlaying ? '暂停' : '播放'}
                      aria-label={`${isCurrentTrack && isPlaying ? '暂停' : '播放'} ${track.name}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-transparent text-white/80 transition-colors hover:bg-transparent hover:text-white"
                    >
                      {iconNode}
                    </button>
                    <button
                      type="button"
                      onClick={handleTrackAction}
                      className="min-w-0 flex-1 text-left"
                      aria-label={`${isCurrentTrack && isPlaying ? '暂停' : '播放'} ${track.name}`}
                    >
                      <div className="truncate text-[13px] font-medium">{track.name}</div>
                    </button>
                    {resolvedTrackDuration > 0 &&
                      (isCurrentTrack ? (
                        <button
                          type="button"
                          onClick={() => setShowRemainingTime(prev => !prev)}
                          className="shrink-0 text-xs font-medium text-white/45 tabular-nums transition-colors hover:text-white/80"
                          aria-label={showRemainingTime ? '显示总时长' : '显示剩余时间'}
                          title={showRemainingTime ? '显示总时长' : '显示剩余时间'}
                        >
                          {timeLabel}
                        </button>
                      ) : (
                        <span className="shrink-0 text-xs font-medium text-white/45 tabular-nums">
                          {timeLabel}
                        </span>
                      ))}
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>
      )}

      <TabsContent value="lyrics" className="m-0 min-h-0 h-full w-full max-w-4xl self-stretch">
        <div className="pointer-events-none h-full min-h-0">
          <LyricsDisplayPanel
            lyrics={lyrics}
            activeLyricIndex={activeLyricIndex}
            status={lyricsStatus}
            currentTime={currentTime}
            className={cn(
              'w-full border-0 bg-transparent p-0 shadow-none',
              isLandscape ? 'h-full' : 'h-[min(52vh,480px)]'
            )}
            bodyClassName={cn('px-2 sm:px-6', isLandscape ? 'py-0' : 'py-2')}
            lineClassName={cn(
              'text-white/40',
              isLandscape ? 'text-sm leading-7' : 'text-lg leading-9'
            )}
            activeLineClassName={cn(
              'font-semibold text-white',
              isLandscape ? 'text-lg' : 'text-2xl'
            )}
            emptyClassName="text-white/65"
            syncKey={`${resolvedPanel}-${currentTrack}-${activeLyricIndex}-${isLandscape}`}
          />
        </div>
      </TabsContent>
    </>
  )
}
