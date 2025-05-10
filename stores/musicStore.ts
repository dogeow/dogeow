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
      currentTrack: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3',
      volume: 0.5,
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
    }),
    {
      name: 'music-storage',
    }
  )
) 