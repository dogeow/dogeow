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
      currentTrack: '/musics/I WiSH - 明日への扉~5 years brew version~.mp3',
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
