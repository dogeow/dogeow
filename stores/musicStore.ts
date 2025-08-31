import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MusicTrack {
  path: string
  name: string
  duration: number
}

// 播放模式类型 - 合并了循环和随机播放
export type PlayMode = 'none' | 'all' | 'one' | 'shuffle'

interface MusicState {
  currentTrack: string
  volume: number
  availableTracks: MusicTrack[]
  isPlaying: boolean
  playMode: PlayMode
  setCurrentTrack: (track: string) => void
  setVolume: (volume: number) => void
  setAvailableTracks: (tracks: MusicTrack[]) => void
  setIsPlaying: (isPlaying: boolean) => void
  setPlayMode: (mode: PlayMode) => void
  togglePlayMode: () => void
}

export const useMusicStore = create<MusicState>()(
  persist(
    set => ({
      currentTrack: '', // 移除硬编码的曲目路径
      volume: 0.5,
      availableTracks: [],
      isPlaying: false,
      playMode: 'none',
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
      setAvailableTracks: (tracks: MusicTrack[]) => set({ availableTracks: tracks }),
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
      setPlayMode: (mode: PlayMode) => set({ playMode: mode }),
      togglePlayMode: () =>
        set(state => {
          // 切换播放模式：none -> all -> one -> shuffle -> none
          switch (state.playMode) {
            case 'none':
              return { playMode: 'all' }
            case 'all':
              return { playMode: 'one' }
            case 'one':
              return { playMode: 'shuffle' }
            case 'shuffle':
              return { playMode: 'none' }
            default:
              return { playMode: 'none' }
          }
        }),
    }),
    {
      name: 'music-storage',
    }
  )
)
