import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProjectCoverState {
  showProjectCovers: boolean
  setShowProjectCovers: (show: boolean) => void
}

export const useProjectCoverStore = create<ProjectCoverState>()(
  persist(
    set => ({
      showProjectCovers: true,
      setShowProjectCovers: (show: boolean) => set({ showProjectCovers: show }),
    }),
    {
      name: 'project-cover-storage',
    }
  )
)
