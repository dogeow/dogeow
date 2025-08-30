import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MusicTrack {
  path: string
  name: string
  duration: number
  isHls?: boolean
}

interface MusicState {
  currentTrack: string
  volume: number
  availableTracks: MusicTrack[]
  isPlaying: boolean
  setCurrentTrack: (track: string) => void
  setVolume: (volume: number) => void
  setAvailableTracks: (tracks: MusicTrack[]) => void
  setIsPlaying: (isPlaying: boolean) => void
}

export const useMusicStore = create<MusicState>()(
  persist(
    set => ({
      currentTrack: '', // 移除硬编码的曲目路径
      volume: 0.5,
      availableTracks: [],
      isPlaying: false,
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
      setAvailableTracks: (tracks: MusicTrack[]) => set({ availableTracks: tracks }),
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
    }),
    {
      name: 'music-storage',
    }
  )
)
