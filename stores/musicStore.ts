import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MusicState {
  isPlaying: boolean
  currentTrack: string
  volume: number
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTrack: (track: string) => void
  setVolume: (volume: number) => void
  togglePlay: () => void
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      isPlaying: false,
      currentTrack: '/music/example.mp3',
      volume: 0.5,
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    }),
    {
      name: 'music-storage',
    }
  )
) 