import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MusicState {
  currentTrack: string
  volume: number
  setCurrentTrack: (track: string) => void
  setVolume: (volume: number) => void
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      currentTrack: '/musics/和楽器バンド - 東風破.mp3',
      volume: 0.5,
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
    }),
    {
      name: 'music-storage',
    }
  )
) 