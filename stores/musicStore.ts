import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MusicTrack {
  path: string
  name: string
  duration: number
}

// 播放模式类型
export type PlayMode = 'none' | 'all' | 'one' | 'shuffle'

interface PersistedMusicState {
  currentTrack: string
  volume: number
  playMode: PlayMode
}

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

const normalizePlayMode = (value: unknown): PlayMode => {
  if (value === 'none' || value === 'all' || value === 'one' || value === 'shuffle') {
    return value
  }

  return 'all'
}

export const useMusicStore = create<MusicState>()(
  persist(
    set => ({
      currentTrack: '',
      volume: 0.5,
      availableTracks: [],
      isPlaying: false,
      playMode: 'all',
      setCurrentTrack: (track: string) => set({ currentTrack: track }),
      setVolume: (volume: number) => set({ volume }),
      setAvailableTracks: (tracks: MusicTrack[]) => set({ availableTracks: tracks }),
      setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
      setPlayMode: (mode: PlayMode) => set({ playMode: mode }),
    }),
    {
      name: 'music-storage',
      version: 1,
      partialize: state => ({
        currentTrack: state.currentTrack,
        volume: state.volume,
        playMode: state.playMode,
      }),
      migrate: persistedState => {
        const state = persistedState as Partial<MusicState> | undefined

        return {
          currentTrack: typeof state?.currentTrack === 'string' ? state.currentTrack : '',
          volume: typeof state?.volume === 'number' ? state.volume : 0.5,
          playMode: normalizePlayMode(state?.playMode),
        } satisfies PersistedMusicState
      },
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<PersistedMusicState> | undefined

        return {
          ...currentState,
          currentTrack:
            typeof state?.currentTrack === 'string'
              ? state.currentTrack
              : currentState.currentTrack,
          volume: typeof state?.volume === 'number' ? state.volume : currentState.volume,
          playMode: normalizePlayMode(state?.playMode ?? currentState.playMode),
          availableTracks: [],
          isPlaying: false,
        }
      },
    }
  )
)
