import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MusicTrack {
  path: string
  name: string
  duration: number
}

// 播放模式类型
export type RepeatMode = 'none' | 'all' | 'one'
export type ShuffleMode = 'off' | 'on'

interface MusicState {
  currentTrack: string
  volume: number
  availableTracks: MusicTrack[]
  isPlaying: boolean
  repeatMode: RepeatMode
  shuffleMode: ShuffleMode
  setCurrentTrack: (track: string) => void
  setVolume: (volume: number) => void
  setAvailableTracks: (tracks: MusicTrack[]) => void
  setIsPlaying: (isPlaying: boolean) => void
  setRepeatMode: (mode: RepeatMode) => void
  setShuffleMode: (mode: ShuffleMode) => void
  toggleRepeatMode: () => void
  toggleShuffleMode: () => void
}

export const useMusicStore = create<MusicState>()(
  persist(
    set => ({
      currentTrack: '', // 移除硬编码的曲目路径
      volume: 0.5,
      availableTracks: [],
      isPlaying: false,
      repeatMode: 'none',
      shuffleMode: 'off',
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
      setAvailableTracks: (tracks: MusicTrack[]) => set({ availableTracks: tracks }),
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
      setRepeatMode: (mode: RepeatMode) => set({ repeatMode: mode }),
      setShuffleMode: (mode: ShuffleMode) => set({ shuffleMode: mode }),
      toggleRepeatMode: () =>
        set(state => {
          // 如果当前是随机播放模式，先关闭随机播放
          if (state.shuffleMode === 'on') {
            return {
              shuffleMode: 'off',
              repeatMode: 'all', // 默认开启列表循环
            }
          }

          // 正常切换循环模式
          switch (state.repeatMode) {
            case 'none':
              return { repeatMode: 'all' }
            case 'all':
              return { repeatMode: 'one' }
            case 'one':
              return { repeatMode: 'none' }
            default:
              return { repeatMode: 'none' }
          }
        }),
      toggleShuffleMode: () =>
        set(state => {
          if (state.shuffleMode === 'off') {
            // 开启随机播放，关闭循环模式
            return {
              shuffleMode: 'on',
              repeatMode: 'none',
            }
          } else {
            // 关闭随机播放，开启列表循环
            return {
              shuffleMode: 'off',
              repeatMode: 'all',
            }
          }
        }),
    }),
    {
      name: 'music-storage',
    }
  )
)
