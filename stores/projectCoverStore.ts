import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ProjectCoverMode = 'image' | 'color' | 'none'

export const PROJECT_COVER_MODE_OPTIONS = [
  { value: 'image', label: '图片' },
  { value: 'color', label: '纯色' },
  { value: 'none', label: '无' },
] as const satisfies ReadonlyArray<{ value: ProjectCoverMode; label: string }>

interface ProjectCoverState {
  projectCoverMode: ProjectCoverMode
  setProjectCoverMode: (mode: ProjectCoverMode) => void
}

const normalizeProjectCoverMode = (value: unknown): ProjectCoverMode => {
  if (value === 'image' || value === 'color' || value === 'none') return value
  if (value === true) return 'image'
  if (value === false) return 'none'
  return 'image'
}

export const useProjectCoverStore = create<ProjectCoverState>()(
  persist(
    set => ({
      projectCoverMode: 'image',
      setProjectCoverMode: (mode: ProjectCoverMode) => set({ projectCoverMode: mode }),
    }),
    {
      name: 'project-cover-storage',
      version: 1,
      migrate: persistedState => {
        const state = persistedState as
          | { projectCoverMode?: unknown; showProjectCovers?: unknown }
          | undefined

        return {
          projectCoverMode: normalizeProjectCoverMode(
            state?.projectCoverMode ?? state?.showProjectCovers
          ),
        }
      },
      merge: (persistedState, currentState) => {
        const state = persistedState as
          | { projectCoverMode?: unknown; showProjectCovers?: unknown }
          | undefined

        return {
          ...currentState,
          projectCoverMode: normalizeProjectCoverMode(
            state?.projectCoverMode ?? state?.showProjectCovers
          ),
        }
      },
    }
  )
)
