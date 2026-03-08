import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MusicTrack {
  path: string
  name: string
  duration: number
}

// 播放模式类型
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
}

export const useMusicStore = create<MusicState>()(
  persist(
    set => ({
      currentTrack: '',
      volume: 0.5,
      availableTracks: [],
      isPlaying: false,
      playMode: 'none',
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
      setAvailableTracks: (tracks: MusicTrack[]) => set({ availableTracks: tracks }),
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
      setPlayMode: (mode: PlayMode) => set({ playMode: mode }),
    }),
    {
      name: 'music-storage',
    }
  )
)
