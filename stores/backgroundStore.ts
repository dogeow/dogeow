import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BackgroundState {
  backgroundImage: string
  setBackgroundImage: (url: string) => void
}

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    set => ({
      backgroundImage: '',
      setBackgroundImage: (url: string) => set({ backgroundImage: url }),
    }),
    {
      name: 'background-storage',
    }
  )
)
