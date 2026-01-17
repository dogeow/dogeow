import { useEffect } from 'react'
import type { MusicTrack } from '@/stores/musicStore'

interface UseMediaSessionProps {
  currentTrack: string
  availableTracks?: MusicTrack[]
  isPlaying: boolean
  togglePlay: () => void
  switchToPrevTrack: () => void
  switchToNextTrack: () => void
}

export function useMediaSession({
  currentTrack,
  availableTracks,
  isPlaying,
  togglePlay,
  switchToPrevTrack,
  switchToNextTrack,
}: UseMediaSessionProps) {
  // Media Session API 支持
  useEffect(() => {
    if ('mediaSession' in navigator) {
      const updateMediaSession = () => {
        if (currentTrack && availableTracks && availableTracks.length > 0) {
          const currentTrackInfo = availableTracks.find(track => track.path === currentTrack)

          if (currentTrackInfo) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: currentTrackInfo.name || '未知歌曲',
              artist: '本地音乐播放器',
              album: '本地音乐',
            })
          }
        }

        // 设置媒体会话动作处理程序
        navigator.mediaSession.setActionHandler('play', () => {
          togglePlay()
        })

        navigator.mediaSession.setActionHandler('pause', () => {
          togglePlay()
        })

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          switchToPrevTrack()
        })

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          switchToNextTrack()
        })

        // 更新播放状态
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
      }

      updateMediaSession()

      // 监听播放状态变化
      const handlePlayStateChange = () => {
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
        }
      }

      // 这里我们需要监听状态变化，但由于没有直接的状态监听器，我们使用定时器
      const interval = setInterval(() => {
        handlePlayStateChange()
      }, 1000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [currentTrack, availableTracks, isPlaying, togglePlay, switchToPrevTrack, switchToNextTrack])
}
